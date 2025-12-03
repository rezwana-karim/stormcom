"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CartItem {
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

interface Cart {
  items: CartItem[];
}

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    inventoryQty: number;
    thumbnailUrl?: string | null;
  };
  variant?: {
    id: string;
    sku: string;
    price?: number | null;
    inventoryQty: number;
  } | null;
  storeSlug: string;
  className?: string;
}

/**
 * Add to cart button with quantity selector and loading states
 * Manages cart state in localStorage
 */
export function AddToCartButton({
  product,
  variant,
  storeSlug,
  className,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const maxQuantity = variant?.inventoryQty || product.inventoryQty;
  const isOutOfStock = maxQuantity === 0;
  const price = variant?.price || product.price;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const newQty = prev + delta;
      return Math.max(1, Math.min(newQty, maxQuantity));
    });
  };

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      // Get existing cart from localStorage
      const cartKey = `cart_${storeSlug}`;
      const existingCart = localStorage.getItem(cartKey);
      const cart: Cart = existingCart ? JSON.parse(existingCart) : { items: [] };

      // Check if item already exists in cart
      const itemKey = variant ? `variant_${variant.id}` : `product_${product.id}`;
      const existingItemIndex = cart.items.findIndex(
        (item: CartItem) => item.key === itemKey
      );

      if (existingItemIndex >= 0) {
        // Update quantity
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.items.push({
          key: itemKey,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          variantId: variant?.id,
          variantSku: variant?.sku,
          price,
          quantity,
          thumbnailUrl: product.thumbnailUrl,
        });
      }

      // Save to localStorage
      localStorage.setItem(cartKey, JSON.stringify(cart));

      // Dispatch event for cart update
      window.dispatchEvent(new CustomEvent("cartUpdated"));

      toast.success("Added to cart", {
        description: `${quantity}x ${product.name} added to your cart.`,
      });

      setQuantity(1); // Reset quantity after adding
    } catch {
      toast.error("Error", {
        description: "Failed to add item to cart. Please try again.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Quantity:</label>
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            disabled={quantity <= 1 || isOutOfStock}
            onClick={() => handleQuantityChange(-1)}
          >
            <Minus className="h-4 w-4" />
            <span className="sr-only">Decrease quantity</span>
          </Button>

          <div className="px-4 py-2 min-w-[3rem] text-center font-medium">
            {quantity}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            disabled={quantity >= maxQuantity || isOutOfStock}
            onClick={() => handleQuantityChange(1)}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Increase quantity</span>
          </Button>
        </div>

        {maxQuantity > 0 && maxQuantity <= 10 && (
          <span className="text-sm text-muted-foreground">
            ({maxQuantity} available)
          </span>
        )}
      </div>

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className="w-full"
        disabled={isOutOfStock || isAdding}
        onClick={handleAddToCart}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {isOutOfStock
          ? "Out of Stock"
          : isAdding
          ? "Adding..."
          : "Add to Cart"}
      </Button>
    </div>
  );
}
