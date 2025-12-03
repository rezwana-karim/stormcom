import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductGrid } from "./components/product-grid";
import { ArrowRight, ShoppingBag, Star, TruckIcon, Shield } from "lucide-react";

interface StoreHomePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Modern store homepage with hero, categories, and featured products
 * Responsive design with gradient backgrounds and trust badges
 */
export default async function StoreHomePage({ params }: StoreHomePageProps) {
  const { slug } = await params;
  
  // Get store ID from headers (set by middleware) or lookup by slug
  const headersList = await headers();
  const storeId = headersList.get("x-store-id");

  // Get store and featured products
  const store = await prisma.store.findFirst({
    where: storeId 
      ? { id: storeId, deletedAt: null }
      : { slug, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
  });

  if (!store) {
    notFound();
  }

  // Fetch featured products
  const featuredProducts = await prisma.product.findMany({
    where: {
      storeId: store.id,
      isFeatured: true,
      status: "ACTIVE",
      deletedAt: null,
    },
    take: 12,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      thumbnailUrl: true,
      images: true,
      isFeatured: true,
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  // Fetch categories for navigation
  const categories = await prisma.category.findMany({
    where: {
      storeId: store.id,
      isPublished: true,
      deletedAt: null,
      parentId: null, // Top-level categories only
    },
    take: 8,
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      description: true,
      _count: {
        select: {
          products: {
            where: {
              status: "ACTIVE",
              deletedAt: null,
            },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:40px_40px]" />
        <div className="relative container mx-auto px-4 py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="text-sm">
              Welcome to {store.name}
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Discover Amazing
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}Products{" "}
              </span>
              Today
            </h1>
            
            {store.description && (
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                {store.description}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base">
                <Link href={`/store/${store.slug}/products`}>
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Shop All Products
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base">
                <Link href={`/store/${store.slug}/categories`}>
                  Browse Categories
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <TruckIcon className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Free Shipping</h3>
              <p className="text-sm text-muted-foreground">On orders over $50</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Secure Payment</h3>
              <p className="text-sm text-muted-foreground">100% secure transactions</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Star className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Quality Guarantee</h3>
              <p className="text-sm text-muted-foreground">Verified products only</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-16">
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
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/store/${store.slug}/categories/${category.slug}`}
                className="group relative rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-300 hover:shadow-xl"
              >
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
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <span className="text-5xl opacity-30">📦</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg mb-1">
                    {category.name}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {category._count.products} {category._count.products === 1 ? 'product' : 'products'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
            <p className="text-muted-foreground">
              Hand-picked favorites just for you
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/store/${store.slug}/products`}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {featuredProducts.length === 0 ? (
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
            products={featuredProducts}
            storeSlug={store.slug}
            columns={{ mobile: 1, tablet: 2, desktop: 4 }}
          />
        )}
      </section>
    </div>
  );
}
