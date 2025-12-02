import { headers } from "next/headers";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import { StoreHeader } from "@/components/storefront/store-header";
import { StoreFooter } from "@/components/storefront/store-footer";

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Generate dynamic metadata for store pages
 */
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  
  // Try to get store info from headers first (set by middleware)
  const headersList = await headers();
  const storeName = headersList.get("x-store-name");

  if (storeName) {
    return {
      title: {
        default: storeName,
        template: `%s | ${storeName}`,
      },
      description: `Shop at ${storeName} - Powered by StormCom`,
    };
  }

  // Fallback: fetch from database
  const store = await prisma.store.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!store) {
    return {
      title: "Store Not Found",
    };
  }

  return {
    title: {
      default: store.name,
      template: `%s | ${store.name}`,
    },
    description: store.description || `Shop at ${store.name} - Powered by StormCom`,
  };
}

/**
 * Store layout wrapper
 * Provides store header, footer, and context for all store pages
 */
export default async function StoreLayout({
  children,
  params,
}: StoreLayoutProps) {
  const { slug } = await params;
  
  // Get store data from headers (set by middleware) or fetch directly
  const headersList = await headers();
  const storeId = headersList.get("x-store-id");

  // Fetch full store data with categories for navigation
  const store = await prisma.store.findFirst({
    where: storeId 
      ? { id: storeId, deletedAt: null }
      : { slug, deletedAt: null },
    include: {
      organization: {
        select: { name: true, image: true },
      },
      categories: {
        where: { isPublished: true, deletedAt: null, parentId: null },
        orderBy: { sortOrder: "asc" },
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
        },
      },
    },
  });

  if (!store) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Store Header with Navigation Menu */}
      <StoreHeader
        store={{
          name: store.name,
          slug: store.slug,
          logo: store.logo,
          description: store.description,
        }}
        categories={store.categories}
      />

      {/* Store Content */}
      <main className="flex-1">{children}</main>

      {/* Store Footer */}
      <StoreFooter
        store={{
          name: store.name,
          slug: store.slug,
          description: store.description,
          email: store.email,
          phone: store.phone,
          address: store.address,
          city: store.city,
          state: store.state,
          postalCode: store.postalCode,
          website: store.website,
        }}
      />
    </div>
  );
}
