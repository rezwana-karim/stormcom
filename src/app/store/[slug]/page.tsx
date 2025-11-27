import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

interface StoreHomePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Store homepage - displays featured products and store info
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
  const products = await prisma.product.findMany({
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
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-12 mb-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
        <h1 className="text-4xl font-bold mb-4">Welcome to {store.name}</h1>
        {store.description && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {store.description}
          </p>
        )}
        <div className="mt-8">
          <Link
            href={`/store/${store.slug}/products`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Shop All Products
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/store/${store.slug}/categories/${category.slug}`}
                className="group relative rounded-lg overflow-hidden border hover:border-primary transition-colors"
              >
                {category.image ? (
                  <div className="aspect-square bg-muted">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Link
            href={`/store/${store.slug}/products`}
            className="text-sm text-primary hover:underline"
          >
            View All →
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No featured products yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const imageUrl = getProductImageUrl(product.thumbnailUrl, product.images);

              return (
                <Link
                  key={product.id}
                  href={`/store/${store.slug}/products/${product.slug}`}
                  className="group rounded-lg border overflow-hidden hover:border-primary transition-colors"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">🛍️</span>
                      </div>
                    )}
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Sale
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-bold">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
