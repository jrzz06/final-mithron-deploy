"use client";

import { useState } from "react";
import { ProductFieldLabel } from "@/components/admin/product-info-tooltip";

type ProductTaxFieldsProps = {
  initialChargeTax?: boolean;
  initialTaxRate?: number | null;
  initialTaxIncluded?: boolean;
  variant?: "light" | "dark";
};

function numberInputClass(variant: "light" | "dark") {
  return variant === "light"
    ? "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-400"
    : "h-10 rounded-lg border border-slate-800 bg-[#0b1017] px-3 text-sm text-slate-100 outline-none focus:border-slate-600";
}

export function ProductTaxFields({
  initialChargeTax = true,
  initialTaxRate,
  initialTaxIncluded = false,
  variant = "dark"
}: ProductTaxFieldsProps) {
  const [chargeTax, setChargeTax] = useState(initialChargeTax);
  const [taxRate, setTaxRate] = useState(initialTaxRate ? String(initialTaxRate) : "18");
  const [taxIncluded, setTaxIncluded] = useState(initialTaxIncluded);

  const sectionTitleClass = variant === "light" ? "text-sm font-semibold text-slate-950" : "text-sm font-semibold text-slate-100";
  const sectionShellClass = variant === "light"
    ? "grid gap-4 rounded-xl border border-slate-200 bg-white p-4"
    : "grid gap-4 rounded-xl border border-slate-800 bg-[#0b1017] p-4";

  return (
    <section data-product-tax-section className={sectionShellClass}>
      <h3 className={sectionTitleClass}>Tax</h3>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="charge_tax"
          value="true"
          checked={chargeTax}
          onChange={(event) => setChargeTax(event.target.checked)}
          className="h-4 w-4 rounded border-slate-600"
        />
        <ProductFieldLabel tooltip="When enabled, tax is calculated for this product at checkout.">
          Charge tax on this product
        </ProductFieldLabel>
      </label>

      {chargeTax ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <ProductFieldLabel tooltip="GST or applicable tax rate percentage.">Tax rate</ProductFieldLabel>
            <div className="relative">
              <input
                name="tax_rate"
                inputMode="decimal"
                value={taxRate}
                onChange={(event) => setTaxRate(event.target.value)}
                className={`${numberInputClass(variant)} pr-8`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">%</span>
            </div>
          </label>

          <label className="inline-flex items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              name="tax_included"
              value="true"
              checked={taxIncluded}
              onChange={(event) => setTaxIncluded(event.target.checked)}
              className="h-4 w-4 rounded border-slate-600"
            />
            <ProductFieldLabel tooltip="Enable when the listed price already includes tax (common for GST-inclusive pricing).">
              Price includes tax
            </ProductFieldLabel>
          </label>
        </div>
      ) : null}
    </section>
  );
}
