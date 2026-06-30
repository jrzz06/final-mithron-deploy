import { checkRateLimit } from "./rate-limit.ts";
import { checkDistributedRateLimit } from "./rate-limit-redis.ts";
import {
  estimateGeminiTokens,
  resolveGeminiConservativeLimits,
  resolveGeminiModelProfile
} from "./gemini-model-policy.ts";

type TpmBucket = { tokens: number; resetAt: number };

const tpmBuckets = new Map<string, TpmBucket>();
const lastRequestAt = new Map<string, number>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function reserveCounter(key: string, maxRequests: number, windowMs: number) {
  try {
    return await checkDistributedRateLimit(key, maxRequests, windowMs);
  } catch {
    return checkRateLimit(key, maxRequests, windowMs);
  }
}

function reserveTokenBudget(key: string, needed: number, maxTpm: number) {
  const now = Date.now();
  let entry = tpmBuckets.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { tokens: 0, resetAt: now + 60_000 };
    tpmBuckets.set(key, entry);
  }

  if (entry.tokens + needed > maxTpm) {
    return { allowed: false, retryAfterMs: Math.max(250, entry.resetAt - now) };
  }

  entry.tokens += needed;
  return { allowed: true, retryAfterMs: 0 };
}

export class GeminiRateLimitError extends Error {
  retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = "GeminiRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

export async function acquireGeminiTextSlot(input: {
  model: string;
  system?: string;
  prompt?: string;
  estimatedTokens?: number;
  maxWaitMs?: number;
  env?: Record<string, string | undefined>;
}) {
  const env = input.env ?? process.env;
  const model = resolveGeminiModelProfile(input.model).id;
  const limits = resolveGeminiConservativeLimits(model, env);
  const estimatedTokens = input.estimatedTokens
    ?? estimateGeminiTokens(input.system, input.prompt);
  const maxWaitMs = input.maxWaitMs ?? Number(env.GEMINI_RATE_LIMIT_MAX_WAIT_MS ?? "120000");
  const startedAt = Date.now();
  const waitBudget = () => Math.max(0, maxWaitMs - (Date.now() - startedAt));

  while (waitBudget() > 0) {
    const spacingKey = `gemini:spacing:${model}`;
    const previous = lastRequestAt.get(spacingKey) ?? 0;
    const sinceLast = Date.now() - previous;
    if (sinceLast < limits.minIntervalMs) {
      await sleep(Math.min(limits.minIntervalMs - sinceLast, waitBudget()));
    }

    const rpm = await reserveCounter(`gemini:rpm:${model}`, limits.rpm, 60_000);
    if (!rpm.allowed) {
      await sleep(Math.min(rpm.retryAfterMs ?? 5_000, waitBudget()));
      continue;
    }

    const rpd = await reserveCounter(`gemini:rpd:${model}:${utcDayKey()}`, limits.rpd, 86_400_000);
    if (!rpd.allowed) {
      throw new GeminiRateLimitError(
        `Gemini daily request cap reached for ${model} (${limits.rpd}/day internal limit).`,
        rpd.retryAfterMs
      );
    }

    if (limits.tpm) {
      const tpm = reserveTokenBudget(`gemini:tpm:${model}`, estimatedTokens, limits.tpm);
      if (!tpm.allowed) {
        await sleep(Math.min(tpm.retryAfterMs ?? 5_000, waitBudget()));
        continue;
      }
    }

    lastRequestAt.set(spacingKey, Date.now());
    return { model, estimatedTokens, limits };
  }

  throw new GeminiRateLimitError(
    `Timed out waiting for Gemini rate limit slot (${model}).`,
    waitBudget()
  );
}

export function resetGeminiRateLimitStateForTests() {
  tpmBuckets.clear();
  lastRequestAt.clear();
}
