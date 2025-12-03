"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  sku: string;
  price?: number | null;
  compareAtPrice?: number | null;
  inventoryQty: number;
  options: string; // JSON string
  isDefault: boolean;
  image?: string | null;
}

interface VariantSelectorProps {
  variants: Variant[];
  onVariantChange?: (variant: Variant) => void;
  className?: string;
}

/**
 * Variant selector component with visual feedback
 * Handles size, color, and other product options
 */
export function VariantSelector({
  variants,
  onVariantChange,
  className,
}: VariantSelectorProps) {
  const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);

  // Parse variant options from all variants to get available option types
  const optionTypes = new Map<string, Set<string>>();

  variants.forEach((variant) => {
    try {
      const options = JSON.parse(variant.options);
      Object.entries(options).forEach(([key, value]) => {
        if (!optionTypes.has(key)) {
          optionTypes.set(key, new Set());
        }
        optionTypes.get(key)!.add(String(value));
      });
    } catch {
      // Skip invalid JSON
    }
  });

  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    onVariantChange?.(variant);
  };

  if (variants.length <= 1) {
    return null; // No variants to select
  }

  return (
    <div className={cn("space-y-4", className)}>
      {Array.from(optionTypes.entries()).map(([optionName, optionValues]) => (
        <div key={optionName} className="space-y-2">
          <Label className="capitalize">
            {optionName}:{" "}
            <span className="font-semibold">
              {(() => {
                try {
                  const opts = JSON.parse(selectedVariant.options);
                  return opts[optionName];
                } catch {
                  return "";
                }
              })()}
            </span>
          </Label>

          <div className="flex flex-wrap gap-2">
            {Array.from(optionValues).map((value) => {
              // Find variant that matches this option value
              const matchingVariant = variants.find((v) => {
                try {
                  const opts = JSON.parse(v.options);
                  return opts[optionName] === value;
                } catch {
                  return false;
                }
              });

              if (!matchingVariant) return null;

              const isSelected = selectedVariant.id === matchingVariant.id;
              const isOutOfStock = matchingVariant.inventoryQty === 0;

              return (
                <Button
                  key={value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={isOutOfStock}
                  onClick={() => handleVariantSelect(matchingVariant)}
                  className={cn(
                    "min-w-[3rem]",
                    isOutOfStock && "opacity-50 cursor-not-allowed line-through"
                  )}
                >
                  {value}
                  {isOutOfStock && (
                    <span className="ml-1 text-xs">(Out)</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Variant Info */}
      {selectedVariant && (
        <div className="text-sm text-muted-foreground">
          <p>SKU: {selectedVariant.sku}</p>
          {selectedVariant.inventoryQty > 0 && selectedVariant.inventoryQty <= 5 && (
            <p className="text-yellow-600 font-medium">
              Only {selectedVariant.inventoryQty} left in stock
            </p>
          )}
        </div>
      )}
    </div>
  );
}
