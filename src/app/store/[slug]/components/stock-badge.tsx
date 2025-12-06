import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StockBadgeProps {
  inventoryQty: number;
  lowStockThreshold?: number;
  className?: string;
}

/**
 * Stock status badge component
 * Displays stock availability with color-coded status
 */
export function StockBadge({
  inventoryQty,
  lowStockThreshold = 5,
  className,
}: StockBadgeProps) {
  if (inventoryQty === 0) {
    return (
      <Badge variant="destructive" className={cn("text-xs", className)}>
        Out of Stock
      </Badge>
    );
  }

  if (inventoryQty <= lowStockThreshold) {
    return (
      <Badge variant="secondary" className={cn("text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200", className)}>
        Only {inventoryQty} left
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={cn("text-xs bg-green-100 text-green-800 hover:bg-green-200", className)}>
      In Stock
    </Badge>
  );
}
