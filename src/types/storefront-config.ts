/**
 * Storefront Configuration Types
 * 
 * Defines the structure for tenant-configurable storefront layouts
 * Allows each store/tenant to customize hero, categories, products, newsletter sections
 */

export type HeroStyle = 'gradient' | 'image' | 'minimal';
export type GridColumns = 2 | 3 | 4;
export type ProductCount = 8 | 12 | 16;

export interface HeroConfig {
  style: HeroStyle;
  headline?: string;
  subheadline?: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  backgroundImage?: string;
}

export interface CategoriesConfig {
  enabled: boolean;
  maxCount: number;
  columns: GridColumns;
  showProductCount: boolean;
}

export interface FeaturedProductsConfig {
  enabled: boolean;
  count: ProductCount;
  heading: string;
  subheading?: string;
}

export interface NewsletterConfig {
  enabled: boolean;
  headline: string;
  description: string;
  privacyText?: string;
}

export interface TrustBadge {
  icon: string;
  title: string;
  description: string;
}

export interface TrustBadgesConfig {
  enabled: boolean;
  badges: TrustBadge[];
}

export interface HomepageConfig {
  hero: HeroConfig;
  categories: CategoriesConfig;
  featuredProducts: FeaturedProductsConfig;
  newsletter: NewsletterConfig;
  trustBadges: TrustBadgesConfig;
}

export interface StorefrontConfig {
  homepage: HomepageConfig;
}
