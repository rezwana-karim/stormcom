import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number | null;
  className?: string;
  showDiscount?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Price display component with sale price support
 * Shows current price, compare-at price, and optional discount badge
 */
export function PriceDisplay({
  price,
  compareAtPrice,
  className,
  showDiscount = true,
  size = "md",
}: PriceDisplayProps) {
  const isOnSale = compareAtPrice && compareAtPrice > price;
  const discountPercentage = isOnSale
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const compareSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <span className={cn("font-bold text-foreground", sizeClasses[size])}>
        ${price.toFixed(2)}
      </span>

      {isOnSale && (
        <>
          <span
            className={cn(
              "font-medium text-muted-foreground line-through",
              compareSizeClasses[size]
            )}
          >
            ${compareAtPrice.toFixed(2)}
          </span>

          {showDiscount && discountPercentage > 0 && (
            <Badge variant="destructive" className="text-xs">
              -{discountPercentage}%
            </Badge>
          )}
        </>
      )}
    </div>
  );
}
