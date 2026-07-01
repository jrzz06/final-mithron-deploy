import { describe, expect, it } from "vitest";
import { resolveCatalogAvailability } from "@/lib/inventory-availability";

describe("order line availability", () => {
  it("reads available quantity from inventory rows by product slug", () => {
    const inventory = [
      { product_slug: "source-8kg-seed-spreader-drone-tc-certified", quantity: 5 },
      { product_slug: "pixy-lr", quantity: 0 }
    ];

    expect(resolveCatalogAvailability("source-8kg-seed-spreader-drone-tc-certified", inventory)).toBe(5);
    expect(resolveCatalogAvailability("pixy-lr", inventory)).toBe(0);
    expect(resolveCatalogAvailability("missing-product", inventory)).toBe(0);
  });

  it("does not depend on warehouse_stock snapshot rows", () => {
    const inventory = [{ product_slug: "agri-drone-x1", quantity: 12 }];
    const warehouseStock: Array<{ product_slug: string; available_quantity: number }> = [];

    expect(resolveCatalogAvailability("agri-drone-x1", inventory)).toBe(12);
    expect(warehouseStock.length).toBe(0);
  });
});
