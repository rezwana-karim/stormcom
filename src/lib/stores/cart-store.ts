/**
 * Cart Store - Global cart state management with Zustand
 * Supports multi-store isolation and localStorage persistence
 *
 * IMPORTANT: We use a single global store but track storeSlug to handle multi-store isolation.
 * When switching stores, the cart automatically loads the correct store's data.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  key: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId?: string;
  variantSku?: string;
  price: number;
  quantity: number;
  thumbnailUrl?: string | null;
}

interface CartState {
  items: CartItem[];
  storeSlug: string | null;
}

interface CartActions {
  setStoreSlug: (slug: string) => void;
  addItem: (item: Omit<CartItem, 'key'>) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getEstimatedTax: (taxRate?: number) => number;
  getEstimatedShipping: (freeShippingThreshold?: number, shippingCost?: number) => number;
  getTotal: (taxRate?: number, freeShippingThreshold?: number, shippingCost?: number) => number;
}

type CartStore = CartState & CartActions;

// Cache for per-store carts (stored in localStorage with different keys)
const getStorageKey = (slug: string) => `cart_${slug}`;

/**
 * Safely parse saved cart data from localStorage
 * @param cartJson - JSON string from localStorage
 * @returns Array of cart items or empty array on error
 */
function parseSavedCart(cartJson: string): CartItem[] {
  try {
    const parsed = JSON.parse(cartJson);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch (e) {
    console.error('[Cart] Failed to parse saved cart:', e);
    return [];
  }
}

/**
 * Generate unique cart item key
 * @param productId - Product ID
 * @param variantId - Optional variant ID
 * @returns Unique cart item key
 */
export function generateCartItemKey(productId: string, variantId?: string): string {
  return variantId ? `variant_${variantId}` : `product_${productId}`;
}

/**
 * Global cart store with per-store isolation
 * Automatically syncs with localStorage based on current storeSlug
 */
export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      storeSlug: null,

      setStoreSlug: (slug) => {
        const { storeSlug: currentSlug, items: currentItems } = get();
        
        // Ensure we're in browser environment for localStorage access
        if (typeof window === 'undefined') {
          set({ items: [], storeSlug: slug });
          return;
        }

        // Save current cart before switching stores (if we have items to save)
        if (currentSlug && currentSlug !== slug && currentItems.length > 0) {
          localStorage.setItem(getStorageKey(currentSlug), JSON.stringify({ items: currentItems }));
        }

        // Always load cart for the store from localStorage (handles hydration and refresh)
        const savedCart = localStorage.getItem(getStorageKey(slug));
        const items = savedCart ? parseSavedCart(savedCart) : [];
        
        // Update state if:
        // 1. Slug has changed (switching stores)
        // 2. Current items length doesn't match saved items length (hydration/refresh case)
        if (currentSlug !== slug || currentItems.length !== items.length) {
          set({ items, storeSlug: slug });
        }
      },

      addItem: (item) => {
        set((state) => {
          // Generate unique key for cart item using utility function
          const key = generateCartItemKey(item.productId, item.variantId);

          const existingItemIndex = state.items.findIndex((i) => i.key === key);

          if (existingItemIndex >= 0) {
            // Update existing item quantity
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + item.quantity,
            };
            return { items: updatedItems };
          }

          // Add new item
          return {
            items: [...state.items, { ...item, key }],
          };
        });

        // Save to localStorage and dispatch event
        const state = get();
        if (state.storeSlug && typeof window !== 'undefined') {
          localStorage.setItem(
            getStorageKey(state.storeSlug),
            JSON.stringify({ items: state.items })
          );
          window.dispatchEvent(new CustomEvent('cartUpdated'));
        }
      },

      removeItem: (key) => {
        set((state) => ({
          items: state.items.filter((item) => item.key !== key),
        }));

        // Save and dispatch
        const state = get();
        if (state.storeSlug && typeof window !== 'undefined') {
          localStorage.setItem(
            getStorageKey(state.storeSlug),
            JSON.stringify({ items: state.items })
          );
          window.dispatchEvent(new CustomEvent('cartUpdated'));
        }
      },

      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.key === key ? { ...item, quantity } : item
          ),
        }));

        // Save and dispatch
        const state = get();
        if (state.storeSlug && typeof window !== 'undefined') {
          localStorage.setItem(
            getStorageKey(state.storeSlug),
            JSON.stringify({ items: state.items })
          );
          window.dispatchEvent(new CustomEvent('cartUpdated'));
        }
      },

      clearCart: () => {
        set({ items: [] });

        // Save and dispatch
        const state = get();
        if (state.storeSlug && typeof window !== 'undefined') {
          localStorage.setItem(
            getStorageKey(state.storeSlug),
            JSON.stringify({ items: [] })
          );
          window.dispatchEvent(new CustomEvent('cartUpdated'));
        }
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },

      getEstimatedTax: (taxRate = 0.1) => {
        return get().getSubtotal() * taxRate;
      },

      getEstimatedShipping: (
        freeShippingThreshold = 50,
        shippingCost = 10
      ) => {
        const subtotal = get().getSubtotal();
        return subtotal >= freeShippingThreshold ? 0 : shippingCost;
      },

      getTotal: (
        taxRate = 0.1,
        freeShippingThreshold = 50,
        shippingCost = 10
      ) => {
        // Cache subtotal to avoid redundant calculations
        const subtotal = get().getSubtotal();
        const tax = subtotal * taxRate;
        const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCost;
        return subtotal + tax + shipping;
      },
    }),
    {
      name: 'cart-global-state', // Just for zustand state tracking
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // Return a no-op storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({ storeSlug: state.storeSlug }), // Only persist current storeSlug
    }
  )
);
