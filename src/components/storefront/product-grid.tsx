import { getProductImageUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  thumbnailUrl: string | null;
  images: string;
  category?: {
    name: string;
    slug: string;
  } | null;
}

interface ProductGridProps {
  products: Product[];
  storeSlug: string;
  showCategory?: boolean;
  columns?: 2 | 3 | 4;
}

/**
 * Reusable product grid component for storefront
 * Displays products in a responsive grid layout
 */
export function ProductGrid({
  products,
  storeSlug,
  showCategory = false,
  columns = 4,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No products found.</p>
      </div>
    );
  }

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {products.map((product) => {
        const imageUrl = getProductImageUrl(product.thumbnailUrl, product.images);
        const hasDiscount =
          product.compareAtPrice && product.compareAtPrice > product.price;
        const discountPercent = hasDiscount
          ? Math.round(
              ((product.compareAtPrice! - product.price) /
                product.compareAtPrice!) *
                100
            )
          : 0;

        return (
          <Link
            key={product.id}
            href={`/store/${storeSlug}/products/${product.slug}`}
            className="group rounded-lg border overflow-hidden hover:border-primary transition-colors bg-card"
          >
            {/* Product Image */}
            <div className="aspect-square bg-muted relative overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🛍️</span>
                </div>
              )}

              {/* Sale Badge */}
              {hasDiscount && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-medium">
                  {discountPercent}% OFF
                </span>
              )}

              {/* Quick View Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium">
                  View Details
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
              {/* Category */}
              {showCategory && product.category && (
                <p className="text-xs text-muted-foreground mb-1">
                  {product.category.name}
                </p>
              )}

              {/* Name */}
              <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors min-h-10">
                {product.name}
              </h3>

              {/* Price */}
              <div className="mt-2 flex items-center gap-2">
                <span className="font-bold text-lg">
                  ${product.price.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.compareAtPrice!.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
