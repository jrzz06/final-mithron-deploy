import { describe, expect, it } from "vitest";
import {
  ACCESSORIES_STOREFRONT_LIMIT,
  CATALOG_CATEGORY_SLUGS,
  filterProductsForCategorySlug,
  getCatalogCategoryDefinition,
  interestSlugToCategorySlug,
  resolveCategoryHrefForInterest
} from "@/lib/catalog-categories";
import type { Product } from "@/config/types";
import { getProducts, getProductsForCategorySlug } from "@/services/catalog";

const hasLiveCatalog =
  process.env.RUN_LIVE_CATALOG_TESTS === "1" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

function product(slug: string, name: string, category = "Accessories"): Product {
  return {
    slug,
    productUrl: `/product/${slug}`,
    workflowStatus: "published",
    isVisible: true,
    name,
    tagline: "Catalog item",
    category,
    price: 100,
    image: { src: "/test.webp", alt: name, width: 100, height: 100 },
    hero: { src: "/test.webp", alt: name, width: 100, height: 100 },
    gallery: [],
    interests: [],
    specs: {},
    variants: [],
    bundles: [],
    hotspots: [],
    story: []
  };
}

describe("catalog categories", () => {
  it("defines the seven storefront category slugs and routes", () => {
    expect(CATALOG_CATEGORY_SLUGS).toEqual([
      "agri-drones",
      "video-drones",
      "creative-drones",
      "survey-drones",
      "surveillance-drones",
      "accessories",
      "global-products"
    ]);

    expect(getCatalogCategoryDefinition("global-products").href).toBe("/category/global-products");
    expect(getCatalogCategoryDefinition("agri-drones").href).toBe("/category/agri-drones");
  });

  it("maps legacy interest slugs to canonical category pages", () => {
    expect(resolveCategoryHrefForInterest("agriculture")).toBe("/category/agri-drones");
    expect(resolveCategoryHrefForInterest("mapping")).toBe("/category/survey-drones");
    expect(resolveCategoryHrefForInterest("industrial-inspection")).toBe("/category/global-products");
    expect(resolveCategoryHrefForInterest("unknown-interest")).toBe("/interest/unknown-interest");
    expect(interestSlugToCategorySlug.components).toBe("accessories");
  });

  it("dedupes the accessories category into a compact storefront shelf", () => {
    const products = [
      product("source-hobbywing-x8-3011-propellers-with-mount-ccw", "Hobbywing X8 3011 Propellers with Mount - CCW"),
      product("source-hobbywing-x8-3011-propellers-cw", "Hobbywing X8 3011 Propellers - CW"),
      product("source-25000mah-6s-smart-battery-600-cycles", "25000mah 6S Smart Battery (600+ cycles)"),
      product("source-25000mah-6s-non-smart-battery-600-cycles", "25000mah 6S non-Smart Battery (600+ cycles)"),
      product("source-v9-flight-controller-for-agriculture-drones", "V9 Flight Controller for Agriculture Drones")
    ];

    expect(filterProductsForCategorySlug(products, "accessories").map((item) => item.slug)).toEqual([
      "source-hobbywing-x8-3011-propellers-with-mount-ccw",
      "source-25000mah-6s-smart-battery-600-cycles",
      "source-v9-flight-controller-for-agriculture-drones"
    ]);
  });

  it("caps accessories to the storefront shelf limit", () => {
    const products = Array.from({ length: ACCESSORIES_STOREFRONT_LIMIT + 10 }, (_, index) => (
      product(`source-accessory-${index}`, `Accessory ${index}`)
    ));

    expect(filterProductsForCategorySlug(products, "accessories")).toHaveLength(ACCESSORIES_STOREFRONT_LIMIT);
  });

  it.skipIf(!hasLiveCatalog)("loads published products for each category slug from the live catalog", async () => {
    const products = await getProducts();

    for (const slug of CATALOG_CATEGORY_SLUGS) {
      const categoryProducts = await getProductsForCategorySlug(slug);
      const filtered = filterProductsForCategorySlug(products, slug);
      expect(categoryProducts).toEqual(filtered);
      expect(categoryProducts.length).toBeGreaterThan(0);
    }
  });

  it.skipIf(!hasLiveCatalog)("includes Global Products in the global-products category", async () => {
    const globalProducts = await getProductsForCategorySlug("global-products");
    expect(globalProducts.map((product) => product.slug)).toEqual(
      expect.arrayContaining(["zio", "pixy-mr", "pixy-lr"])
    );
  });
});
