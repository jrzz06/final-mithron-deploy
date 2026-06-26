"use client";

import { WarehouseBarcodeScanner } from "@/components/warehouse/warehouse-barcode-scanner";
import type { PickingScanTarget } from "@/services/warehouse-barcode";

export function WarehousePickingBarcodePanel({ targets }: { targets: PickingScanTarget[] }) {
  return <WarehouseBarcodeScanner targets={targets} />;
}
