/**
 * Subdomain routing utilities for multi-tenant store routing
 * Handles subdomain extraction, custom domain lookup, and store data caching
 * 
 * Note: These utilities are used by the Proxy (proxy.ts) and server-side code.
 * In Next.js 16, Middleware has been renamed to Proxy.
 * @see https://nextjs.org/docs/app/getting-started/proxy
 */

import prisma from "@/lib/prisma";

/**
 * Simple in-memory cache with TTL support
 * In production, consider using Redis for distributed caching
 */
class SimpleCache {
  private cache = new Map<string, { data: unknown; expires: number }>();

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton cache instance for store data (10-minute TTL)
const storeCache = new SimpleCache();
const STORE_CACHE_TTL = 600; // 10 minutes in seconds

/**
 * Store data returned from cache/database lookup
 */
export interface StoreData {
  id: string;
  slug: string;
  name: string;
  subdomain: string | null;
  customDomain: string | null;
  organizationId: string;
}

/**
 * Extract subdomain from hostname
 * 
 * @example
 * - vendor1.stormcom.app → vendor1
 * - vendor1.localhost → vendor1
 * - vendor.com → null (custom domain - handled by customDomain lookup)
 * - www.stormcom.app → null (www is ignored)
 * - stormcom.app → null (root domain)
 */
export function extractSubdomain(hostname: string): string | null {
  // Remove port if present (e.g., localhost:3000)
  const host = hostname.split(":")[0];

  // Development: vendor1.localhost
  if (host.endsWith(".localhost")) {
    const subdomain = host.replace(".localhost", "");
    return subdomain || null;
  }

  // Production: vendor1.stormcom.app or vendor1.example.com
  const parts = host.split(".");
  
  if (parts.length >= 3) {
    // vendor1.stormcom.app → vendor1
    // vendor1.staging.stormcom.app → vendor1
    return parts[0];
  }

  // Custom domain (vendor.com) or root domain (stormcom.app)
  // These should be looked up by customDomain, not subdomain
  // Return null so the lookup falls through to customDomain check
  return null;
}

/**
 * Check if the request should skip subdomain routing logic
 */
export function shouldSkipSubdomainRouting(
  subdomain: string | null,
  pathname: string
): boolean {
  // Skip if no subdomain detected
  if (!subdomain) return true;

  // Skip www subdomain (treat as root domain)
  if (subdomain === "www") return true;

  // Skip admin routes
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/settings")) return true;
  if (pathname.startsWith("/team")) return true;
  if (pathname.startsWith("/projects")) return true;
  if (pathname.startsWith("/products")) return true;
  if (pathname.startsWith("/onboarding")) return true;

  // Skip API routes
  if (pathname.startsWith("/api")) return true;

  // Skip auth routes
  if (pathname.startsWith("/login")) return true;
  if (pathname.startsWith("/signup")) return true;
  if (pathname.startsWith("/verify-email")) return true;

  // Skip Next.js internal routes
  if (pathname.startsWith("/_next")) return true;

  // Skip static files
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.includes(".")) return true; // Files with extensions

  // Skip checkout routes (should be accessible from any store)
  if (pathname.startsWith("/checkout")) return true;

  return false;
}

/**
 * Get store by subdomain or custom domain with caching
 * 
 * @param subdomain - Extracted subdomain from hostname
 * @param hostname - Full hostname for custom domain lookup
 * @returns Store data or null if not found
 */
export async function getStoreBySubdomainOrDomain(
  subdomain: string,
  hostname: string
): Promise<StoreData | null> {
  // Generate cache key based on hostname (includes custom domain case)
  const cacheKey = `store:${hostname.split(":")[0]}`;

  // Check cache first
  const cached = storeCache.get<StoreData>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Query database for store
    const store = await prisma.store.findFirst({
      where: {
        OR: [
          { subdomain: subdomain },
          { customDomain: hostname.split(":")[0] },
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        subdomain: true,
        customDomain: true,
        organizationId: true,
      },
    });

    if (store) {
      // Cache the result
      storeCache.set(cacheKey, store, STORE_CACHE_TTL);
    }

    return store;
  } catch (error) {
    console.error("[subdomain] Error fetching store:", error);
    return null;
  }
}

/**
 * Invalidate store cache for a specific hostname
 * Call this when store subdomain/domain settings are updated
 */
export function invalidateStoreCache(hostname: string): void {
  const cacheKey = `store:${hostname.split(":")[0]}`;
  storeCache.delete(cacheKey);
}

/**
 * Clear all store cache entries
 * Call this during deployments or when bulk updates occur
 */
export function clearStoreCache(): void {
  storeCache.clear();
}
