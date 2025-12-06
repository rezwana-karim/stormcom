import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";

interface Product {
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  thumbnailUrl?: string | null;
  images: string;
  category?: {
    name: string;
    slug: string;
  } | null;
  isFeatured?: boolean;
}

interface ProductGridProps {
  products: Product[];
  storeSlug: string;
  className?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

/**
 * Responsive product grid wrapper
 * Configurable columns for different breakpoints
 */
export function ProductGrid({
  products,
  storeSlug,
  className,
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 4,
  },
}: ProductGridProps) {
  const gridClasses = cn(
    "grid gap-6",
    {
      "grid-cols-1": columns.mobile === 1,
      "grid-cols-2": columns.mobile === 2,
      "sm:grid-cols-2": columns.tablet === 2,
      "sm:grid-cols-3": columns.tablet === 3,
      "md:grid-cols-3": columns.desktop === 3,
      "md:grid-cols-4": columns.desktop === 4,
      "lg:grid-cols-4": columns.desktop === 4,
      "lg:grid-cols-5": columns.desktop === 5,
    },
    className
  );

  return (
    <div className={gridClasses}>
      {products.map((product) => (
        <ProductCard
          key={product.slug}
          product={product}
          storeSlug={storeSlug}
        />
      ))}
    </div>
  );
}
