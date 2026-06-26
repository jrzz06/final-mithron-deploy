import { redirect } from "next/navigation";
import { ControlShell } from "@/components/admin/control-shell";
import { DataList, OperationalFeedback } from "@/components/admin/module-panel";
import { OperationalSubmitButton } from "@/components/admin/operational-submit-button";
import { getWarehouseSnapshot } from "@/services/admin";
import { listPendingReturnRequests } from "@/services/order-returns";
import { markWarehouseOrderReturnedFormAction, updateWarehouseReturnRequestFormAction } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function value(params: SearchParams, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
}

function text(input: unknown, fallback = "—") {
  return typeof input === "string" && input.trim() ? input.trim() : fallback;
}

function feedbackPath(status: "success" | "error", message: string) {
  return `/warehouse/returns?operation_status=${status}&operation_message=${encodeURIComponent(message.slice(0, 220))}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Return workflow action failed.";
}

async function approveReturnRequest(formData: FormData) {
  "use server";
  try {
    formData.set("to_status", "approved");
    await updateWarehouseReturnRequestFormAction(formData);
  } catch (error) {
    redirect(feedbackPath("error", errorMessage(error)));
  }
  redirect(feedbackPath("success", "Return request approved."));
}

async function receiveReturnRequest(formData: FormData) {
  "use server";
  try {
    formData.set("to_status", "received");
    await updateWarehouseReturnRequestFormAction(formData);
  } catch (error) {
    redirect(feedbackPath("error", errorMessage(error)));
  }
  redirect(feedbackPath("success", "Return marked as received."));
}

export default async function WarehouseReturnsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const [snapshot, pendingReturns] = await Promise.all([
    getWarehouseSnapshot({ scope: "returns" }),
    listPendingReturnRequests()
  ]);
  const params = searchParams ? await searchParams : {};
  const operationStatus = value(params, "operation_status");
  const operationMessage = value(params, "operation_message");
  const ordersById = new Map(snapshot.data.orders.map((order) => [text(order.id, ""), order]));
  const returnOrders = snapshot.data.orders.filter((order) =>
    ["returned", "damaged"].includes(text(order.fulfillment_status, "pending"))
    || text(order.status, "") === "returned"
  );

  return (
    <ControlShell
      eyebrow="Returns"
      title="Returns workflow"
      description="Review customer return requests and mark returned or damaged inventory outcomes."
      actions={[
        { label: "Orders", href: "/warehouse/orders" },
        { label: "Dispatch", href: "/warehouse/dispatch" }
      ]}
    >
      <section data-returns-workflow className="grid gap-6">
        <OperationalFeedback
          status={operationStatus}
          message={operationMessage}
          context="Returns"
          idle="Return approvals and fulfillment updates appear here."
        />

        <div className="grid gap-3">
          <h2 className="text-sm font-semibold text-[var(--platform-text-primary)]">Pending return requests</h2>
          <DataList
            rows={pendingReturns.length ? pendingReturns.map((request) => {
              const order = ordersById.get(text(request.order_id, ""));
              return {
                label: text(order?.order_number, text(request.order_id, "Order")),
                value: text(request.status, "requested"),
                detail: text(request.reason, "No reason provided")
              };
            }) : [{ label: "Return requests", value: "0", detail: "No pending customer return requests." }]}
          />
          {pendingReturns.slice(0, 8).map((request) => (
            <div key={text(request.id, text(request.order_id, "return"))} className="flex flex-wrap gap-2 rounded-[var(--platform-radius)] border border-[var(--platform-border)] bg-[var(--platform-surface-muted)] p-3">
              <form action={approveReturnRequest} className="contents">
                <input type="hidden" name="request_id" value={text(request.id, "")} />
                <input type="hidden" name="from_status" value={text(request.status, "requested")} />
                <OperationalSubmitButton pendingLabel="Approving" className="inline-flex min-h-8 items-center rounded-md border border-[var(--platform-border)] px-3 text-xs font-semibold">
                  Approve
                </OperationalSubmitButton>
              </form>
              <form action={receiveReturnRequest} className="contents">
                <input type="hidden" name="request_id" value={text(request.id, "")} />
                <input type="hidden" name="from_status" value="approved" />
                <OperationalSubmitButton pendingLabel="Receiving" className="inline-flex min-h-8 items-center rounded-md border border-[var(--platform-border)] px-3 text-xs font-semibold">
                  Mark received
                </OperationalSubmitButton>
              </form>
            </div>
          ))}
        </div>

        <div className="grid gap-3">
          <h2 className="text-sm font-semibold text-[var(--platform-text-primary)]">Returned orders</h2>
          {returnOrders.length ? returnOrders.map((order) => {
            const orderId = text(order.id, "");
            const orderNumber = text(order.order_number, orderId);
            return (
              <div key={orderId} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--platform-radius)] border border-[var(--platform-border)] bg-[var(--platform-surface-muted)] px-4 py-3">
                <div>
                  <p className="font-medium text-[var(--platform-text-primary)]">{orderNumber}</p>
                  <p className="text-sm text-[var(--platform-text-secondary)]">{text(order.customer_email)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={markWarehouseOrderReturnedFormAction} className="contents">
                    <input type="hidden" name="order_id" value={orderId} />
                    <input type="hidden" name="fulfillment_status" value="returned" />
                    <input type="hidden" name="notes" value="Marked returned from warehouse returns workflow" />
                    <input type="hidden" name="change_summary" value={`Mark returned ${orderNumber}`} />
                    <OperationalSubmitButton pendingLabel="Saving" className="inline-flex min-h-8 items-center rounded-md border border-[var(--platform-border)] px-3 text-xs font-semibold">
                      Mark returned
                    </OperationalSubmitButton>
                  </form>
                  <form action={markWarehouseOrderReturnedFormAction} className="contents">
                    <input type="hidden" name="order_id" value={orderId} />
                    <input type="hidden" name="fulfillment_status" value="damaged" />
                    <input type="hidden" name="notes" value="Marked damaged from warehouse returns workflow" />
                    <input type="hidden" name="change_summary" value={`Mark damaged ${orderNumber}`} />
                    <OperationalSubmitButton pendingLabel="Saving" className="inline-flex min-h-8 items-center rounded-md border border-rose-500/30 px-3 text-xs font-semibold text-rose-200">
                      Mark damaged
                    </OperationalSubmitButton>
                  </form>
                </div>
              </div>
            );
          }) : (
            <p className="rounded-[var(--platform-radius)] border border-[var(--platform-border)] bg-[var(--platform-surface-muted)] px-4 py-6 text-sm text-[var(--platform-text-muted)]">
              No returned orders are waiting for warehouse disposition.
            </p>
          )}
        </div>
      </section>
    </ControlShell>
  );
}
