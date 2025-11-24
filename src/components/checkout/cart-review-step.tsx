/**
 * Cart Review Step - First step in checkout flow
 * Displays cart items and allows quantity adjustments
 */

'use client';

import { Loader2, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/cart-context';
import { useState } from 'react';
import Image from 'next/image';

interface CartReviewStepProps {
  onNext: () => void;
  isProcessing: boolean;
}

export function CartReviewStep({ onNext, isProcessing }: CartReviewStepProps) {
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-muted-foreground">Your cart is empty</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Items */}
      <div className="space-y-4">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
            {/* Product Image */}
            <div className="relative w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
              {item.image ? (
                <Image src={item.image} alt={item.productName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1 space-y-2 min-w-0">
              <div>
                <h3 className="font-medium truncate">{item.productName}</h3>
                {item.variantName && (
                  <p className="text-sm text-muted-foreground">{item.variantName}</p>
                )}
                <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                    }
                    className="h-8 w-12 border-0 text-center p-0"
                    min="1"
                    max={item.maxQuantity}
                    disabled={updatingItems.has(item.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.maxQuantity || updatingItems.has(item.id)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={updatingItems.has(item.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                ${item.price.toFixed(2)} each
              </p>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Subtotal */}
      <div className="space-y-2">
        <div className="flex justify-between text-base">
          <span>Subtotal ({cart.itemCount} items)</span>
          <span className="font-medium">${cart.subtotal.toFixed(2)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Shipping and taxes calculated at next step
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => window.history.back()}
        >
          Continue Shopping
        </Button>
        <Button
          className="flex-1"
          onClick={onNext}
          disabled={isProcessing || loading}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Proceed to Shipping'
          )}
        </Button>
      </div>
    </div>
  );
}
