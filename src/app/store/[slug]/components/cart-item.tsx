"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface CartItemProps {
  item: CartItem;
  storeSlug: string;
  onQuantityChange: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  className?: string;
}

/**
 * Cart line item component
 * Features: thumbnail, quantity adjustment, remove button
 */
export function CartItemComponent({
  item,
  storeSlug,
  onQuantityChange,
  onRemove,
  className,
}: CartItemProps) {
  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, item.quantity + delta);
    onQuantityChange(item.key, newQuantity);
  };

  const itemTotal = item.price * item.quantity;

  return (
    <div
      className={cn(
        "flex gap-4 py-4 border-b last:border-b-0",
        className
      )}
    >
      {/* Product Image */}
      <Link
        href={`/store/${storeSlug}/products/${item.productSlug}`}
        className="flex-shrink-0"
      >
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-md overflow-hidden">
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt={item.productName}
              fill
              className="object-cover"
              unoptimized
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-2xl opacity-30">🛍️</span>
            </div>
          )}
        </div>
      </Link>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/store/${storeSlug}/products/${item.productSlug}`}
          className="font-medium hover:text-primary transition-colors line-clamp-2"
        >
          {item.productName}
        </Link>

        {item.variantSku && (
          <p className="text-sm text-muted-foreground mt-1">
            SKU: {item.variantSku}
          </p>
        )}

        <p className="text-sm font-semibold mt-2">
          ${item.price.toFixed(2)} each
        </p>

        {/* Quantity Controls - Mobile */}
        <div className="flex items-center gap-2 mt-3 sm:hidden">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={item.quantity <= 1}
              onClick={() => handleQuantityChange(-1)}
            >
              <Minus className="h-3 w-3" />
            </Button>

            <div className="px-3 py-1 min-w-[2.5rem] text-center text-sm font-medium">
              {item.quantity}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onRemove(item.key)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove item</span>
          </Button>
        </div>
      </div>

      {/* Quantity Controls - Desktop */}
      <div className="hidden sm:flex items-start gap-4">
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            disabled={item.quantity <= 1}
            onClick={() => handleQuantityChange(-1)}
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="px-4 py-2 min-w-[3rem] text-center font-medium">
            {item.quantity}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => handleQuantityChange(1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Item Total */}
        <div className="text-right min-w-[5rem]">
          <p className="font-bold">${itemTotal.toFixed(2)}</p>
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.key)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove item</span>
        </Button>
      </div>

      {/* Item Total - Mobile */}
      <div className="sm:hidden text-right">
        <p className="font-bold">${itemTotal.toFixed(2)}</p>
      </div>
    </div>
  );
}
