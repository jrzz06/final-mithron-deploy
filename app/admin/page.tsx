import Link from "next/link";
import { AdminSection, DataList } from "@/components/admin/module-panel";
import { connectivityMessage, emptyMessage, humanStatus, relativeTimeLabel } from "@/lib/platform/copy";
import { getAdminDashboardSnapshot } from "@/services/admin";

function rowLabel(row: Record<string, unknown>, fallback: string) {
  return String(row.title ?? row.name ?? row.order_number ?? row.slug ?? row.product_slug ?? row.id ?? fallback);
}

function recentRows(rows: Record<string, unknown>[], fallback: string, valueKey = "status", keyPrefix = fallback.toLowerCase()) {
  return rows.slice(0, 5).map((row, index) => ({
    id: `${keyPrefix}-${String(row.id ?? index)}`,
    label: rowLabel(row, `${fallback} ${index + 1}`),
    value: humanStatus(String(row[valueKey] ?? row.status ?? row.workflow_status ?? row.stock_status ?? "open")),
    detail: relativeTimeLabel(String(row.updated_at ?? row.created_at ?? row.createdAt ?? ""))
  }));
}

export default async function AdminPage() {
  const snapshot = await getAdminDashboardSnapshot();
  const lowStockCount = snapshot.data.lowStockAlerts.length;
  const pendingOrders = snapshot.data.recentOrders.filter((row) =>
    /pending|processing|review|open/i.test(String(row.order_status ?? row.status ?? ""))
  ).length;

  const lowStockRows = snapshot.data.lowStockAlerts.slice(0, 5).map((row, index) => ({
    id: `low-stock-${String(row.id ?? `${row.product_slug ?? "product"}-${row.sku ?? "sku"}-${index}`)}`,
    label: String(row.product_name ?? row.product_slug ?? "Product"),
    value: humanStatus(String(row.stock_status ?? "low_stock")),
    detail: `SKU ${String(row.sku ?? "—")} · ${String(row.quantity ?? 0)} units`
  }));

  const attentionRows = [
    ...recentRows(snapshot.data.recentOrders.filter((row) => /pending|processing|review|open/i.test(String(row.order_status ?? row.status ?? ""))), "Order", "order_status", "order").slice(0, 4),
    ...lowStockRows.slice(0, 3)
  ].slice(0, 6);

  const activityRows = [
    ...recentRows(snapshot.data.recentNotifications, "Notification", "status", "notification").slice(0, 3),
    ...recentRows(snapshot.data.recentActivity, "Activity", "action", "activity").slice(0, 3)
  ].slice(0, 5);

  return (
    <div data-admin-dashboard className="grid gap-5">
      {snapshot.blockedReason ? (
        <p className="rounded-[var(--platform-radius)] border border-[var(--platform-warning)]/20 bg-[var(--platform-warning-soft)] px-4 py-3 text-sm text-[var(--platform-warning)]">
          {connectivityMessage(snapshot.blockedReason)}
        </p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <AdminSection
          title="Requires action"
          description="Operational items that need review before the next fulfillment cycle."
        >
          <DataList
            rows={
              attentionRows.length
                ? attentionRows
                : [{ label: "All clear", value: "Nothing urgent", detail: emptyMessage("orders") }]
            }
          />
        </AdminSection>

        <AdminSection title="Operational snapshot" description="Current pressure across core workflows.">
          <div className="grid gap-2">
            {[
              { label: "Orders awaiting review", value: String(pendingOrders), href: "/admin/orders?queue=review" },
              { label: "Low stock alerts", value: String(lowStockCount), href: "/admin/inventory" },
              { label: "Supplier submissions", value: "Review queue", href: "/admin/suppliers/products" },
              { label: "Customer enquiries", value: "Open queue", href: "/admin/enquiries" }
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mithron-elevated-card mithron-elevated-card--interactive flex items-center justify-between gap-3 rounded-[8px] border border-[var(--platform-border)] bg-[var(--platform-surface-muted)] px-3 py-2.5 text-sm transition hover:bg-[var(--platform-surface)]"
              >
                <span className="text-[var(--platform-text-secondary)]">{item.label}</span>
                <span className="font-medium tabular-nums text-[var(--platform-text-primary)]">{item.value}</span>
              </Link>
            ))}
          </div>
        </AdminSection>
      </section>

      <section data-admin-quick-actions className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <AdminSection title="Quick actions">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "Review orders", href: "/admin/orders" },
              { label: "Review submissions", href: "/admin/suppliers/products" },
              { label: "Manage inventory", href: "/admin/inventory" },
              { label: "Enquiry queue", href: "/admin/enquiries" },
              { label: "Upload media", href: "/admin/media#upload-media" },
              { label: "Edit website content", href: "/admin/cms" }
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                data-admin-crud-action={action.label.toLowerCase().replaceAll(" ", "-")}
                className="mithron-elevated-card mithron-elevated-card--interactive flex min-h-10 items-center rounded-[8px] border border-[var(--platform-border)] bg-[var(--platform-surface-muted)] px-3 text-sm font-medium text-[var(--platform-text-primary)] transition hover:bg-[var(--platform-surface)]"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </AdminSection>

        <AdminSection title="Inventory risk" description="Products approaching stock thresholds.">
          <DataList
            rows={
              lowStockRows.length
                ? lowStockRows
                : [{ label: "Inventory healthy", value: "No alerts", detail: "Stock levels are within range." }]
            }
          />
        </AdminSection>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AdminSection title="Recent orders">
          <DataList rows={recentRows(snapshot.data.recentOrders, "Order", "order_status", "order")} />
        </AdminSection>
        <AdminSection title="Recent activity">
          <DataList rows={activityRows.length ? activityRows : [{ label: "Activity", value: "Quiet", detail: emptyMessage("activity") }]} />
        </AdminSection>
      </section>
    </div>
  );
}
