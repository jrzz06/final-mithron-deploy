import "server-only";

import { getBestVariantUpToWidth, getResponsiveAssetForSrc } from "@/config/generated-assets";

const STOREFRONT_PRIMARY_MAX_WIDTH = 1920;

export function generatedPrimaryForPath(path: string) {
  const responsive = getResponsiveAssetForSrc(path);
  if (responsive?.status !== "generated") return undefined;
  return getBestVariantUpToWidth(responsive, STOREFRONT_PRIMARY_MAX_WIDTH, "webp")?.src;
}
