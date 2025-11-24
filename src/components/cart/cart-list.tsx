'use client';

import { useState } from 'react';
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
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/cart-context';
import Image from 'next/image';

export function CartList() {
  const { cart, loading, updateQuantity, removeItem, clearCart } = useCart();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    setUpdatingItems((prev) => new Set(prev).add(itemId));

    try {
      await updateQuantity(itemId, newQuantity);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));

    try {
      await removeItem(itemId);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;
    await clearCart();
  };

  const handleCheckout = () => {
    router.push('/dashboard/checkout');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading cart...</span>
      </div>
    );
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
                <div className="relative w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{item.productName}</h4>
                      {item.variantName && (
                        <p className="text-sm text-muted-foreground">{item.variantName}</p>
                      )}
                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                      <p className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} each
                      </p>
                      {item.availableStock < 10 && (
                        <p className="text-xs text-orange-600 mt-1">
                          Only {item.availableStock} left in stock
                        </p>
                      )}
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
                        disabled={updatingItems.has(item.id) || item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        max={item.maxQuantity}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          const quantity = Math.min(Math.max(1, val), item.maxQuantity);
                          handleUpdateQuantity(item.id, quantity);
                        }}
                        className="w-16 text-center h-8"
                        disabled={updatingItems.has(item.id)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={
                          updatingItems.has(item.id) || item.quantity >= item.maxQuantity
                        }
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
              <span>{cart.shipping === 0 ? 'FREE' : `$${cart.shipping.toFixed(2)}`}</span>
            </div>
            {cart.subtotal > 0 && cart.subtotal < 50 && (
              <p className="text-xs text-muted-foreground">
                Add ${(50 - cart.subtotal).toFixed(2)} more for free shipping
              </p>
            )}
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
