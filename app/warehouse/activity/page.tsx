import Link from "next/link";
import { ControlShell } from "@/components/admin/control-shell";
import { DataList } from "@/components/admin/module-panel";
import { getWarehouseSnapshot } from "@/services/admin";
import { connectivityMessage } from "@/lib/platform/copy";

export const dynamic = "force-dynamic";

function text(value: unknown, fallback = "—") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function formatDate(value: unknown) {
  const raw = text(value, "");
  if (!raw || raw === "—") return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function WarehouseActivityPage() {
  const snapshot = await getWarehouseSnapshot({ scope: "activity" });
  const activityRows = [
    ...snapshot.data.activityLogs.map((row) => ({
      id: text(row.id, `${text(row.action)}-${text(row.created_at)}`),
      timestamp: text(row.created_at),
      label: text(row.action, "activity"),
      value: text(row.entity_table, "record"),
      detail: `${text(row.severity, "info")} | ${text(row.entity_id, "—")}`
    })),
    ...snapshot.data.shipmentTimeline.map((row) => ({
      id: text(row.id, `${text(row.event_type)}-${text(row.created_at)}`),
      timestamp: text(row.created_at),
      label: text(row.event_type, "shipment"),
      value: text(row.next_status, text(row.previous_status, "update")),
      detail: text(row.notes, "Shipment timeline event")
    })),
    ...snapshot.data.movements.slice(0, 20).map((row) => ({
      id: text(row.id, `${text(row.product_slug)}-${text(row.created_at)}`),
      timestamp: text(row.created_at),
      label: text(row.movement_type, "movement"),
      value: `${text(row.product_slug)} / ${text(row.sku)}`,
      detail: `delta ${String(row.quantity_delta ?? 0)} | ${text(row.reason_code, "—")}`
    }))
  ].sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp)).slice(0, 40);

  return (
    <ControlShell
      eyebrow="History"
      title="Warehouse activity"
      description={connectivityMessage(snapshot.blockedReason) || "Recent fulfillment, shipment, and inventory events across the warehouse control plane."}
      actions={[
        { label: "Movements", href: "/warehouse/movements" },
        { label: "Orders", href: "/warehouse/orders" }
      ]}
    >
      <section data-warehouse-activity-timeline className="grid gap-4">
        <DataList
          rows={activityRows.length ? activityRows.map((row) => ({
            label: row.label,
            value: row.value,
            detail: `${formatDate(row.timestamp)} | ${row.detail}`
          })) : [{ label: "activityLogs", value: "0", detail: "No warehouse activity is available yet." }]}
        />
        <Link href="/warehouse/movements" className="text-sm font-medium text-[var(--platform-accent)] hover:underline">
          Open full movement ledger
        </Link>
      </section>
    </ControlShell>
  );
}
