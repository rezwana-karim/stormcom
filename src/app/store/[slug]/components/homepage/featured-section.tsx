import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ProductGrid } from "../product-grid";
import type { FeaturedProductsConfig } from "@/types/storefront-config";
import type { Product, StoreInfo } from "./types";

interface FeaturedSectionProps {
  store: StoreInfo;
  products: Product[];
  config: FeaturedProductsConfig;
}

/**
 * Featured Products Section
 * Displays featured products with configurable count and headings
 * Includes empty state when no products are available
 */
export function FeaturedSection({ 
  store, 
  products, 
  config 
}: FeaturedSectionProps) {
  if (!config.enabled) {
    return null;
  }

  // Limit products based on config
  const displayProducts = products.slice(0, config.count);

  return (
    <section className="container mx-auto px-4 py-16 bg-muted/30">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">{config.heading}</h2>
          {config.subheading && (
            <p className="text-muted-foreground">
              {config.subheading}
            </p>
          )}
        </div>
        <Button asChild variant="outline">
          <Link href={`/store/${store.slug}/products`}>
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Products or Empty State */}
      {displayProducts.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border-2 border-dashed">
          <div className="text-6xl mb-4">🛍️</div>
          <h3 className="text-xl font-semibold mb-2">No Featured Products Yet</h3>
          <p className="text-muted-foreground mb-6">
            Check back soon for amazing deals!
          </p>
          <Button asChild>
            <Link href={`/store/${store.slug}/products`}>
              Browse All Products
            </Link>
          </Button>
        </div>
      ) : (
        <ProductGrid
          products={displayProducts}
          storeSlug={store.slug}
          columns={{ mobile: 1, tablet: 2, desktop: 4 }}
        />
      )}
    </section>
  );
}
