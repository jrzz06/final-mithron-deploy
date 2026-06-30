"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CartItem } from "@/config/types";
import { summarizeCartTax } from "@/lib/product-tax";
import { useCartStore } from "@/store/cart";

type CartPricingResponse = {
  lines: CartItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
};

export function useResolvedCart() {
  const items = useCartStore((state) => state.items);
  const [resolvedItems, setResolvedItems] = useState<CartItem[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [pricingChanged, setPricingChanged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousTotalRef = useRef<number | null>(null);

  const resolvePricing = useCallback(async () => {
    if (!items.length) {
      setResolvedItems([]);
      setPricingChanged(false);
      setError(null);
      previousTotalRef.current = null;
      return;
    }

    setIsResolving(true);
    setError(null);

    try {
      const response = await fetch("/api/cart/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        cache: "no-store"
      });
      const payload = (await response.json()) as CartPricingResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load current cart pricing.");
      }

      const previousTotal = previousTotalRef.current;
      if (previousTotal !== null && Math.abs(previousTotal - payload.total) > 0.009) {
        setPricingChanged(true);
      } else {
        setPricingChanged(false);
      }
      previousTotalRef.current = payload.total;
      setResolvedItems(payload.lines);
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : "Unable to load current cart pricing.");
      setResolvedItems([]);
    } finally {
      setIsResolving(false);
    }
  }, [items]);

  useEffect(() => {
    void resolvePricing();
  }, [resolvePricing]);

  const pricing = useMemo(() => summarizeCartTax(resolvedItems), [resolvedItems]);
  const itemCount = useMemo(() => resolvedItems.reduce((sum, item) => sum + item.quantity, 0), [resolvedItems]);

  return {
    items: resolvedItems,
    persistedItems: items,
    subtotal: pricing.subtotal,
    taxTotal: pricing.taxTotal,
    grandTotal: pricing.total,
    itemCount,
    isResolving,
    pricingChanged,
    error,
    refreshPricing: resolvePricing,
    clearPricingChanged: () => setPricingChanged(false)
  };
}
