import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "../../components/breadcrumb";
import { ProductGrid } from "../../components/product-grid";
import { EmptyState } from "../../components/empty-state";

interface CategoryPageProps {
  params: Promise<{ slug: string; categorySlug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params;

  const store = await prisma.store.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!store) return { title: "Category Not Found" };

  const category = await prisma.category.findFirst({
    where: {
      storeId: store.id,
      slug: categorySlug,
      isPublished: true,
      deletedAt: null,
    },
    select: {
      name: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
    },
  });

  if (!category) return { title: "Category Not Found" };

  return {
    title: category.metaTitle || category.name,
    description: category.metaDescription || category.description || undefined,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug, categorySlug } = await params;

  const headersList = await headers();
  const storeId = headersList.get("x-store-id");

  const store = await prisma.store.findFirst({
    where: storeId ? { id: storeId, deletedAt: null } : { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });

  if (!store) notFound();

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
    },
  });

  if (!category) notFound();

  // Fetch products in this category
  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
      categoryId: category.id,
      status: "ACTIVE",
      deletedAt: null,
    },
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
        select: { name: true, slug: true },
      },
    },
  });

  const breadcrumbItems = [
    { label: store.name, href: `/store/${store.slug}` },
    { label: "Categories", href: `/store/${store.slug}/categories` },
    { label: category.name },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-lg text-muted-foreground max-w-3xl">{category.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {products.length} {products.length === 1 ? 'product' : 'products'} in this category
          </p>
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No products in this category"
            description="Check back soon for new products!"
            actionLabel="Browse All Products"
            actionHref={`/store/${store.slug}/products`}
          />
        ) : (
          <ProductGrid
            products={products}
            storeSlug={store.slug}
            columns={{ mobile: 1, tablet: 2, desktop: 4 }}
          />
        )}
      </div>
    </div>
  );
}
