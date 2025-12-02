import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

interface StoreProductsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: "Products",
};

/**
 * Store products listing page
 */
export default async function StoreProductsPage({
  params,
  searchParams,
}: StoreProductsPageProps) {
  const { slug } = await params;
  const search = await searchParams;

  // Get store ID from headers (set by middleware) or lookup by slug
  const headersList = await headers();
  const storeId = headersList.get("x-store-id");

  // Get store
  const store = await prisma.store.findFirst({
    where: storeId
      ? { id: storeId, deletedAt: null }
      : { slug, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!store) {
    notFound();
  }

  // Parse pagination and filters from search params with validation
  const pageNum = typeof search.page === "string" ? parseInt(search.page) : 1;
  const page = !isNaN(pageNum) && pageNum > 0 ? pageNum : 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  const categorySlug = typeof search.category === "string" ? search.category : undefined;
  const brandSlug = typeof search.brand === "string" ? search.brand : undefined;
  const sortBy = typeof search.sort === "string" ? search.sort : "newest";
  const searchQuery = typeof search.q === "string" ? search.q : undefined;

  // Build where clause with proper Prisma types
  const whereClause: Prisma.ProductWhereInput = {
    storeId: store.id,
    status: "ACTIVE",
    deletedAt: null,
  };

  if (categorySlug) {
    const category = await prisma.category.findFirst({
      where: { storeId: store.id, slug: categorySlug },
      select: { id: true },
    });
    if (category) {
      whereClause.categoryId = category.id;
    }
  }

  if (brandSlug) {
    const brand = await prisma.brand.findFirst({
      where: { storeId: store.id, slug: brandSlug },
      select: { id: true },
    });
    if (brand) {
      whereClause.brandId = brand.id;
    }
  }

  if (searchQuery) {
    whereClause.OR = [
      { name: { contains: searchQuery } },
      { description: { contains: searchQuery } },
    ];
  }

  // Build order by with proper Prisma type
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sortBy === "price-asc") {
    orderBy = { price: "asc" };
  } else if (sortBy === "price-desc") {
    orderBy = { price: "desc" };
  } else if (sortBy === "name") {
    orderBy = { name: "asc" };
  }

  // Fetch products
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        thumbnailUrl: true,
        images: true,
        category: {
          select: { name: true, slug: true },
        },
      },
    }),
    prisma.product.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Fetch categories and brands for filters
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { storeId: store.id, isPublished: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.brand.findMany({
      where: { storeId: store.id, isPublished: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  // Build filter URL helper
  const buildFilterUrl = (params: Record<string, string | undefined>) => {
    const baseUrl = `/store/${store.slug}/products`;
    const searchParams = new URLSearchParams();
    
    // Preserve existing params
    if (categorySlug && !params.category) searchParams.set("category", categorySlug);
    if (brandSlug && !params.brand) searchParams.set("brand", brandSlug);
    if (searchQuery && !params.q) searchParams.set("q", searchQuery);
    if (sortBy !== "newest" && !params.sort) searchParams.set("sort", sortBy);

    // Add new params
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      } else {
        searchParams.delete(key);
      }
    });

    const query = searchParams.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="md:w-64 shrink-0">
          <h2 className="font-semibold mb-4">Filters</h2>

          {/* Search */}
          <div className="mb-6">
            <label htmlFor="search" className="text-sm font-medium mb-2 block">
              Search
            </label>
            <form action={`/store/${store.slug}/products`} method="get" className="flex flex-col gap-2">
              <input
                type="text"
                id="search"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search products..."
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
              >
                Search
              </button>
            </form>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Category</h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href={buildFilterUrl({ category: undefined })}
                    className={`text-sm ${!categorySlug ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    All Categories
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={buildFilterUrl({ category: cat.slug })}
                      className={`text-sm ${categorySlug === cat.slug ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Brands */}
          {brands.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Brand</h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href={buildFilterUrl({ brand: undefined })}
                    className={`text-sm ${!brandSlug ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    All Brands
                  </Link>
                </li>
                {brands.map((brand) => (
                  <li key={brand.id}>
                    <Link
                      href={buildFilterUrl({ brand: brand.slug })}
                      className={`text-sm ${brandSlug === brand.slug ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {brand.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Products</h1>
              <p className="text-sm text-muted-foreground">
                {totalCount} product{totalCount !== 1 ? "s" : ""} found
              </p>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Sort by:
              </span>
              <div className="flex gap-2">
                <Link
                  href={buildFilterUrl({ sort: "newest" })}
                  className={`text-xs px-2 py-1 rounded-md border ${sortBy === "newest" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                >
                  Newest
                </Link>
                <Link
                  href={buildFilterUrl({ sort: "price-asc" })}
                  className={`text-xs px-2 py-1 rounded-md border ${sortBy === "price-asc" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                >
                  Price ↑
                </Link>
                <Link
                  href={buildFilterUrl({ sort: "price-desc" })}
                  className={`text-xs px-2 py-1 rounded-md border ${sortBy === "price-desc" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                >
                  Price ↓
                </Link>
                <Link
                  href={buildFilterUrl({ sort: "name" })}
                  className={`text-xs px-2 py-1 rounded-md border ${sortBy === "name" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                >
                  Name
                </Link>
              </div>
            </div>
          </div>

          {/* Products */}
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No products found.</p>
              {(categorySlug || brandSlug || searchQuery) && (
                <Link
                  href={`/store/${store.slug}/products`}
                  className="text-primary hover:underline mt-2 inline-block"
                >
                  Clear filters
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const imageUrl = getProductImageUrl(product.thumbnailUrl, product.images);

                return (
                  <Link
                    key={product.id}
                    href={`/store/${store.slug}/products/${product.slug}`}
                    className="group rounded-lg border overflow-hidden hover:border-primary transition-colors"
                  >
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized
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
                    <div className="p-4">
                      {product.category && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {product.category.name}
                        </p>
                      )}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {page > 1 && (
                <Link
                  href={buildFilterUrl({ page: String(page - 1) })}
                  className="px-4 py-2 border rounded-md hover:bg-accent"
                >
                  Previous
                </Link>
              )}
              {/* Show pagination window around current page */}
              {(() => {
                const windowSize = 5;
                const halfWindow = Math.floor(windowSize / 2);
                let start = Math.max(1, page - halfWindow);
                const end = Math.min(totalPages, start + windowSize - 1);
                
                // Adjust start if we're near the end
                if (end - start + 1 < windowSize) {
                  start = Math.max(1, end - windowSize + 1);
                }

                return Array.from({ length: end - start + 1 }, (_, i) => {
                  const pageNum = start + i;
                  return (
                    <Link
                      key={pageNum}
                      href={buildFilterUrl({ page: String(pageNum) })}
                      className={`px-4 py-2 border rounded-md ${
                        page === pageNum ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                });
              })()}
              {page < totalPages && (
                <Link
                  href={buildFilterUrl({ page: String(page + 1) })}
                  className="px-4 py-2 border rounded-md hover:bg-accent"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
