import type { Product } from "@/config/types";
import {
  GLOBAL_PRODUCTS_CATEGORY,
  isDroneCareShelfProduct,
  isGlobalProductsCategory,
  normalizeProductCategory
} from "@/lib/product-shelf-classification";

export const CATALOG_CATEGORY_SLUGS = [
  "agri-drones",
  "video-drones",
  "creative-drones",
  "survey-drones",
  "surveillance-drones",
  "accessories",
  "global-products"
] as const;

export type CatalogCategorySlug = (typeof CATALOG_CATEGORY_SLUGS)[number];

export type CatalogCategoryDefinition = {
  slug: CatalogCategorySlug;
  label: string;
  href: string;
  legacyHref: string;
  cmsRouteKey: string;
  menuKey: string;
  menuType: "mega" | "compact" | "franchise";
  categoryNames: string[];
};

export const catalogCategoryDefinitions: CatalogCategoryDefinition[] = [
  {
    slug: "agri-drones",
    label: "Agri Drones",
    href: "/category/agri-drones",
    legacyHref: "/agriculture",
    cmsRouteKey: "agriculture",
    menuKey: "agri",
    menuType: "mega",
    categoryNames: ["Agri Drones"]
  },
  {
    slug: "video-drones",
    label: "Video Drones",
    href: "/category/video-drones",
    legacyHref: "/video-drones",
    cmsRouteKey: "videoDrones",
    menuKey: "video",
    menuType: "mega",
    categoryNames: ["Video Drones"]
  },
  {
    slug: "creative-drones",
    label: "Creative Drones",
    href: "/category/creative-drones",
    legacyHref: "/creative-drones",
    cmsRouteKey: "creativeDrones",
    menuKey: "creative",
    menuType: "mega",
    categoryNames: ["Creative Drones"]
  },
  {
    slug: "survey-drones",
    label: "Survey Drones",
    href: "/category/survey-drones",
    legacyHref: "/mapping",
    cmsRouteKey: "mapping",
    menuKey: "survey",
    menuType: "mega",
    categoryNames: []
  },
  {
    slug: "surveillance-drones",
    label: "Surveillance Drones",
    href: "/category/surveillance-drones",
    legacyHref: "/surveillance",
    cmsRouteKey: "surveillance",
    menuKey: "surveillance",
    menuType: "mega",
    categoryNames: ["Surveillance Drones"]
  },
  {
    slug: "accessories",
    label: "Accessories",
    href: "/category/accessories",
    legacyHref: "/accessories",
    cmsRouteKey: "accessories",
    menuKey: "accessories",
    menuType: "compact",
    categoryNames: ["Accessories"]
  },
  {
    slug: "global-products",
    label: "Global Products",
    href: "/category/global-products",
    legacyHref: "/industrial",
    cmsRouteKey: "industrial",
    menuKey: "franchise",
    menuType: "franchise",
    categoryNames: [GLOBAL_PRODUCTS_CATEGORY]
  }
];

const categoryBySlug = new Map(catalogCategoryDefinitions.map((definition) => [definition.slug, definition]));
const categoryByLabel = new Map(catalogCategoryDefinitions.map((definition) => [definition.label, definition]));
const categoryByLegacyHref = new Map(catalogCategoryDefinitions.map((definition) => [definition.legacyHref, definition]));

export function isCatalogCategorySlug(value: string): value is CatalogCategorySlug {
  return categoryBySlug.has(value as CatalogCategorySlug);
}

export function getCatalogCategoryDefinition(slug: CatalogCategorySlug) {
  const definition = categoryBySlug.get(slug);
  if (!definition) throw new Error(`Unknown catalog category slug: ${slug}`);
  return definition;
}

export function getCatalogCategoryByLabel(label: string) {
  return categoryByLabel.get(label);
}

export function getCatalogCategoryByLegacyHref(href: string) {
  return categoryByLegacyHref.get(href);
}

function matchesSurveyProduct(product: Product) {
  const haystack = [product.name, product.tagline, product.category, ...product.interests].join(" ").toLowerCase();
  return product.interests.includes("mapping")
    || product.category.toLowerCase().includes("survey")
    || /survey|pix4d|gnss|mapper|matic|multispectral/i.test(haystack);
}

function matchesSurveillanceProduct(product: Product) {
  const haystack = [product.name, product.tagline, product.category, ...product.interests].join(" ").toLowerCase();
  return product.category === "Surveillance Drones"
    || product.interests.includes("surveillance")
    || /surveillance|security|thermal|inspection/i.test(haystack);
}

