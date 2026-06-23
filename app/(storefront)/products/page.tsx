import { Suspense } from "react";
import { CatalogPage } from "@/sections/catalog/catalog-page";
import { getCatalogShowroomProducts } from "@/services/catalog";

function CatalogPageFallback() {
  return <div className="min-h-[60vh] animate-pulse bg-[#eef0f3]" aria-hidden="true" />;
}

async function ProductsPageContent() {
  const products = await getCatalogShowroomProducts();

  return (
    <CatalogPage
      title="Mithron Product Catalog"
      subtitle="Curated drone aircraft and mission-ready systems for professional operations."
      products={products}
      presentation="showroom"
    />
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<CatalogPageFallback />}>
      <ProductsPageContent />
    </Suspense>
  );
}
