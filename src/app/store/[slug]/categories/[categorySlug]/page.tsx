import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

interface StoreCategoryPageProps {
  params: Promise<{ slug: string; categorySlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Generate dynamic metadata for category page
 */
export async function generateMetadata({
  params,
}: StoreCategoryPageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params;

  const store = await prisma.store.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!store) {
    return { title: "Category Not Found" };
  }

  const category = await prisma.category.findFirst({
    where: {
      storeId: store.id,
      slug: categorySlug,
      isPublished: true,
      deletedAt: null,
    },
    select: { name: true, metaTitle: true, metaDescription: true },
  });

  if (!category) {
    return { title: "Category Not Found" };
  }

  return {
    title: category.metaTitle || category.name,
    description: category.metaDescription || `Shop ${category.name} at ${store.name}`,
  };
}

/**
 * Store category page - displays products in a specific category
 */
export default async function StoreCategoryPage({
  params,
  searchParams,
}: StoreCategoryPageProps) {
  const { slug, categorySlug } = await params;
  const search = await searchParams;

  // Get store ID from headers (set by proxy) or lookup by slug
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

  // Get category with subcategories
  const category = await prisma.category.findFirst({
    where: {
      storeId: store.id,
      slug: categorySlug,
      isPublished: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        where: {
          isPublished: true,
          deletedAt: null,
        },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!category) {
    notFound();
  }

  // Parse pagination and sorting
  const pageNum = typeof search.page === "string" ? parseInt(search.page) : 1;
  const page = !isNaN(pageNum) && pageNum > 0 ? pageNum : 1;
  const limit = 12;
  const skip = (page - 1) * limit;
  const sortBy = typeof search.sort === "string" ? search.sort : "newest";

  // Get all category IDs (including subcategories) for product query
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  // Build where clause
  const whereClause: Prisma.ProductWhereInput = {
    storeId: store.id,
    categoryId: { in: categoryIds },
    status: "ACTIVE",
    deletedAt: null,
  };

  // Build order by
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
      },
    }),
    prisma.product.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Build filter URL helper
  const buildFilterUrl = (params: Record<string, string | undefined>) => {
    const baseUrl = `/store/${store.slug}/categories/${category.slug}`;
    const searchParams = new URLSearchParams();

    if (sortBy !== "newest" && !params.sort) searchParams.set("sort", sortBy);

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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href={`/store/${store.slug}`} className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link
          href={`/store/${store.slug}/categories`}
          className="hover:text-foreground"
        >
          Categories
        </Link>
        {category.parent && (
          <>
            <span>/</span>
            <Link
              href={`/store/${store.slug}/categories/${category.parent.slug}`}
              className="hover:text-foreground"
            >
              {category.parent.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        {category.image && (
          <div className="aspect-4/1 bg-muted rounded-lg overflow-hidden mb-6 relative">
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl font-bold text-white">{category.name}</h1>
              {category.description && (
                <p className="text-white/80 mt-2 max-w-2xl">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        )}
        {!category.image && (
          <>
            <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
            {category.description && (
              <p className="text-muted-foreground max-w-2xl">
                {category.description}
              </p>
            )}
          </>
        )}
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Subcategories</h2>
          <div className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/store/${store.slug}/categories/${child.slug}`}
                className="px-4 py-2 border rounded-full text-sm hover:bg-accent transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {totalCount} product{totalCount !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <div className="flex gap-2">
            <Link
              href={buildFilterUrl({ sort: "newest" })}
              className={`text-xs px-2 py-1 rounded-md border ${
                sortBy === "newest"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Newest
            </Link>
            <Link
              href={buildFilterUrl({ sort: "price-asc" })}
              className={`text-xs px-2 py-1 rounded-md border ${
                sortBy === "price-asc"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Price ↑
            </Link>
            <Link
              href={buildFilterUrl({ sort: "price-desc" })}
              className={`text-xs px-2 py-1 rounded-md border ${
                sortBy === "price-desc"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Price ↓
            </Link>
            <Link
              href={buildFilterUrl({ sort: "name" })}
              className={`text-xs px-2 py-1 rounded-md border ${
                sortBy === "name"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Name
            </Link>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No products found in this category.</p>
          <Link
            href={`/store/${store.slug}/products`}
            className="text-primary hover:underline mt-2 inline-block"
          >
            Browse all products
          </Link>
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
                  {product.compareAtPrice &&
                    product.compareAtPrice > product.price && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Sale
                      </span>
                    )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-bold">${product.price.toFixed(2)}</span>
                    {product.compareAtPrice &&
                      product.compareAtPrice > product.price && (
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
          {(() => {
            const windowSize = 5;
            const halfWindow = Math.floor(windowSize / 2);
            let start = Math.max(1, page - halfWindow);
            const end = Math.min(totalPages, start + windowSize - 1);

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
                    page === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
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
  );
}
