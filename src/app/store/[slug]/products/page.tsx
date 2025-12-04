import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { ProductFilters } from "../components/product-filters";
import { ProductGrid } from "../components/product-grid";
import { EmptyState } from "../components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Generate pagination page numbers with ellipsis
 */
function generatePaginationPages(currentPage: number, totalPages: number): (number | string)[] {
  const windowSize = 5;
  const pages: (number | string)[] = [];
  
  if (totalPages <= windowSize + 2) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    const halfWindow = Math.floor(windowSize / 2);
    let start = Math.max(2, currentPage - halfWindow);
    let end = Math.min(totalPages - 1, start + windowSize - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < windowSize) {
      start = Math.max(2, end - windowSize + 1);
    }
    
    // Always show first page
    pages.push(1);
    
    // Add ellipsis if needed
    if (start > 2) {
      pages.push("...");
    }
    
    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if needed
    if (end < totalPages - 1) {
      pages.push("...");
    }
    
    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
  }
  
  return pages;
}

interface StoreProductsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: "Products",
};

/**
 * Modern product listing page with advanced filters and sorting
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">All Products</h1>
          <p className="text-muted-foreground">
            Discover our complete collection
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-72 shrink-0">
            <div className="sticky top-24">
              <ProductFilters
                categories={categories}
                brands={brands}
                storeSlug={store.slug}
              />
            </div>
          </div>

          {/* Mobile Filters - Collapsible */}
          <div className="lg:hidden">
            <details className="border rounded-lg p-4 mb-6">
              <summary className="font-semibold cursor-pointer flex items-center justify-between">
                Filters & Search
                <Badge variant="secondary">{totalCount} products</Badge>
              </summary>
              <div className="mt-4">
                <ProductFilters
                  categories={categories}
                  brands={brands}
                  storeSlug={store.slug}
                />
              </div>
            </details>
          </div>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {/* Results Header with Sorting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b">
              <div>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{skip + 1}</span> to{" "}
                  <span className="font-medium text-foreground">
                    {Math.min(skip + limit, totalCount)}
                  </span>{" "}
                  of <span className="font-medium text-foreground">{totalCount}</span> products
                </p>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <div className="flex gap-2">
                  <Link href={buildFilterUrl({ sort: "newest" })}>
                    <Button
                      variant={sortBy === "newest" ? "default" : "outline"}
                      size="sm"
                    >
                      Newest
                    </Button>
                  </Link>
                  <Link href={buildFilterUrl({ sort: "price-asc" })}>
                    <Button
                      variant={sortBy === "price-asc" ? "default" : "outline"}
                      size="sm"
                    >
                      Price: Low
                    </Button>
                  </Link>
                  <Link href={buildFilterUrl({ sort: "price-desc" })}>
                    <Button
                      variant={sortBy === "price-desc" ? "default" : "outline"}
                      size="sm"
                    >
                      Price: High
                    </Button>
                  </Link>
                  <Link href={buildFilterUrl({ sort: "name" })}>
                    <Button
                      variant={sortBy === "name" ? "default" : "outline"}
                      size="sm"
                    >
                      Name
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Products */}
            {products.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No products found"
                description={
                  categorySlug || brandSlug || searchQuery
                    ? "Try adjusting your filters or search query."
                    : "Check back soon for new products!"
                }
                actionLabel={
                  categorySlug || brandSlug || searchQuery
                    ? "Clear all filters"
                    : undefined
                }
                actionHref={
                  categorySlug || brandSlug || searchQuery
                    ? `/store/${store.slug}/products`
                    : undefined
                }
              />
            ) : (
              <ProductGrid
                products={products}
                storeSlug={store.slug}
                columns={{ mobile: 1, tablet: 2, desktop: 3 }}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {page > 1 && (
                  <Link href={buildFilterUrl({ page: String(page - 1) })}>
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                  </Link>
                )}

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {generatePaginationPages(page, totalPages).map((pageNum, idx) => {
                    if (pageNum === "...") {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 py-1 text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    
                    return (
                      <Link key={pageNum} href={buildFilterUrl({ page: String(pageNum) })}>
                        <Button
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          className="min-w-10"
                        >
                          {pageNum}
                        </Button>
                      </Link>
                    );
                  })}
                </div>

                {page < totalPages && (
                  <Link href={buildFilterUrl({ page: String(page + 1) })}>
                    <Button variant="outline" size="sm">
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
