#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

function loadProjectEnv() {
  for (const envPath of [join(projectRoot, ".env.local"), join(projectRoot, ".env")]) {
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [name, ...parts] = trimmed.split("=");
      if (!name || process.env[name]) continue;
      process.env[name] = parts.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

async function main() {
  loadProjectEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const bucket = "mithron-products";

  const { data: rows, error } = await supabase
    .from("media_assets")
    .select("id, storage_path")
    .eq("bucket", bucket)
    .or("public_url.ilike.%enh-v1%,storage_path.ilike.%enh-v1%");

  if (error) throw new Error(`Failed to list enh-v1 media_assets: ${error.message}`);

  const assets = rows ?? [];
  const paths = [...new Set(assets.map((row) => row.storage_path).filter(Boolean))];
  const ids = assets.map((row) => row.id).filter(Boolean);

  console.log(`Found ${assets.length} enh-v1 media_assets rows (${paths.length} unique storage paths).`);

  let storageFailed = 0;
  for (let index = 0; index < paths.length; index += 20) {
    const batch = paths.slice(index, index + 20);
    const { error: deleteError } = await supabase.storage.from(bucket).remove(batch);
    if (deleteError) {
      storageFailed += batch.length;
      console.warn(`Storage delete batch failed: ${deleteError.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  for (let index = 0; index < ids.length; index += 50) {
    const batch = ids.slice(index, index + 50);
    const { error: rowError } = await supabase.from("media_assets").delete().in("id", batch);
    if (rowError) throw new Error(`media_assets delete failed: ${rowError.message}`);
  }

  const { count, error: countError } = await supabase
    .from("media_assets")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .or("public_url.ilike.%enh-v1%,storage_path.ilike.%enh-v1%");

  if (countError) throw new Error(`Verification failed: ${countError.message}`);

  console.log(
    JSON.stringify(
      {
        deletedMediaAssetRows: ids.length,
        deletedStoragePaths: paths.length - storageFailed,
        storageDeleteFailures: storageFailed,
        remainingEnhV1Rows: count ?? 0
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
