/**
 * Cart Context Provider
 * Manages cart state across the application with optimistic updates
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  productName: string;
  variantName: string | null;
  sku: string;
  image: string | null;
  availableStock: number;
  maxQuantity: number;
}

export interface Cart {
  id: string;
  userId: string | null;
  sessionId: string | null;
  storeId: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getItemCount: () => number;
}

// ============================================================================
// CONTEXT
// ============================================================================

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface CartProviderProps {
  children: React.ReactNode;
  storeId: string;
}

export function CartProvider({ children, storeId }: CartProviderProps) {
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart from API
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/cart?storeId=${storeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      const data = await response.json();
      setCart(data.cart);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load cart';
      setError(message);
      console.error('Cart fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  // Initial cart load
  useEffect(() => {
    if (status !== 'loading') {
      fetchCart();
    }
  }, [fetchCart, status]);

  // Add item to cart
  const addToCart = useCallback(
    async (productId: string, variantId?: string, quantity: number = 1) => {
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId,
            productId,
            variantId,
            quantity,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add item to cart');
        }

        const data = await response.json();
        setCart(data.cart);
        toast.success('Item added to cart');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add item to cart';
        toast.error(message);
        throw err;
      }
    },
    [storeId]
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!cart) return;

      // Optimistic update
      const previousCart = cart;
      setCart({
        ...cart,
        items: cart.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        ),
      });

      try {
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update quantity');
        }

        const data = await response.json();
        setCart(data.cart);
        toast.success('Cart updated');
      } catch (err) {
        // Rollback on error
        setCart(previousCart);
        const message = err instanceof Error ? err.message : 'Failed to update cart';
        toast.error(message);
        throw err;
      }
    },
    [cart]
  );

  // Remove item from cart
  const removeItem = useCallback(
    async (itemId: string) => {
      if (!cart) return;

      // Optimistic update
      const previousCart = cart;
      setCart({
        ...cart,
        items: cart.items.filter((item) => item.id !== itemId),
      });

      try {
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to remove item');
        }

        const data = await response.json();
        setCart(data.cart);
        toast.success('Item removed from cart');
      } catch (err) {
        // Rollback on error
        setCart(previousCart);
        const message = err instanceof Error ? err.message : 'Failed to remove item';
        toast.error(message);
        throw err;
      }
    },
    [cart]
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    if (!cart) return;

    // Optimistic update
    const previousCart = cart;
    setCart({ ...cart, items: [], itemCount: 0, subtotal: 0, total: 0 });

    try {
      const response = await fetch(`/api/cart?storeId=${storeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      await fetchCart();
      toast.success('Cart cleared');
    } catch (err) {
      // Rollback on error
      setCart(previousCart);
      const message = err instanceof Error ? err.message : 'Failed to clear cart';
      toast.error(message);
      throw err;
    }
  }, [cart, storeId, fetchCart]);

  // Get item count
  const getItemCount = useCallback(() => {
    return cart?.itemCount || 0;
  }, [cart]);

  const value: CartContextValue = {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
    getItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
