"use client";

import type { ReactNode } from "react";

type AdminOrdersShellProps = {
  toolbar: ReactNode;
  filters: ReactNode;
  list: ReactNode;
  detail: ReactNode;
  actions?: ReactNode;
  hasSelectedOrder?: boolean;
};

export function AdminOrdersShell({
  toolbar,
  filters,
  list,
  detail,
  actions,
  hasSelectedOrder = false
}: AdminOrdersShellProps) {
  return (
    <div data-admin-orders-shell className="grid min-w-0 gap-0">
      <div className="sticky top-0 z-20 -mx-1 space-y-3 border-b border-[var(--platform-border)] bg-[var(--platform-bg)]/95 px-1 pb-4 backdrop-blur-sm">
        {toolbar}
        {filters}
      </div>

      <div
        className={`mt-4 grid min-w-0 gap-4 ${
          hasSelectedOrder && actions
            ? "lg:grid-cols-[minmax(280px,34%)_minmax(0,1fr)] xl:grid-cols-[minmax(300px,30%)_minmax(0,1fr)_minmax(240px,22%)]"
            : "lg:grid-cols-[minmax(280px,34%)_minmax(0,1fr)]"
        }`}
      >
        <div className="flex min-h-0 min-w-0 flex-col lg:max-h-[calc(100dvh-11rem)]">{list}</div>

        <div className="flex min-h-0 min-w-0 flex-col gap-4 lg:max-h-[calc(100dvh-11rem)] xl:col-start-2">
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{detail}</div>
          {actions ? (
            <div className="min-w-0 shrink-0 xl:hidden">{actions}</div>
          ) : null}
        </div>

        {actions ? (
          <div className="hidden min-h-0 min-w-0 flex-col xl:col-start-3 xl:flex xl:max-h-[calc(100dvh-11rem)]">
            <div className="min-h-0 flex-1 overflow-y-auto">{actions}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
