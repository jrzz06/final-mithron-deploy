const LOCAL_DEV_SITE_URL = "http://127.0.0.1:3000";
const CANONICAL_PRODUCTION_HOST = "final-mithron-deploy.vercel.app";
const CANONICAL_PRODUCTION_ORIGIN = `https://${CANONICAL_PRODUCTION_HOST}`;

/** Default Vercel project URL and per-deployment aliases — never use for auth or canonical URLs. */
const OBSOLETE_VERCEL_HOST_PATTERN =
  /^mithron-flight-systems(?:-[a-z0-9]+)*-kbkbkh\.vercel\.app$/;

function normalizeSiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return LOCAL_DEV_SITE_URL;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export function getCanonicalProductionOrigin() {
  return CANONICAL_PRODUCTION_ORIGIN;
}

export function isCanonicalProductionHost(hostname: string) {
  return hostname.trim().toLowerCase() === CANONICAL_PRODUCTION_HOST;
}

export function isObsoleteAppHost(hostname: string) {
  const host = hostname.trim().toLowerCase();
  if (!host || isCanonicalProductionHost(host)) return false;
  if (host === "localhost" || host.startsWith("127.0.0.1")) return false;
  return OBSOLETE_VERCEL_HOST_PATTERN.test(host);
}

export function sanitizeAppOrigin(value: string | null | undefined) {
  if (!value?.trim()) return null;

  try {
    const url = new URL(normalizeSiteUrl(value));
    if (isObsoleteAppHost(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function resolveSiteUrlString(env: Record<string, string | undefined> = process.env) {
  if (env.VERCEL_ENV === "production") {
    const productionCandidates = [
      env.NEXT_PUBLIC_SITE_URL,
      env.VERCEL_PROJECT_PRODUCTION_URL
    ];

    for (const candidate of productionCandidates) {
      const sanitized = sanitizeAppOrigin(candidate ? normalizeSiteUrl(candidate) : null);
      if (sanitized) return sanitized;
    }

    return CANONICAL_PRODUCTION_ORIGIN;
  }

  const candidates = [
    env.VERCEL_BRANCH_URL,
    env.VERCEL_URL,
    env.NEXT_PUBLIC_SITE_URL
  ];

  for (const candidate of candidates) {
    const sanitized = sanitizeAppOrigin(candidate ? normalizeSiteUrl(candidate) : null);
    if (sanitized) return sanitized;
  }

  return LOCAL_DEV_SITE_URL;
}

export function getSiteUrl(env: Record<string, string | undefined> = process.env) {
  try {
    return new URL(resolveSiteUrlString(env));
  } catch {
    return new URL(LOCAL_DEV_SITE_URL);
  }
}

export function getSiteOrigin(env: Record<string, string | undefined> = process.env) {
  return getSiteUrl(env).origin;
}

export function toAbsoluteUrl(path: string, env: Record<string, string | undefined> = process.env) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, getSiteUrl(env)).toString();
}

export function hasConfiguredSiteUrl(env: Record<string, string | undefined> = process.env) {
  if (sanitizeAppOrigin(env.VERCEL_PROJECT_PRODUCTION_URL)) return true;
  if (sanitizeAppOrigin(env.VERCEL_BRANCH_URL)) return true;
  if (sanitizeAppOrigin(env.VERCEL_URL)) return true;
  return Boolean(sanitizeAppOrigin(env.NEXT_PUBLIC_SITE_URL));
}

/** Client-side auth redirects: prefer configured site URL over transient browser origin. */
export function resolveClientAuthOrigin(env: Record<string, string | undefined> = process.env) {
  const configured = sanitizeAppOrigin(env.NEXT_PUBLIC_SITE_URL);
  if (configured) return configured;

  if (typeof window !== "undefined") {
    const browserOrigin = sanitizeAppOrigin(window.location.origin);
    if (browserOrigin) return browserOrigin;
  }

  return getSiteOrigin(env);
}
