import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface StoreCategoriesPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Categories",
};

/**
 * Store categories listing page
 * Displays all published categories for a store
 */
export default async function StoreCategoriesPage({
  params,
}: StoreCategoriesPageProps) {
  const { slug } = await params;

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

  // Fetch all published categories with product counts
  const categories = await prisma.category.findMany({
    where: {
      storeId: store.id,
      isPublished: true,
      deletedAt: null,
      parentId: null, // Top-level categories only
    },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
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
          image: true,
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
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Categories</h1>
        <p className="text-muted-foreground">
          Browse our collection by category
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No categories available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="space-y-4">
              {/* Main Category Card */}
              <Link
                href={`/store/${store.slug}/categories/${category.slug}`}
                className="group block rounded-lg border overflow-hidden hover:border-primary transition-colors"
              >
                {category.image ? (
                  <div className="aspect-2/1 bg-muted relative overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h2 className="text-white text-xl font-semibold">
                        {category.name}
                      </h2>
                      <p className="text-white/80 text-sm">
                        {category._count.products} product
                        {category._count.products !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-2/1 bg-muted flex items-center justify-center relative">
                    <span className="text-6xl">📦</span>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/60 to-transparent">
                      <h2 className="text-white text-xl font-semibold">
                        {category.name}
                      </h2>
                      <p className="text-white/80 text-sm">
                        {category._count.products} product
                        {category._count.products !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                )}
              </Link>

              {/* Subcategories */}
              {category.children.length > 0 && (
                <div className="pl-4 space-y-2">
                  {category.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/store/${store.slug}/categories/${child.slug}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                    >
                      {child.image ? (
                        <div className="w-10 h-10 rounded overflow-hidden shrink-0">
                          <Image
                            src={child.image}
                            alt={child.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                          <span className="text-lg">📁</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{child.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {child._count.products} product
                          {child._count.products !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
