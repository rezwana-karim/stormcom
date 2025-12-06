/**
 * Shared types for homepage components
 * Used across hero, categories, featured, and newsletter sections
 */

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  _count: {
    products: number;
  };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  thumbnailUrl?: string | null;
  images: string;
  isFeatured?: boolean;
  category?: {
    name: string;
    slug: string;
  } | null;
}
