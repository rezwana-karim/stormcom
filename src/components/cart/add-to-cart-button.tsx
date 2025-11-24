/**
 * Add to Cart Button Component
 * Reusable button for adding products to cart
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { cn } from '@/lib/utils';

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  quantity?: number;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  showIcon?: boolean;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function AddToCartButton({
  productId,
  variantId,
  quantity = 1,
  className,
  size = 'default',
  variant = 'default',
  showIcon = true,
  children,
  onSuccess,
  onError,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      await addToCart(productId, variantId, quantity);
      setSuccess(true);
      onSuccess?.();

      // Reset success state after 2 seconds
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={loading}
      size={size}
      variant={variant}
      className={cn(className)}
    >
      {loading ? (
        <>
          <Loader2 className={cn("animate-spin", showIcon && "mr-2", size === 'icon' ? "h-4 w-4" : "h-4 w-4")} />
          {size !== 'icon' && (children || 'Adding...')}
        </>
      ) : success ? (
        <>
          <Check className={cn(showIcon && "mr-2", size === 'icon' ? "h-4 w-4" : "h-4 w-4")} />
          {size !== 'icon' && 'Added!'}
        </>
      ) : (
        <>
          {showIcon && <ShoppingCart className={cn(size !== 'icon' && "mr-2", size === 'icon' ? "h-4 w-4" : "h-4 w-4")} />}
          {size !== 'icon' && (children || 'Add to Cart')}
        </>
      )}
    </Button>
  );
}
