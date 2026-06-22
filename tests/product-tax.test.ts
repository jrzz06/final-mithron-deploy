import { describe, expect, it } from "vitest";
import { calculateProductTaxBreakdown, summarizeCartTax } from "@/lib/product-tax";

describe("product tax", () => {
  it("adds GST on top of exclusive prices", () => {
    expect(calculateProductTaxBreakdown({
      unitPrice: 475000,
      quantity: 1,
      chargeTax: true,
      taxGroup: "products-default",
      taxRate: 18,
      taxIncluded: false
    })).toMatchObject({
      taxableBase: 475000,
      taxAmount: 85500,
      lineTotal: 560500
    });
  });

  it("extracts GST from inclusive prices", () => {
    expect(calculateProductTaxBreakdown({
      unitPrice: 450000,
      quantity: 1,
      chargeTax: true,
      taxGroup: "agri-drones",
      taxRate: 5,
      taxIncluded: true
    })).toMatchObject({
      taxableBase: 428571.43,
      taxAmount: 21428.57,
      lineTotal: 450000
    });
  });

  it("summarizes cart GST consistently", () => {
    expect(summarizeCartTax([
      {
        unitPrice: 100000,
        quantity: 1,
        chargeTax: true,
        taxGroup: "agri-drones",
        taxRate: 5
      },
      {
        unitPrice: 33000,
        quantity: 2,
        chargeTax: true,
        taxGroup: "agri-accessories",
        taxRate: 12
      }
    ])).toMatchObject({
      subtotal: 166000,
      taxTotal: 12920,
      total: 178920
    });
  });
});
