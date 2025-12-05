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
        const currentSlug = get().storeSlug;
        const currentItems = get().items;
        
        // If changing stores, save current cart before switching
        if (currentSlug && currentSlug !== slug && typeof window !== 'undefined') {
          const currentCart = { items: currentItems };
          localStorage.setItem(getStorageKey(currentSlug), JSON.stringify(currentCart));
        }

        // Always load cart from localStorage if items are empty OR slug changed
        // This handles Zustand hydration race condition where storeSlug is restored
        // but items array is empty (since items aren't in persist partialize)
        const shouldLoadCart = currentSlug !== slug || currentItems.length === 0;
        
        if (shouldLoadCart && typeof window !== 'undefined') {
          const savedCart = localStorage.getItem(getStorageKey(slug));
          if (savedCart) {
            try {
              const parsed = JSON.parse(savedCart);
              const savedItems = parsed.items || [];
              // Only update if there's actual data to load
              if (savedItems.length > 0 || currentSlug !== slug) {
                set({ items: savedItems, storeSlug: slug });
                return;
              }
            } catch (e) {
              console.error('[Cart] Failed to parse cart:', e);
            }
          }
        }

        // Only update storeSlug if it changed
        if (currentSlug !== slug) {
          set({ items: [], storeSlug: slug });
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
