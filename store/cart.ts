import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CheckoutDraft, CheckoutStep, PersistedCartItem } from "@/config/types";
import { stripPersistedCartItems } from "@/lib/cart-pricing";

export type NewCartItem = Omit<PersistedCartItem, "quantity"> & {
  quantity?: number;
  productName?: string;
  bundleName?: string;
  image?: string;
  chargeTax?: boolean;
  taxGroup?: string;
  taxRate?: number;
  taxIncluded?: boolean;
  category?: string;
  sku?: string;
  availabilityLabel?: string;
};

export type CartSlice = {
  items: PersistedCartItem[];
  checkout: CheckoutDraft;
  isCartOpen: boolean;
  hasOpenedCart: boolean;
  addItem: (item: NewCartItem) => void;
  removeItem: (productSlug: string, bundleId: string) => void;
  setQuantity: (productSlug: string, bundleId: string, quantity: number) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  setCheckoutStep: (step: CheckoutStep) => void;
  setPromoCode: (promoCode: string) => void;
  setCheckoutEmail: (email: string) => void;
  setCheckoutRegion: (region: string) => void;
  setShippingAddressId: (addressId: string) => void;
  setBillingAddressId: (addressId: string) => void;
  setCheckoutOrderMeta: (meta: Partial<Pick<CheckoutDraft, "paymentIntentId" | "orderId">>) => void;
  itemCount: () => number;
};

const initialCheckout: CheckoutDraft = {
  step: "cart",
  promoCode: "",
  email: "",
  region: "India"
};

function toPersistedItem(item: NewCartItem): PersistedCartItem {
  return {
    productSlug: item.productSlug,
    bundleId: item.bundleId,
    quantity: item.quantity ?? 1,
    ...(item.variantId ? { variantId: item.variantId } : {})
  };
}

export function createCartSlice(): CartSlice {
  const slice: CartSlice = {
    items: [],
    checkout: initialCheckout,
    isCartOpen: false,
    hasOpenedCart: false,
    addItem(item) {
      const persisted = toPersistedItem({ ...item, quantity: item.quantity ?? 1 });
      const existing = slice.items.find(
        (entry) => entry.productSlug === persisted.productSlug && entry.bundleId === persisted.bundleId
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        slice.items.push(persisted);
      }
    },
    removeItem(productSlug, bundleId) {
      slice.items = slice.items.filter((entry) => entry.productSlug !== productSlug || entry.bundleId !== bundleId);
    },
    setQuantity(productSlug, bundleId, quantity) {
      if (quantity <= 0) {
        slice.removeItem(productSlug, bundleId);
        return;
      }
      slice.items = slice.items.map((entry) =>
        entry.productSlug === productSlug && entry.bundleId === bundleId ? { ...entry, quantity } : entry
      );
    },
    clearCart() {
      slice.items = [];
      slice.checkout = initialCheckout;
    },
    setCartOpen(open) {
      slice.isCartOpen = open;
      if (open) slice.hasOpenedCart = true;
    },
    setCheckoutStep(step) {
      slice.checkout = { ...slice.checkout, step };
    },
    setPromoCode(promoCode) {
      slice.checkout = { ...slice.checkout, promoCode };
    },
    setCheckoutEmail(email) {
      slice.checkout = { ...slice.checkout, email };
    },
    setCheckoutRegion(region) {
      slice.checkout = { ...slice.checkout, region };
    },
    setShippingAddressId(shippingAddressId) {
      slice.checkout = { ...slice.checkout, shippingAddressId };
    },
    setBillingAddressId(billingAddressId) {
      slice.checkout = { ...slice.checkout, billingAddressId };
    },
    setCheckoutOrderMeta(meta) {
      slice.checkout = { ...slice.checkout, ...meta };
    },
    itemCount() {
      return slice.items.reduce((sum, item) => sum + item.quantity, 0);
    }
  };

  return slice;
}

type CartStore = CartSlice;

const CART_STORAGE_VERSION = 2;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      checkout: initialCheckout,
      isCartOpen: false,
      hasOpenedCart: false,
      addItem(item) {
        const persisted = toPersistedItem({ ...item, quantity: 1 });
        set((state) => {
          const existing = state.items.find(
            (entry) => entry.productSlug === persisted.productSlug && entry.bundleId === persisted.bundleId
          );
          if (existing) {
            return {
              items: state.items.map((entry) =>
                entry.productSlug === persisted.productSlug && entry.bundleId === persisted.bundleId
                  ? { ...entry, quantity: entry.quantity + 1 }
                  : entry
              ),
              isCartOpen: true,
              hasOpenedCart: true
            };
          }
          return { items: [...state.items, persisted], isCartOpen: true, hasOpenedCart: true };
        });
      },
      removeItem(productSlug, bundleId) {
        set((state) => ({
          items: state.items.filter((entry) => entry.productSlug !== productSlug || entry.bundleId !== bundleId)
        }));
      },
      setQuantity(productSlug, bundleId, quantity) {
        if (quantity <= 0) {
          get().removeItem(productSlug, bundleId);
          return;
        }
        set((state) => ({
          items: state.items.map((entry) =>
            entry.productSlug === productSlug && entry.bundleId === bundleId ? { ...entry, quantity } : entry
          )
        }));
      },
      clearCart() {
        set({ items: [], checkout: initialCheckout });
      },
      setCartOpen(open) {
        set((state) => ({ isCartOpen: open, hasOpenedCart: state.hasOpenedCart || open }));
      },
      setCheckoutStep(step) {
        set((state) => ({ checkout: { ...state.checkout, step } }));
      },
      setPromoCode(promoCode) {
        set((state) => ({ checkout: { ...state.checkout, promoCode } }));
      },
      setCheckoutEmail(email) {
        set((state) => ({ checkout: { ...state.checkout, email } }));
      },
      setCheckoutRegion(region) {
        set((state) => ({ checkout: { ...state.checkout, region } }));
      },
      setShippingAddressId(shippingAddressId) {
        set((state) => ({ checkout: { ...state.checkout, shippingAddressId } }));
      },
      setBillingAddressId(billingAddressId) {
        set((state) => ({ checkout: { ...state.checkout, billingAddressId } }));
      },
      setCheckoutOrderMeta(meta) {
        set((state) => ({ checkout: { ...state.checkout, ...meta } }));
      },
      itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      }
    }),
    {
      name: "mithron-aero-cart",
      version: CART_STORAGE_VERSION,
      migrate: (persistedState, version) => {
        const state = (persistedState ?? {}) as { items?: Array<PersistedCartItem & Record<string, unknown>>; checkout?: CheckoutDraft };
        if (version < CART_STORAGE_VERSION) {
          return {
            ...state,
            items: stripPersistedCartItems(state.items ?? [])
          };
        }
        return persistedState as CartStore;
      },
      partialize: (state) => ({
        items: state.items.map((item) => ({
          productSlug: item.productSlug,
          bundleId: item.bundleId,
          quantity: item.quantity,
          ...(item.variantId ? { variantId: item.variantId } : {})
        })),
        checkout: state.checkout
      })
    }
  )
);

export type { CartItem };
