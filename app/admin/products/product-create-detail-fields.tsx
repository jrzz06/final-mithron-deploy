"use client";

import { ProductFieldLabel } from "@/components/admin/product-info-tooltip";
import { ProductPricingFields } from "@/components/admin/product-pricing-fields";
import { ProductSimpleRichText } from "@/components/admin/product-simple-rich-text";
import { ProductTaxFields } from "@/components/admin/product-tax-fields";

export function ProductCreateDetailFields() {
  return (
    <div data-product-create-detail-fields className="grid gap-4 lg:col-span-2">
      <section data-product-create-basic-info className="grid gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--platform-text-muted)]">Basic info</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            <ProductFieldLabel>Name</ProductFieldLabel>
            <input
              name="name"
              required
              placeholder="Agri Kisan Drone Medium - 10 Liter"
              className="h-10 w-full rounded-[10px] border-0 bg-[var(--platform-surface)] px-3 text-sm text-[var(--platform-text-primary)] outline-none placeholder:text-[var(--platform-text-muted)] focus:bg-[var(--platform-accent-soft)] focus:ring-2 focus:ring-[var(--platform-focus-ring)]"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <ProductFieldLabel tooltip="Short label shown on the product card, e.g. New Arrival or Best Seller.">
              Ribbon
            </ProductFieldLabel>
            <input
              name="ribbon"
              placeholder="New Arrival"
              className="h-10 w-full rounded-[10px] border-0 bg-[var(--platform-surface)] px-3 text-sm text-[var(--platform-text-primary)] outline-none placeholder:text-[var(--platform-text-muted)] focus:bg-[var(--platform-accent-soft)] focus:ring-2 focus:ring-[var(--platform-focus-ring)]"
            />
          </label>
        </div>
        <label className="grid gap-1.5 text-sm">
          <ProductFieldLabel>Description</ProductFieldLabel>
          <ProductSimpleRichText name="description" variant="dark" placeholder="Describe features, payload, and warranty details..." />
        </label>
      </section>

      <ProductPricingFields initialPrice={0} variant="dark" />
      <ProductTaxFields variant="dark" />
    </div>
  );
}
