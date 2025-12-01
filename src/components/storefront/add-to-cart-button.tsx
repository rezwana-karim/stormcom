"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, Loader2 } from "lucide-react";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  disabled?: boolean;
  storeSlug: string;
  variantId?: string;
}

/**
 * Add to Cart button component for storefront
 * Handles quantity selection and cart API calls
 */
export function AddToCartButton({
  productId,
  productName,
  disabled = false,
  storeSlug: _storeSlug,
  variantId,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId,
          quantity,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add to cart");
      }

      toast.success(`Added ${quantity} × ${productName} to cart`, {
        action: {
          label: "View Cart",
          onClick: () => {
            window.location.href = "/checkout";
          },
        },
      });

      // Reset quantity after adding
      setQuantity(1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add to cart"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const incrementQuantity = () => {
    setQuantity((prev) => Math.min(99, prev + 1));
  };

  return (
    <div className="flex items-center gap-4">
      {/* Quantity Selector */}
      <div className="flex items-center border rounded-md">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-r-none"
          onClick={decrementQuantity}
          disabled={disabled || quantity <= 1}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center font-medium">{quantity}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-l-none"
          onClick={incrementQuantity}
          disabled={disabled || quantity >= 99}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Add to Cart Button */}
      <Button
        type="button"
        className="flex-1 min-w-40"
        size="lg"
        disabled={disabled || isLoading}
        onClick={handleAddToCart}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </>
        )}
      </Button>
    </div>
  );
}
