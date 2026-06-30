import type { MediaAsset, Product } from "@/config/types";

const CATALOG_CUTOUT_PATH = "/catalog-cutouts/";

export function isCatalogCutoutAsset(asset: Pick<MediaAsset, "src">) {
  return asset.src.includes(CATALOG_CUTOUT_PATH);
}

export function productHasCatalogCutout(product: Product) {
  if (isCatalogCutoutAsset(product.image)) {
    return true;
  }

  if (product.gallery.some(isCatalogCutoutAsset)) {
    return true;
  }

  return isCatalogCutoutAsset(product.hero);
}

export function resolveCatalogCutoutAsset(product: Product): MediaAsset | null {
  if (isCatalogCutoutAsset(product.image)) {
    return product.image;
  }

  const galleryCutout = product.gallery.find(isCatalogCutoutAsset);
  if (galleryCutout) {
    return galleryCutout;
  }

  if (isCatalogCutoutAsset(product.hero)) {
    return product.hero;
  }

  return null;
}
