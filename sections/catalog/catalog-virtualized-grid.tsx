"use client";

import { ProductHoverCard } from "@/components/cards/product-hover-card";
import type { Product } from "@/config/types";
import { dedupeProductsBySlug } from "@/lib/catalog-shelf-layout";

type CatalogVirtualizedGridProps = {
  products: Product[];
  className?: string;
  presentation?: "standard" | "showroom";
};

export function CatalogVirtualizedGrid({
  products,
  className,
  presentation = "standard"
}: CatalogVirtualizedGridProps) {
  const items = dedupeProductsBySlug(products);

  return (
    <div className={className} data-catalog-continued-grid>
      {items.map((product, index) => (
        <ProductHoverCard
          key={product.slug}
          product={product}
          variant="catalog"
          showCategory
          cta="catalog"
          presentation={presentation}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
