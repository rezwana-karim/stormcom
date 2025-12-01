import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";

interface StoreProductPageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

/**
 * Generate dynamic metadata for product page
 */
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
      thumbnailUrl: true,
      images: true,
    },
  });

  if (!product) {
    return { title: "Product Not Found" };
  }

  const imageUrl = getProductImageUrl(product.thumbnailUrl, product.images);

  return {
    title: product.metaTitle || product.name,
    description:
      product.metaDescription ||
      product.shortDescription ||
      `Buy ${product.name} at ${store.name}`,
    openGraph: imageUrl
      ? {
          images: [{ url: imageUrl }],
        }
      : undefined,
  };
}

/**
 * Store product detail page
 */
export default async function StoreProductPage({
  params,
}: StoreProductPageProps) {
  const { slug, productSlug } = await params;

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
      currency: true,
    },
  });

  if (!store) {
    notFound();
  }

  // Get product with all details
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
        where: {
          inventoryQty: { gt: 0 },
        },
        orderBy: { isDefault: "desc" },
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          compareAtPrice: true,
          inventoryQty: true,
          image: true,
          options: true,
          isDefault: true,
        },
      },
      reviews: {
        where: {
          isApproved: true,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          createdAt: true,
          customer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Parse product images
  let images: string[] = [];
  try {
    images = JSON.parse(product.images) as string[];
  } catch {
    // images is not valid JSON
  }

  // Add thumbnail to images if not already included
  if (product.thumbnailUrl && !images.includes(product.thumbnailUrl)) {
    images = [product.thumbnailUrl, ...images];
  }

  // Calculate average rating
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) /
        product.reviews.length
      : 0;

  // Check stock status
  const isInStock = product.inventoryQty > 0 || !product.trackInventory;
  const isLowStock =
    product.trackInventory && product.inventoryQty <= product.lowStockThreshold;

  // Fetch related products
  const relatedProducts = await prisma.product.findMany({
    where: {
      storeId: store.id,
      categoryId: product.category?.id,
      status: "ACTIVE",
      deletedAt: null,
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
    },
  });

  const currencySymbol = store.currency === "USD" ? "$" : store.currency;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href={`/store/${store.slug}`} className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link
          href={`/store/${store.slug}/products`}
          className="hover:text-foreground"
        >
          Products
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              href={`/store/${store.slug}/categories/${product.category.slug}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
            {images.length > 0 ? (
              <Image
                src={images[0]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl">🛍️</span>
              </div>
            )}
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-sm font-medium">
                  Sale
                </span>
              )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square bg-muted rounded overflow-hidden relative border-2 border-transparent hover:border-primary transition-colors cursor-pointer"
                >
                  <Image
                    src={img}
                    alt={`${product.name} - Image ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Brand */}
          {product.brand && (
            <Link
              href={`/store/${store.slug}/products?brand=${product.brand.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {product.brand.name}
            </Link>
          )}

          {/* Name */}
          <h1 className="text-3xl font-bold">{product.name}</h1>

          {/* Rating */}
          {product.reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-lg ${
                      star <= Math.round(avgRating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.reviews.length} review
                {product.reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">
              {currencySymbol}
              {product.price.toFixed(2)}
            </span>
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    {currencySymbol}
                    {product.compareAtPrice.toFixed(2)}
                  </span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium">
                    {Math.round(
                      ((product.compareAtPrice - product.price) /
                        product.compareAtPrice) *
                        100
                    )}
                    % OFF
                  </span>
                </>
              )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-muted-foreground">{product.shortDescription}</p>
          )}

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {isInStock ? (
              <>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-sm text-green-600">
                  {isLowStock
                    ? `Only ${product.inventoryQty} left in stock`
                    : "In Stock"}
                </span>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-sm text-red-600">Out of Stock</span>
              </>
            )}
          </div>

          {/* SKU */}
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="space-y-3">
              <p className="font-medium">Options:</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    className={`px-4 py-2 border rounded-md text-sm transition-colors hover:border-primary ${
                      variant.isDefault ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    {variant.name}
                    {variant.price && variant.price !== product.price && (
                      <span className="ml-2 text-muted-foreground">
                        {currencySymbol}
                        {variant.price.toFixed(2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <div className="flex items-center gap-4">
            <AddToCartButton
              productId={product.id}
              productName={product.name}
              disabled={!isInStock}
              storeSlug={store.slug}
            />
          </div>

          {/* Category */}
          {product.category && (
            <div className="pt-4 border-t">
              <span className="text-sm text-muted-foreground">Category: </span>
              <Link
                href={`/store/${store.slug}/categories/${product.category.slug}`}
                className="text-sm text-primary hover:underline"
              >
                {product.category.name}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Full Description */}
      {product.description && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Description</h2>
          <div className="prose max-w-none">
            <p className="text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        </div>
      )}

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <div className="mb-12" id="reviews">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
                            star <= review.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {review.title && (
                      <span className="font-medium">{review.title}</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-muted-foreground">{review.comment}</p>
                {review.customer && (
                  <p className="text-sm text-muted-foreground mt-2">
                    — {review.customer.firstName} {review.customer.lastName?.[0]}.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((related) => {
              const relatedImageUrl = getProductImageUrl(
                related.thumbnailUrl,
                related.images
              );

              return (
                <Link
                  key={related.id}
                  href={`/store/${store.slug}/products/${related.slug}`}
                  className="group rounded-lg border overflow-hidden hover:border-primary transition-colors"
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {relatedImageUrl ? (
                      <Image
                        src={relatedImageUrl}
                        alt={related.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">🛍️</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {related.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-bold">
                        {currencySymbol}
                        {related.price.toFixed(2)}
                      </span>
                      {related.compareAtPrice &&
                        related.compareAtPrice > related.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {currencySymbol}
                            {related.compareAtPrice.toFixed(2)}
                          </span>
                        )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
