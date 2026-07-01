import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function source(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("admin orders layout resilience", () => {
  it("keeps the workspace shell in document flow without fixed mobile overlays", () => {
    const shell = source("components/admin/orders/admin-orders-shell.tsx");

    expect(shell).toContain("data-admin-orders-shell");
    expect(shell).not.toContain("max-xl:fixed");
    expect(shell).not.toContain("max-xl:pb-24");
    expect(shell).toContain("100dvh");
  });

  it("wraps status badge labels instead of truncating them", () => {
    const badge = source("components/admin/orders/order-status-badge.tsx");

    expect(badge).toContain("flex-wrap");
    expect(badge).toContain("orderLongText");
    expect(badge).not.toMatch(/<span className="min-w-0 truncate">/);
  });

  it("uses responsive long-text field layout in order primitives", () => {
    const primitives = source("components/admin/orders/order-detail-primitives.tsx");

    expect(primitives).toContain("export function OrderIdText");
    expect(primitives).toContain("title={value}");
    expect(primitives).toContain("Copy order ID");
    expect(primitives).toContain('from "@/components/admin/orders/order-layout-utils"');
    expect(primitives).toContain("orderLongText");
    expect(primitives).not.toContain('style={{ maxHeight: "calc(100vh - 10rem)" }}');
  });

  it("renders timeline markers without absolute content positioning", () => {
    const timeline = source("components/admin/orders/admin-order-timeline.tsx");

    expect(timeline).not.toContain("absolute -left");
    expect(timeline).not.toContain('className="absolute bottom-2');
    expect(timeline).toContain("border-l-2");
    expect(timeline).toContain("grid-cols-[auto_minmax(0,1fr)]");
  });

  it("keeps actions rail in flow on smaller breakpoints", () => {
    const actionsRail = source("components/admin/orders/admin-order-actions-rail.tsx");

    expect(actionsRail).toContain("data-admin-order-actions-rail");
    expect(actionsRail).not.toContain("max-xl:fixed");
    expect(actionsRail).not.toContain("max-h-[42vh]");
    expect(actionsRail).toContain("w-full");
  });

  it("exports shared layout utility classes for long content", () => {
    const utils = source("components/admin/orders/order-layout-utils.ts");

    expect(utils).toContain("orderLongText");
    expect(utils).toContain("overflow-wrap:anywhere");
    expect(utils).toContain("orderClamp2");
    expect(utils).toContain("orderWrapRow");
  });
});
