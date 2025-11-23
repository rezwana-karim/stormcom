/**
 * Cart Review Step - First step in checkout flow
 * Displays cart items and allows quantity adjustments
 */

'use client';

import { useState, useEffect } from 'react';
import { Loader2, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

// TODO: Replace with actual cart data from API or state management
interface CartItem {
  id: string;
  productId: string;
  productName: string;
  variantName?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  sku: string;
}

interface CartReviewStepProps {
  onNext: () => void;
  isProcessing: boolean;
}

export function CartReviewStep({ onNext, isProcessing }: CartReviewStepProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // TODO: Fetch cart data from API
    // For now, using mock data
    setTimeout(() => {
      setCartItems([
        {
          id: '1',
          productId: 'prod-1',
          productName: 'Wireless Mouse',
          variantName: 'Black',
          price: 29.99,
          quantity: 1,
          sku: 'WM-001-BLK',
        },
        {
          id: '2',
          productId: 'prod-2',
          productName: 'Mechanical Keyboard',
          variantName: 'Blue Switches',
          price: 69.99,
          quantity: 1,
          sku: 'MK-002-BLU',
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((items) => items.filter((item) => item.id !== itemId));
  };

  const handleValidateAndProceed = async () => {
    setIsValidating(true);
    
    try {
      // TODO: Call POST /api/checkout/validate
      // const response = await fetch('/api/checkout/validate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ items: cartItems }),
      // });
      
      // if (!response.ok) {
      //   throw new Error('Cart validation failed');
      // }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onNext();
    } catch (error) {
      console.error('Validation error:', error);
      // TODO: Show error toast
    } finally {
      setIsValidating(false);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cartItems.length === 0) {
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
        {cartItems.map((item) => (
          <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
            {/* Product Image Placeholder */}
            <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
              <span className="text-xs text-muted-foreground">No image</span>
            </div>

            {/* Product Details */}
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-medium">{item.productName}</h3>
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
                    disabled={item.quantity <= 1}
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
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>

            {/* Price */}
            <div className="text-right">
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
          <span>Subtotal ({cartItems.length} items)</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
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
          onClick={handleValidateAndProceed}
          disabled={isValidating || isProcessing}
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            'Proceed to Shipping'
          )}
        </Button>
      </div>
    </div>
  );
}
