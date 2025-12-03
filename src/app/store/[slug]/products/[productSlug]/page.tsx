import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "../../components/breadcrumb";
import { ImageGallery } from "../../components/image-gallery";
import { PriceDisplay } from "../../components/price-display";
import { StockBadge } from "../../components/stock-badge";
import { VariantSelector } from "../../components/variant-selector";
import { AddToCartButton } from "../../components/add-to-cart-button";
import { ProductGrid } from "../../components/product-grid";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, TruckIcon, RefreshCw, ShieldCheck } from "lucide-react";

interface StoreProductPageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

export async function generateMetadata({
  params,
}: StoreProductPageProps): Promise<Metadata> {
  const { slug, productSlug } = await params;

  const store = await prisma.store.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!store) {
    return { title: "Product Not Found" };
  }

  const product = await prisma.product.findFirst({
    where: {
      storeId: store.id,
      slug: productSlug,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      name: true,
      shortDescription: true,
      metaTitle: true,
      metaDescription: true,
      price: true,
    },
  });

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.shortDescription || undefined,
    openGraph: {
      title: product.metaTitle || product.name,
      description: product.metaDescription || product.shortDescription || undefined,
    },
  };
}

export default async function StoreProductPage({ params }: StoreProductPageProps) {
  const { slug, productSlug } = await params;

  const headersList = await headers();
  const storeId = headersList.get("x-store-id");

  const store = await prisma.store.findFirst({
    where: storeId ? { id: storeId, deletedAt: null } : { slug, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!store) {
    notFound();
  }

  const product = await prisma.product.findFirst({
    where: {
      storeId: store.id,
      slug: productSlug,
      status: "ACTIVE",
      deletedAt: null,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      variants: {
        orderBy: { isDefault: "desc" },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Parse images
  const images = (() => {
    try {
      const parsed = JSON.parse(product.images);
      return Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : product.thumbnailUrl
        ? [product.thumbnailUrl]
        : [];
    } catch {
      return product.thumbnailUrl ? [product.thumbnailUrl] : [];
    }
  })();

  // Fetch related products
  const relatedProducts = await prisma.product.findMany({
    where: {
      storeId: store.id,
      status: "ACTIVE",
      deletedAt: null,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 4,
    orderBy: { createdAt: "desc" },
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
  });

  // Breadcrumb items
  const breadcrumbItems: Array<{ label: string; href?: string }> = [
    { label: store.name, href: `/store/${store.slug}` },
    { label: "Products", href: `/store/${store.slug}/products` },
  ];

  if (product.category) {
    breadcrumbItems.push({
      label: product.category.name,
      href: `/store/${store.slug}/categories/${product.category.slug}`,
    });
  }

  breadcrumbItems.push({ label: product.name });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Image Gallery */}
          <div>
            <ImageGallery images={images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Brand */}
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <Badge variant="secondary">{product.category.name}</Badge>
              )}
              {product.brand && (
                <Badge variant="outline">{product.brand.name}</Badge>
              )}
              {product.isFeatured && (
                <Badge className="bg-blue-500">Featured</Badge>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="text-lg text-muted-foreground">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="pb-4 border-b">
              <PriceDisplay
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                size="lg"
              />
            </div>

            {/* Stock */}
            <div>
              <StockBadge
                inventoryQty={product.inventoryQty}
                lowStockThreshold={product.lowStockThreshold}
              />
            </div>

            {/* Variants */}
            {product.variants.length > 0 && (
              <VariantSelector
                variants={product.variants.map((v) => ({
                  id: v.id,
                  name: v.name,
                  sku: v.sku,
                  price: v.price,
                  compareAtPrice: v.compareAtPrice,
                  inventoryQty: v.inventoryQty,
                  options: v.options,
                  isDefault: v.isDefault,
                  image: v.image,
                }))}
              />
            )}

            {/* Add to Cart */}
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                inventoryQty: product.inventoryQty,
                thumbnailUrl: product.thumbnailUrl,
              }}
              storeSlug={store.slug}
            />

            {/* Product Features */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t">
              <div className="flex items-start gap-3">
                <TruckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">
                    On orders over $50
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Easy Returns</p>
                  <p className="text-xs text-muted-foreground">
                    30-day return policy
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Secure Payment</p>
                  <p className="text-xs text-muted-foreground">
                    100% secure checkout
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Quality Guarantee</p>
                  <p className="text-xs text-muted-foreground">
                    Verified products
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mb-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="specs"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Specifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {product.description ? (
                  <div
                    className="text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    No description available for this product.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="specs" className="mt-6">
              <div className="grid gap-3">
                <div className="grid grid-cols-3 gap-4 py-3 border-b">
                  <span className="font-medium">SKU</span>
                  <span className="col-span-2 text-muted-foreground">{product.sku}</span>
                </div>
                {product.barcode && (
                  <div className="grid grid-cols-3 gap-4 py-3 border-b">
                    <span className="font-medium">Barcode</span>
                    <span className="col-span-2 text-muted-foreground">{product.barcode}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="grid grid-cols-3 gap-4 py-3 border-b">
                    <span className="font-medium">Weight</span>
                    <span className="col-span-2 text-muted-foreground">{product.weight} kg</span>
                  </div>
                )}
                {(product.length && product.width && product.height) && (
                  <div className="grid grid-cols-3 gap-4 py-3 border-b">
                    <span className="font-medium">Dimensions</span>
                    <span className="col-span-2 text-muted-foreground">
                      {product.length} × {product.width} × {product.height} cm
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">You May Also Like</h2>
              <p className="text-muted-foreground">
                Similar products from the same category
              </p>
            </div>
            <ProductGrid
              products={relatedProducts}
              storeSlug={store.slug}
              columns={{ mobile: 1, tablet: 2, desktop: 4 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
