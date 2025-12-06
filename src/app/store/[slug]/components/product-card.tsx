"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { PriceDisplay } from "./price-display";

interface ProductCardProps {
  product: {
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
  };
  storeSlug: string;
  className?: string;
}

/**
 * Modern product card component
 * Features: image, price, sale badge, category tag, hover effects
 */
export function ProductCard({ product, storeSlug, className }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Parse images JSON
  const images = (() => {
    try {
      const parsed = JSON.parse(product.images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const imageUrl = product.thumbnailUrl || images[0] || null;
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <Link href={`/store/${storeSlug}/products/${product.slug}`}>
      <Card
        className={cn(
          "group overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-300 hover:shadow-lg",
          className
        )}
      >
        <CardContent className="p-0">
          {/* Image */}
          <div className="relative aspect-square bg-muted overflow-hidden">
            {imageUrl ? (
              <>
                {/* Loading Indicator */}
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60" />
                  </div>
                )}
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className={cn(
                    "object-cover group-hover:scale-110 transition-all duration-500",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setImageLoaded(true)}
                  unoptimized
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-muted to-muted/50">
                <span className="text-6xl opacity-30">🛍️</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-2">
              {isOnSale && (
                <Badge variant="destructive" className="shadow-md">
                  Sale
                </Badge>
              )}
              {product.isFeatured && (
                <Badge className="bg-blue-500 hover:bg-blue-600 shadow-md">
                  Featured
                </Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4 space-y-2">
            {/* Category */}
            {product.category && (
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {product.category.name}
              </p>
            )}

            {/* Product Name */}
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors min-h-10">
              {product.name}
            </h3>

            {/* Price */}
            <PriceDisplay
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              size="md"
              className="pt-1"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
