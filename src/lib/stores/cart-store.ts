"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================================================
// TYPES
// ============================================================================

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku: string;
  storeSlug: string;
}

interface CartState {
  items: CartItem[];
  lastUpdated: number;
}

interface CartActions {
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  clearStoreCart: (storeSlug: string) => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getStoreItems: (storeSlug: string) => CartItem[];
  getStoreItemCount: (storeSlug: string) => number;
  getStoreSubtotal: (storeSlug: string) => number;
}

type CartStore = CartState & CartActions;

// ============================================================================
// CONSTANTS
// ============================================================================

const CART_TTL_DAYS = 30;
const CART_TTL_MS = CART_TTL_DAYS * 24 * 60 * 60 * 1000;

// ============================================================================
// CART STORE
// ============================================================================

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // State
      items: [],
      lastUpdated: Date.now(),

      // Actions
      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) =>
              i.productId === item.productId &&
              i.variantId === item.variantId &&
              i.storeSlug === item.storeSlug
          );

          const quantity = item.quantity ?? 1;

          if (existingIndex >= 0) {
            // Update existing item quantity
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + quantity,
            };
            return { items: newItems, lastUpdated: Date.now() };
          }

          // Add new item
          return {
            items: [...state.items, { ...item, quantity }],
            lastUpdated: Date.now(),
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.productId === productId && item.variantId === variantId)
          ),
          lastUpdated: Date.now(),
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item
          ),
          lastUpdated: Date.now(),
        }));
      },

      clearCart: () => {
        set({ items: [], lastUpdated: Date.now() });
      },

      clearStoreCart: (storeSlug) => {
        set((state) => ({
          items: state.items.filter((item) => item.storeSlug !== storeSlug),
          lastUpdated: Date.now(),
        }));
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getStoreItems: (storeSlug) => {
        return get().items.filter((item) => item.storeSlug === storeSlug);
      },

      getStoreItemCount: (storeSlug) => {
        return get()
          .items.filter((item) => item.storeSlug === storeSlug)
          .reduce((count, item) => count + item.quantity, 0);
      },

      getStoreSubtotal: (storeSlug) => {
        return get()
          .items.filter((item) => item.storeSlug === storeSlug)
          .reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: "stormcom-cart",
      storage: createJSONStorage(() => localStorage),
      // TTL check on rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          const now = Date.now();
          if (now - state.lastUpdated > CART_TTL_MS) {
            // Cart is stale, clear it
            state.items = [];
            state.lastUpdated = now;
          }
        }
      },
    }
  )
);

// ============================================================================
// SELECTORS (for optimal re-renders)
// ============================================================================

export const selectCartItems = (state: CartStore) => state.items;
export const selectCartItemCount = (state: CartStore) => state.getItemCount();
export const selectCartSubtotal = (state: CartStore) => state.getSubtotal();
