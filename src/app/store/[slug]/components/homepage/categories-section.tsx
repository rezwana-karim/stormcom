import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoriesConfig } from "@/types/storefront-config";
import type { Category, StoreInfo } from "./types";

interface CategoriesSectionProps {
  store: StoreInfo;
  categories: Category[];
  config: CategoriesConfig;
}

/**
 * Categories Grid Section
 * Displays product categories with configurable columns and product counts
 * Supports 2, 3, or 4 column layouts
 */
export function CategoriesSection({ 
  store, 
  categories, 
  config 
}: CategoriesSectionProps) {
  if (!config.enabled || categories.length === 0) {
    return null;
  }

  // Limit categories based on config
  const displayCategories = categories.slice(0, config.maxCount);

  // Grid column classes based on config
  const gridClasses = cn(
    "grid gap-4 sm:gap-6",
    {
      "grid-cols-2": config.columns === 2,
      "grid-cols-2 sm:grid-cols-3": config.columns === 3,
      "grid-cols-2 sm:grid-cols-3 md:grid-cols-4": config.columns === 4,
    }
  );

  return (
    <section className="container mx-auto px-4 py-16">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Shop by Category</h2>
          <p className="text-muted-foreground">
            Explore our curated collections
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/store/${store.slug}/categories`}>
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      {/* Categories Grid */}
      <div className={gridClasses}>
        {displayCategories.map((category) => (
          <Link
            key={category.id}
            href={`/store/${store.slug}/categories/${category.slug}`}
            className="group relative rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-300 hover:shadow-xl"
          >
            {/* Category Image */}
            {category.image ? (
              <div className="aspect-square bg-muted relative">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  unoptimized
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </div>
            ) : (
              <div className="aspect-square bg-linear-to-br from-muted to-muted/50 flex items-center justify-center">
                <span className="text-5xl opacity-30">📦</span>
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Category Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-lg mb-1">
                {category.name}
              </h3>
              {config.showProductCount && (
                <p className="text-white/80 text-sm">
                  {category._count.products} {category._count.products === 1 ? 'product' : 'products'}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
