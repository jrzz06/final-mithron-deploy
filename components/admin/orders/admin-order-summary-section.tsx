"use client";

import { customerOrderSourceLabel } from "@/lib/orders/lifecycle";
import { OrderDetailCard, OrderIdText, OrderStatusStrip } from "@/components/admin/orders/order-detail-primitives";
import { orderLongText } from "@/components/admin/orders/order-layout-utils";
import {
  moneyText,
  orderDateTime,
  publicOrderLabel,
  type AdminRow
} from "@/components/admin/orders/order-view-helpers";

type AdminOrderSummarySectionProps = {
  order: AdminRow;
  defaultWarehouseCode: string;
};

export function AdminOrderSummarySection({ order, defaultWarehouseCode }: AdminOrderSummarySectionProps) {
  return (
    <OrderDetailCard title="Order summary" hero>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <OrderIdText value={publicOrderLabel(order)} heading showCopy />
          <p className={`text-sm text-[var(--platform-text-muted)] ${orderLongText}`}>
            {customerOrderSourceLabel(order)} · {orderDateTime(order)}
          </p>
        </div>
        <p className="shrink-0 text-2xl font-bold text-[var(--platform-text-primary)]">{moneyText(order.total)}</p>
      </div>
      <div className="mt-5">
        <OrderStatusStrip order={order} defaultWarehouseCode={defaultWarehouseCode} />
      </div>
    </OrderDetailCard>
  );
}
