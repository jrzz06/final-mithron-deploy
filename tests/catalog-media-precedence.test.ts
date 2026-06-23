import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function source(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("catalog media precedence", () => {
  it("keeps Supabase product_media_assets as the sole runtime source of truth", () => {
    const catalog = source("services/catalog.ts");
    expect(catalog).toContain("isSupabaseStorageSrc");
    expect(catalog).not.toContain("wixstatic");
    expect(catalog).toContain("inline JSON image fallback");
  });

  it("tracks published products missing primary media links", () => {
    const catalog = source("services/catalog.ts");
    const admin = source("services/admin.ts");
    expect(catalog).toContain("countPublishedProductsWithoutPrimaryLink");
    expect(admin).toContain("publishedProductsWithoutPrimaryLink");
    expect(admin).toContain("mediaParityVerified");
  });
});
