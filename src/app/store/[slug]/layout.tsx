import { headers } from "next/headers";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

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

  // Fetch full store data
  const store = await prisma.store.findFirst({
    where: storeId 
      ? { id: storeId, deletedAt: null }
      : { slug, deletedAt: null },
    include: {
      organization: {
        select: { name: true, image: true },
      },
    },
  });

  if (!store) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Store Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {store.logo && (
                <img
                  src={store.logo}
                  alt={store.name}
                  className="h-10 w-auto"
                />
              )}
              <h1 className="text-2xl font-bold">{store.name}</h1>
            </div>
            <nav className="flex items-center gap-6">
              <Link
                href={`/store/${store.slug}`}
                className="text-sm font-medium hover:text-primary"
              >
                Home
              </Link>
              <Link
                href={`/store/${store.slug}/products`}
                className="text-sm font-medium hover:text-primary"
              >
                Products
              </Link>
              <Link
                href={`/store/${store.slug}/categories`}
                className="text-sm font-medium hover:text-primary"
              >
                Categories
              </Link>
              <Link
                href="/checkout"
                className="text-sm font-medium hover:text-primary"
              >
                Cart
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Store Content */}
      <main className="flex-1">{children}</main>

      {/* Store Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Store Info */}
            <div>
              <h3 className="font-semibold mb-4">{store.name}</h3>
              {store.description && (
                <p className="text-sm text-muted-foreground">
                  {store.description}
                </p>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href={`/store/${store.slug}`} className="hover:text-primary">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href={`/store/${store.slug}/products`} className="hover:text-primary">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href={`/store/${store.slug}/categories`} className="hover:text-primary">
                    Categories
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {store.email && <li>{store.email}</li>}
                {store.phone && <li>{store.phone}</li>}
                {store.address && (
                  <li>
                    {store.address}
                    {store.city && `, ${store.city}`}
                    {store.state && `, ${store.state}`}
                    {store.postalCode && ` ${store.postalCode}`}
                  </li>
                )}
              </ul>
            </div>

            {/* Powered By */}
            <div>
              <h3 className="font-semibold mb-4">Powered By</h3>
              <p className="text-sm text-muted-foreground">
                <Link href="/" className="hover:text-primary">
                  StormCom
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {store.name}. Powered by StormCom.
          </div>
        </div>
      </footer>
    </div>
  );
}
