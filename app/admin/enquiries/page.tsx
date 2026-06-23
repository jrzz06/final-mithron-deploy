import Link from "next/link";
import { assignEnquiryFormAction } from "./actions";
import { AdminSection } from "@/components/admin/module-panel";
import { StatusPill } from "@/components/platform";
import { listAdminEnquiries } from "@/services/enquiries";

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function enquiryPhone(enquiry: Record<string, unknown>) {
  const payload = enquiry.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "";
  return text((payload as Record<string, unknown>).customer_phone);
}

export default async function AdminEnquiriesPage() {
  const enquiries = await listAdminEnquiries();

  return (
    <div className="grid gap-5">
      <div className="max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--platform-text-muted)]">Customer enquiries</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--platform-text-muted)]">
          Contact form submissions and checkout product enquiries. Checkout enquiries also create an order in the Orders workspace.
        </p>
      </div>

      <AdminSection
        title="Enquiry queue"
        description={`${enquiries.length} item${enquiries.length === 1 ? "" : "s"} in queue`}
      >
        <div className="grid gap-2">
          {enquiries.length ? enquiries.map((enquiry) => {
            const source = text(enquiry.source, "contact");
            const orderNumber = text(enquiry.order_number);
            const phone = enquiryPhone(enquiry);
            const status = text(enquiry.status, "new");
            const canAssign = status === "new" && text(enquiry.queue_kind, "enquiry") === "enquiry";

            return (
              <article
                key={`${source}-${String(enquiry.id)}`}
                className="rounded-[8px] border border-[var(--platform-border)] bg-[var(--platform-surface-muted)] p-4 transition-colors hover:bg-[var(--platform-surface-raised)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-medium text-[var(--platform-text-primary)]">{String(enquiry.subject)}</h2>
                      <StatusPill status={status} />
                      <span className="rounded-md border border-[var(--platform-border)] bg-[var(--platform-surface)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--platform-text-muted)]">
                        {source === "checkout" ? "Checkout" : "Contact"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--platform-text-muted)]">
                      <span>{String(enquiry.customer_email)}</span>
                      {phone ? <span>{phone}</span> : null}
                      {orderNumber ? <span>Order {orderNumber}</span> : null}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--platform-text-secondary)]">
                      {String(enquiry.body)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {orderNumber ? (
                      <Link
                        href={`/admin/orders?order=${encodeURIComponent(orderNumber)}&queue=review`}
                        className="inline-flex h-9 items-center rounded-[8px] border border-[var(--platform-border)] bg-[var(--platform-surface)] px-3 text-sm font-medium text-[var(--platform-text-primary)] transition hover:bg-[var(--platform-surface-muted)]"
                      >
                        View order
                      </Link>
                    ) : null}
                    {canAssign ? (
                      <form action={assignEnquiryFormAction} className="flex gap-2">
                        <input type="hidden" name="enquiry_id" value={String(enquiry.id)} />
                        <input type="hidden" name="assigned_to" value="" />
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center rounded-[8px] bg-[var(--platform-accent)] px-3 text-sm font-medium text-[var(--platform-surface)] transition hover:bg-[var(--platform-accent-strong)]"
                        >
                          Mark contacted
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          }) : (
            <p className="rounded-[8px] border border-dashed border-[var(--platform-border)] bg-[var(--platform-surface-muted)] px-4 py-8 text-center text-sm text-[var(--platform-text-muted)]">
              No enquiries yet.
            </p>
          )}
        </div>
      </AdminSection>
    </div>
  );
}
