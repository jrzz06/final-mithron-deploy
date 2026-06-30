import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const root = resolve(process.cwd());
const envPath = resolve(root, ".env.local");

function loadEnvFile(path) {
  const env = { ...process.env };
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      env[key] = value;
    }
  } catch {
    // ignore missing file
  }
  return env;
}

const env = loadEnvFile(envPath);
const apiKey = env.GEMINI_API_KEY?.trim();
const textModel = env.GEMINI_TEXT_MODEL?.trim() || "gemma-4-26b-a4b-it";
const imageModel = env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image";

if (!apiKey) {
  console.error("FAIL: GEMINI_API_KEY is not set in .env.local");
  process.exit(1);
}

const report = {
  apiKeyConfigured: true,
  text: { ok: false, model: textModel, sample: null, error: null },
  image: { ok: false, model: imageModel, bytes: 0, output: null, error: null }
};

async function testText() {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(textModel)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "Reply briefly." }] },
        contents: [{ role: "user", parts: [{ text: "Say hello from Mithron in one short sentence." }] }]
      })
    }
  );
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `HTTP ${response.status}`);
  }
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) throw new Error("Empty text response");
  report.text.ok = true;
  report.text.sample = text;
}

async function testImage() {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(imageModel)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "A minimal flat icon of a quadcopter drone on white background." }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
      })
    }
  );
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `HTTP ${response.status}`);
  }
  const inlineData = payload.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
  if (!inlineData?.data) throw new Error("No image bytes returned");
  const outPath = resolve(root, "test-output", "gemini-image-test.png");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, Buffer.from(inlineData.data, "base64"));
  report.image.ok = true;
  report.image.bytes = Buffer.from(inlineData.data, "base64").length;
  report.image.output = outPath;
}

try {
  await testText();
} catch (error) {
  report.text.error = error instanceof Error ? error.message : String(error);
}

try {
  await testImage();
} catch (error) {
  report.image.error = error instanceof Error ? error.message : String(error);
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.text.ok && report.image.ok ? 0 : 1);