export const ACCESSORIES_STOREFRONT_LIMIT = 24;

function normalizeAccessoryFamily(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(?:source|for|with|and|or|the|a|an)\b/g, " ")
    .replace(/\b(?:cw|ccw|counter rotating|clockwise|anticlockwise)\b/g, " ")
    .replace(/\b(?:smart|non-smart|pro|plus|base|ver\d*|v\d+)\b/g, " ")
    .replace(/\b(?:motor only|propeller combo|with propeller combo|with mount|only|adaptor|adapter)\b/g, " ")
    .replace(/\b(?:agriculture|agricultural|agri|drone|drones|parts?|combo|set|sets)\b/g, " ")
    .replace(/\b(?:tc|certified|licensed|required|no)\b/g, " ")
    .replace(/[^\w\s+.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function accessoryFamilyKey(product: Product) {
  const text = normalizeAccessoryFamily(`${product.name} ${product.slug}`);

  if (/\bpix4d\b/.test(text)) return "pix4d-software";
  if (/\bvoltrox\b/.test(text)) return "voltrox-regulator";
  if (/\bgnss\b|\btripod\b|\btribrach\b/.test(text)) return "gnss-system";
  if (/\bhobbywing\b.*\bx8\b|\bx8\b.*\bhobbywing\b/.test(text)) return "hobbywing-x8";
  if (/\bhobbywing\b.*\bx6\b|\bx6\b.*\bhobbywing\b/.test(text)) return "hobbywing-x6";
  if (/\bhobbywing\b.*\b2480\b|\b2480\b.*\bhobbywing\b/.test(text)) return "hobbywing-2480";
  if (/\bhobbywing\b.*\bpump\b|\bpump\b.*\bhobbywing\b/.test(text)) return "hobbywing-pump";
  if (/\b25000mah\b|\b25200mah\b|\b24000mah\b|\b22000mah\b|\b16000mah\b|\bli ion\b|\blipo\b|\bbattery\b/.test(text)) {
    return "battery-pack";
  }
  if (/\btransmitter\b|\breceiver\b|\bcontroller\b|\bremote\b/.test(text)) return "transmitter-controller";
  if (/\blanding gear\b/.test(text)) return "landing-gear";
  if (/\btank\b|\bfesto\b|\boutlet cap\b/.test(text)) return "tank-system";
  if (/\bpropeller\b|\b3010\b|\b3012\b|\b2408\b/.test(text)) return "propeller-set";
  if (/\b8008\b|\b8015\b|\b8020\b|\b8025\b|\b4006\b|\bkv\b/.test(text)) return "motor-system";
  if (/\bflight controller\b|\baerofc\b|\bag\+\+\b|\bnamoag\b|\bmk2\b|\bjiyi\b/.test(text)) return "flight-control";

  return text;
}

function dedupeAccessoryProducts(products: Product[]) {
  const seen = new Set<string>();
  const result: Product[] = [];

  for (const product of products) {
    const key = accessoryFamilyKey(product);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(product);
  }

  return result.slice(0, ACCESSORIES_STOREFRONT_LIMIT);
}

export function filterProductsForCategorySlug(products: Product[], slug: CatalogCategorySlug) {
  const definition = getCatalogCategoryDefinition(slug);

  if (slug === "global-products") {
    return products.filter(isGlobalProductsCategory);
  }

  if (slug === "accessories") {
    return dedupeAccessoryProducts(
      products.filter((product) => product.category === "Accessories" || isDroneCareShelfProduct(product))
    );
  }

  if (slug === "survey-drones") {
    return products.filter(matchesSurveyProduct);
  }

  if (slug === "surveillance-drones") {
    return products.filter(matchesSurveillanceProduct);
  }

  if (definition.categoryNames.length) {
    const normalizedNames = new Set(definition.categoryNames.map(normalizeProductCategory));
    return products.filter((product) => normalizedNames.has(normalizeProductCategory(product.category)));
  }

  return [];
}

export const interestSlugToCategorySlug: Partial<Record<string, CatalogCategorySlug>> = {
  agriculture: "agri-drones",
  "video-drones": "video-drones",
  "creative-drones": "creative-drones",
  mapping: "survey-drones",
  surveillance: "surveillance-drones",
  "smart-farming": "agri-drones",
  "defense-security": "surveillance-drones",
  "industrial-inspection": "global-products",
  components: "accessories"
};

export function resolveCategoryHrefForInterest(slug: string) {
  const categorySlug = interestSlugToCategorySlug[slug];
  return categorySlug ? getCatalogCategoryDefinition(categorySlug).href : `/interest/${slug}`;
}
