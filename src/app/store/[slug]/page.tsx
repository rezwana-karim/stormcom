import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getDefaultStorefrontConfig } from "@/lib/storefront/get-default-config";
import { HeroSection } from "./components/homepage/hero-section";
import { TrustBadges } from "./components/homepage/trust-badges";
import { CategoriesSection } from "./components/homepage/categories-section";
import { FeaturedSection } from "./components/homepage/featured-section";
import { NewsletterSection } from "./components/homepage/newsletter-section";

interface StoreHomePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Refactored Store Homepage
 * Modular design with tenant-configurable sections
 * Sections: Hero, Trust Badges, Categories, Featured Products, Newsletter
 */
export default async function StoreHomePage({ params }: StoreHomePageProps) {
  const { slug } = await params;
  
  // Get store ID from headers (set by middleware) or lookup by slug
  const headersList = await headers();
  const storeId = headersList.get("x-store-id");

  // Get store data
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

  // Get storefront configuration (using defaults for now)
  // TODO: In the future, fetch custom config from database per store
  const config = getDefaultStorefrontConfig(store);

  // Fetch featured products based on config
  const featuredProducts = await prisma.product.findMany({
    where: {
      storeId: store.id,
      isFeatured: true,
      status: "ACTIVE",
      deletedAt: null,
    },
    take: config.homepage.featuredProducts.count,
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

  // Fetch categories based on config
  const categories = await prisma.category.findMany({
    where: {
      storeId: store.id,
      isPublished: true,
      deletedAt: null,
      parentId: null, // Top-level categories only
    },
    take: config.homepage.categories.maxCount,
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
      <HeroSection store={store} config={config.homepage.hero} />

      {/* Trust Badges */}
      <TrustBadges config={config.homepage.trustBadges} />

      {/* Categories Section */}
      <CategoriesSection 
        store={store}
        categories={categories}
        config={config.homepage.categories}
      />

      {/* Featured Products Section */}
      <FeaturedSection 
        store={store}
        products={featuredProducts}
        config={config.homepage.featuredProducts}
      />

      {/* Newsletter Section */}
      <NewsletterSection 
        storeSlug={store.slug}
        config={config.homepage.newsletter}
      />
    </div>
  );
}
