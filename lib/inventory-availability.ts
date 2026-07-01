export type InventoryAvailability = "available" | "out_of_stock";

export function stockStatusFromQuantity(quantity: number): InventoryAvailability {
  return quantity > 0 ? "available" : "out_of_stock";
}

export function availabilityLabelFromQuantity(quantity: number): string {
  return quantity > 0 ? "In stock" : "Out of stock";
}

export function resolveCatalogAvailability(
  productSlug: string,
  inventoryRows: Array<{ product_slug?: unknown; quantity?: unknown }>
): number {
  const slug = productSlug.trim();
  if (!slug) return 0;
  const row = inventoryRows.find((entry) => String(entry.product_slug ?? "").trim() === slug);
  const quantity = Number(row?.quantity ?? 0);
  return Number.isFinite(quantity) ? Math.max(0, Math.trunc(quantity)) : 0;
}
