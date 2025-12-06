/**
 * Default Storefront Configuration Generator
 * 
 * Provides sensible defaults for stores without custom configuration
 * Uses store name and description dynamically
 */

import type { StorefrontConfig } from "@/types/storefront-config";

interface StoreData {
  name: string;
  slug: string;
  description?: string | null;
}

/**
 * Generate default storefront configuration for a store
 * @param store - Store data including name and description
 * @returns Complete storefront configuration with defaults
 */
export function getDefaultStorefrontConfig(store: StoreData): StorefrontConfig {
  return {
    homepage: {
      hero: {
        style: 'gradient',
        headline: `Discover Amazing Products Today`,
        subheadline: store.description || `Welcome to ${store.name}`,
        primaryCta: {
          text: 'Shop All Products',
          href: `/store/${store.slug}/products`,
        },
        secondaryCta: {
          text: 'Browse Categories',
          href: `/store/${store.slug}/categories`,
        },
      },
      categories: {
        enabled: true,
        maxCount: 8,
        columns: 4,
        showProductCount: true,
      },
      featuredProducts: {
        enabled: true,
        count: 12,
        heading: 'Featured Products',
        subheading: 'Hand-picked favorites just for you',
      },
      newsletter: {
        enabled: true,
        headline: 'Stay Updated',
        description: 'Subscribe to our newsletter for exclusive offers, new arrivals, and updates.',
        privacyText: 'We respect your privacy. Unsubscribe at any time.',
      },
      trustBadges: {
        enabled: true,
        badges: [
          {
            icon: 'truck',
            title: 'Free Shipping',
            description: 'On orders over $50',
          },
          {
            icon: 'shield',
            title: 'Secure Payment',
            description: '100% secure transactions',
          },
          {
            icon: 'star',
            title: 'Quality Guarantee',
            description: 'Verified products only',
          },
        ],
      },
    },
  };
}
