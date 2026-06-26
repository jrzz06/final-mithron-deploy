"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/services/auth";
import { updateReturnRequestStatus } from "@/services/order-returns";
import { updateWarehouseOrderLifecycleFormAction } from "@/app/warehouse/actions";

function feedbackPath(status: "success" | "error", message: string) {
  return `/warehouse/returns?operation_status=${status}&operation_message=${encodeURIComponent(message.slice(0, 220))}`;
}

export async function updateWarehouseReturnRequestFormAction(formData: FormData) {
  const context = await requirePermission("orders.lifecycle");
  const requestId = String(formData.get("request_id") ?? "").trim();
  const fromStatus = String(formData.get("from_status") ?? "").trim();
  const toStatus = String(formData.get("to_status") ?? "").trim();
  const adminNote = String(formData.get("admin_note") ?? "").trim();

  if (!requestId || !fromStatus || !toStatus) {
    throw new Error("Return request, current status, and next status are required.");
  }

  await updateReturnRequestStatus({
    requestId,
    fromStatus,
    toStatus,
    actorId: context.userId ?? "",
    actorRole: context.role === "admin" ? "admin" : "warehouse",
    adminNote: adminNote || undefined
  });

  revalidatePath("/warehouse/returns");
  revalidatePath("/admin/orders");
}

export async function markWarehouseOrderReturnedFormAction(formData: FormData) {
  await requirePermission("orders.lifecycle");
  const requestedStatus = String(formData.get("fulfillment_status") ?? "returned");
  if (requestedStatus === "damaged") {
    formData.set("fulfillment_status", "returned");
    const notes = String(formData.get("notes") ?? "").trim();
    formData.set("notes", notes ? `${notes} (damaged disposition)` : "Marked as damaged return disposition.");
  }
  try {
    await updateWarehouseOrderLifecycleFormAction(formData);
  } catch (error) {
    redirect(feedbackPath("error", error instanceof Error ? error.message : "Failed to update return status."));
  }
  redirect(feedbackPath("success", "Return status updated."));
}
