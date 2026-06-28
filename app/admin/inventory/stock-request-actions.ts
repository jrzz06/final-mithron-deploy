"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAuthContext, requireAdminPermission } from "@/services/auth";
import { approveAndApplyStockRequest, rejectStockRequest } from "@/services/supplier-stock-requests";
import { repairCheckoutWarehouseStock, repairMissingProductInventory } from "@/services/product-inventory-sync";

function feedbackPath(status: "success" | "error", message: string) {
  return `/admin/inventory?stock_status=${status}&stock_message=${encodeURIComponent(message.slice(0, 200))}`;
}

export async function approveStockRequestAction(formData: FormData) {
  const context = await getCurrentAuthContext();
  const actorId = context.userId;
  if (!actorId) redirect("/login?next=/admin/inventory");
  await requireAdminPermission("products.write");

  const requestId = String(formData.get("requestId") ?? "").trim();
  try {
    await approveAndApplyStockRequest({ requestId, actorId, apply: true });
  } catch (error) {
    redirect(feedbackPath("error", error instanceof Error ? error.message : "Approval failed."));
  }
  redirect(feedbackPath("success", "Stock request approved and inventory updated."));
}

export async function rejectStockRequestAction(formData: FormData) {
  const context = await getCurrentAuthContext();
  const actorId = context.userId;
  if (!actorId) redirect("/login?next=/admin/inventory");
  await requireAdminPermission("products.write");

  const requestId = String(formData.get("requestId") ?? "").trim();
  try {
    await rejectStockRequest({ requestId, actorId });
  } catch (error) {
    redirect(feedbackPath("error", error instanceof Error ? error.message : "Rejection failed."));
  }
  redirect(feedbackPath("success", "Stock request rejected."));
}

export async function syncMissingInventoryAction() {
  const context = await getCurrentAuthContext();
  const actorId = context.userId;
  if (!actorId) redirect("/login?next=/admin/inventory");
  await requireAdminPermission("products.write");

  try {
    const [catalogResult, checkoutResult] = await Promise.all([
      repairMissingProductInventory(actorId),
      repairCheckoutWarehouseStock(actorId)
    ]);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");

    const failed = catalogResult.failed + checkoutResult.failed;
    if (failed) {
      redirect(
        feedbackPath(
          "error",
          `Catalog: ${catalogResult.created} created. Checkout warehouse (${checkoutResult.checkoutWarehouseCode}): ${checkoutResult.created} created, ${checkoutResult.synced} synced. ${failed} failed.`
        )
      );
    }

    const message = [
      catalogResult.created ? `Created catalog inventory for ${catalogResult.created} products.` : "Catalog inventory already complete.",
      checkoutResult.desyncedFixed
        ? `Synced checkout warehouse stock for ${checkoutResult.desyncedFixed} products (${checkoutResult.checkoutWarehouseCode}).`
        : `Checkout warehouse stock already aligned (${checkoutResult.checkoutWarehouseCode}).`
    ].join(" ");

    redirect(feedbackPath("success", message));
  } catch (error) {
    redirect(feedbackPath("error", error instanceof Error ? error.message : "Inventory sync failed."));
  }
}

export async function syncCheckoutWarehouseStockAction() {
  const context = await getCurrentAuthContext();
  const actorId = context.userId;
  if (!actorId) redirect("/login?next=/admin/inventory");
  await requireAdminPermission("products.write");

  try {
    const result = await repairCheckoutWarehouseStock(actorId);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    if (result.failed) {
      redirect(
        feedbackPath(
          "error",
          `Checkout warehouse (${result.checkoutWarehouseCode}): ${result.desyncedFixed} fixed, ${result.failed} failed.`
        )
      );
    }
    redirect(
      feedbackPath(
        "success",
        result.desyncedFixed
          ? `Synced checkout warehouse stock for ${result.desyncedFixed} products (${result.checkoutWarehouseCode}).`
          : `Checkout warehouse stock already aligned (${result.checkoutWarehouseCode}).`
      )
    );
  } catch (error) {
    redirect(feedbackPath("error", error instanceof Error ? error.message : "Checkout stock sync failed."));
  }
}
