import { formatINR } from "@/lib/utils";
import { getProductTaxGroup, resolveProductTaxRate } from "@/lib/product-tax-groups";

export type ProductTaxInput = {
  unitPrice: number;
  quantity?: number;
  chargeTax?: boolean | null;
  taxRate?: number | null;
  taxIncluded?: boolean | null;
  taxGroup?: string | null;
};

export type ProductTaxBreakdown = {
  quantity: number;
  unitPrice: number;
  chargeTax: boolean;
  taxRate: number;
  taxIncluded: boolean;
  taxGroupLabel: string;
  taxableBase: number;
  taxAmount: number;
  lineTotal: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateProductTaxBreakdown(input: ProductTaxInput): ProductTaxBreakdown {
  const quantity = Math.max(1, input.quantity ?? 1);
  const unitPrice = Math.max(0, input.unitPrice);
  const chargeTax = input.chargeTax !== false;
  const taxIncluded = Boolean(input.taxIncluded);
  const taxRate = chargeTax ? resolveProductTaxRate(input) : 0;
  const taxGroupLabel = getProductTaxGroup(input.taxGroup).label;
  const gross = roundCurrency(unitPrice * quantity);

  if (!chargeTax || taxRate <= 0) {
    return {
      quantity,
      unitPrice,
      chargeTax: false,
      taxRate: 0,
      taxIncluded,
      taxGroupLabel,
      taxableBase: gross,
      taxAmount: 0,
      lineTotal: gross
    };
  }

  if (taxIncluded) {
    const taxAmount = roundCurrency(gross - gross / (1 + taxRate / 100));
    const taxableBase = roundCurrency(gross - taxAmount);
    return {
      quantity,
      unitPrice,
      chargeTax: true,
      taxRate,
      taxIncluded: true,
      taxGroupLabel,
      taxableBase,
      taxAmount,
      lineTotal: gross
    };
  }

  const taxableBase = gross;
  const taxAmount = roundCurrency(taxableBase * (taxRate / 100));
  return {
    quantity,
    unitPrice,
    chargeTax: true,
    taxRate,
    taxIncluded: false,
    taxGroupLabel,
    taxableBase,
    taxAmount,
    lineTotal: roundCurrency(taxableBase + taxAmount)
  };
}

export function summarizeCartTax(lines: ProductTaxInput[]) {
  const breakdowns = lines.map((line) => calculateProductTaxBreakdown(line));
  const subtotal = roundCurrency(breakdowns.reduce((sum, line) => sum + line.taxableBase, 0));
  const taxTotal = roundCurrency(breakdowns.reduce((sum, line) => sum + line.taxAmount, 0));
  const total = roundCurrency(breakdowns.reduce((sum, line) => sum + line.lineTotal, 0));

  return {
    breakdowns,
    subtotal,
    taxTotal,
    total
  };
}

export function formatProductTaxPriceLabel(input: ProductTaxInput) {
  const breakdown = calculateProductTaxBreakdown({ ...input, quantity: 1 });
  const priceLabel = formatINR(breakdown.unitPrice);

  if (!breakdown.chargeTax || breakdown.taxRate <= 0) {
    return priceLabel;
  }

  if (breakdown.taxIncluded) {
    return `${priceLabel} incl. GST`;
  }

  const gstAmount = roundCurrency(breakdown.unitPrice * (breakdown.taxRate / 100));
  return `${priceLabel} + ${breakdown.taxRate}% GST (${formatINR(gstAmount)})`;
}
