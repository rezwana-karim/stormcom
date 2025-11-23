'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  quantity: number;
  price: number;
  image: string;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
}

const mockCart: Cart = {
  id: 'cart_123',
  items: [
    {
      id: 'item1',
      productId: 'prod1',
      productName: 'Wireless Headphones',
      quantity: 2,
      price: 79.99,
      image: 'https://via.placeholder.com/150',
    },
    {
      id: 'item2',
      productId: 'prod2',
      productName: 'Smart Watch',
      quantity: 1,
      price: 299.99,
      image: 'https://via.placeholder.com/150',
    },
  ],
  subtotal: 459.97,
  tax: 36.80,
  shipping: 10.00,
  total: 506.77,
  itemCount: 3,
};

export function CartList() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/cart');
        if (!response.ok) throw new Error('Failed to fetch cart');

        const data = await response.json();
        setCart(data.cart);
      } catch {
        // Use mock data on error
        setCart(mockCart);
        console.log('Using mock cart data');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    setUpdatingItems(prev => new Set(prev).add(itemId));

    try {
      if (newQuantity === 0) {
        await handleRemoveItem(itemId);
        return;
      }

      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) throw new Error('Failed to update quantity');

      // Update local state
      setCart(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          ),
        };
      });

      toast({
        title: 'Cart updated',
        description: 'Item quantity updated successfully',
      });
    } catch {
      toast({
        title: 'Update failed',
        description: 'Failed to update item quantity',
      });
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove item');

      // Update local state
      setCart(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter(item => item.id !== itemId),
        };
      });

      toast({
        title: 'Item removed',
        description: 'Item removed from cart',
      });
    } catch {
      toast({
        title: 'Remove failed',
        description: 'Failed to remove item from cart',
      });
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;

    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to clear cart');

      setCart({ ...mockCart, items: [], itemCount: 0, subtotal: 0, total: 0 });

      toast({
        title: 'Cart cleared',
        description: 'All items removed from cart',
      });
    } catch {
      toast({
        title: 'Clear failed',
        description: 'Failed to clear cart',
      });
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (loading) {
    return <div className="text-center py-8">Loading cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground mb-6">Add some products to get started</p>
          <Button onClick={() => router.push('/dashboard/products')}>
            Browse Products
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Cart Items</h3>
            <p className="text-sm text-muted-foreground">
              {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          {cart.items.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearCart}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {cart.items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.productName}
                  className="w-24 h-24 object-cover rounded-md"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{item.productName}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={updatingItems.has(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={updatingItems.has(item.id)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center h-8"
                        disabled={updatingItems.has(item.id)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={updatingItems.has(item.id)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="secondary">
                        ${(item.price * item.quantity).toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review your order details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>${cart.tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>${cart.shipping.toFixed(2)}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={handleCheckout}>
              Proceed to Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
