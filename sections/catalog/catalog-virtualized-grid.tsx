"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useState } from "react";
import { ProductHoverCard } from "@/components/cards/product-hover-card";
import type { Product } from "@/config/types";
import { cn } from "@/lib/utils";

const VIRTUALIZE_THRESHOLD = 24;

type CatalogVirtualizedGridProps = {
  products: Product[];
  className?: string;
  presentation?: "standard" | "showroom";
};

function useCatalogColumnCount() {
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width >= 1280) setColumnCount(4);
      else if (width >= 768) setColumnCount(3);
      else setColumnCount(1);
    };

    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return columnCount;
}

export function CatalogVirtualizedGrid({
  products,
  className,
  presentation = "standard"
}: CatalogVirtualizedGridProps) {
  const columnCount = useCatalogColumnCount();
  const shouldVirtualize = products.length > VIRTUALIZE_THRESHOLD;
  const rowCount = Math.ceil(products.length / Math.max(columnCount, 1));

  const rowVirtualizer = useWindowVirtualizer({
    count: shouldVirtualize ? rowCount : 0,
    estimateSize: () => 560,
    overscan: 1
  });

  const staticItems = useMemo(() => products, [products]);

  if (!shouldVirtualize) {
    return (
      <div className={className}>
        {staticItems.map((product) => (
          <ProductHoverCard
            key={product.slug}
            product={product}
            variant="catalog"
            showCategory
            cta="catalog"
            presentation={presentation}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)} data-catalog-virtualized>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative", width: "100%" }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowProducts = products.slice(
            virtualRow.index * columnCount,
            virtualRow.index * columnCount + columnCount
          );

          return (
            <div
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              className="absolute left-0 top-0 grid w-full min-w-0 gap-6 md:grid-cols-3 xl:grid-cols-4"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {rowProducts.map((product) => (
                <ProductHoverCard
                  key={product.slug}
                  product={product}
                  variant="catalog"
                  showCategory
                  cta="catalog"
                  presentation={presentation}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
