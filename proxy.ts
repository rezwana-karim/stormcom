import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Simple in-memory cache with TTL support
 * Used in Proxy (formerly Middleware) where Prisma isn't available
 * Note: In production, consider using a distributed cache like Redis or Vercel KV
 */
class EdgeCache {
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
}

const storeCache = new EdgeCache();
const STORE_CACHE_TTL = 600; // 10 minutes

interface StoreData {
  id: string;
  slug: string;
  name: string;
}

/**
 * Extract subdomain from hostname
 * 
 * @example
 * - vendor1.stormcom.app → vendor1
 * - vendor1.localhost → vendor1
 * - vendor.com → null (custom domain - handled by customDomain lookup)
 * - www.stormcom.app → null (www is ignored)
 */
function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0];

  // Development: vendor1.localhost
  if (host.endsWith(".localhost")) {
    const subdomain = host.replace(".localhost", "");
    return subdomain || null;
  }

  // Production: vendor1.stormcom.app
  const parts = host.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }

  // Custom domain (vendor.com) or root domain (stormcom.app)
  // Return null so the lookup falls through to customDomain check
  return null;
}

/**
 * List of known platform domains
 * Custom domains are any domain not in this list
 */
const PLATFORM_DOMAINS = [
  "localhost",
  "stormcom.app",
  "stormcom.com",
  "vercel.app",
];

/**
 * Static file extensions to skip in subdomain routing
 */
const STATIC_FILE_EXTENSIONS = [
  "js", "css", "png", "jpg", "jpeg", "gif", "svg", "ico",
  "woff", "woff2", "ttf", "eot", "webp", "avif",
  "json", "xml", "txt", "map", "webmanifest", "pdf",
];

/**
 * Check if hostname is a potential custom domain (not a subdomain of platform)
 */
function isCustomDomain(hostname: string): boolean {
  const host = hostname.split(":")[0];
  
  // Not localhost or platform domain
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    PLATFORM_DOMAINS.some((domain) => host === domain || host.endsWith("." + domain))
  ) {
    return false;
  }

  // Anything not matching platform domains is considered a custom domain
  return true;
}

/**
 * Check if the request should skip subdomain routing
 */
function shouldSkipSubdomainRouting(
  subdomain: string | null,
  pathname: string,
  hostname: string
): boolean {
  // If no subdomain and not a custom domain, skip
  if (!subdomain && !isCustomDomain(hostname)) return true;
  if (subdomain === "www") return true;

  // Skip admin/protected routes
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

  // Skip static files using maintainable extension list
  if (pathname.startsWith("/favicon")) return true;
  const extension = pathname.split(".").pop()?.toLowerCase();
  if (extension && STATIC_FILE_EXTENSIONS.includes(extension)) return true;

  // Skip checkout routes
  if (pathname.startsWith("/checkout")) return true;

  // Skip store-not-found page
  if (pathname.startsWith("/store-not-found")) return true;

  return false;
}

/**
 * Fetch store data via API (compatible with Proxy runtime)
 */
async function getStoreBySubdomainOrDomain(
  subdomain: string | null,
  hostname: string,
  baseUrl: string
): Promise<StoreData | null> {
  const cacheKey = `store:${hostname.split(":")[0]}`;

  // Check cache
  const cached = storeCache.get<StoreData>(cacheKey);
  if (cached) return cached;

  try {
    // Build query params
    const params = new URLSearchParams();
    if (subdomain) {
      params.set("subdomain", subdomain);
    }
    params.set("domain", hostname.split(":")[0]);

    // Fetch store from internal API with 1.5 second timeout
    const response = await fetch(
      `${baseUrl}/api/stores/lookup?${params.toString()}`,
      { 
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // Use short timeout for proxy - 1.5 seconds
        signal: AbortSignal.timeout(1500),
      }
    );

    if (!response.ok) {
      return null;
    }

    const store = await response.json() as StoreData;
    
    if (store?.id) {
      storeCache.set(cacheKey, store, STORE_CACHE_TTL);
      return store;
    }

    return null;
  } catch (err) {
    // Don't block on cache/fetch errors - allow request to continue
    console.error("[proxy] Store lookup failed:", err);
    return null;
  }
}

/**
 * Proxy handler for subdomain routing and auth protection
 * 
 * Note: In Next.js 16, Middleware has been renamed to Proxy to better reflect its purpose.
 * The function name is now `proxy` instead of `middleware`.
 * 
 * @see https://nextjs.org/docs/app/getting-started/proxy
 */
export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const pathname = url.pathname;

  // Get subdomain
  const subdomain = extractSubdomain(hostname);

  // Check if we should process subdomain/custom domain routing
  if (!shouldSkipSubdomainRouting(subdomain, pathname, hostname)) {
    // Subdomain or custom domain detected - handle store routing
    const baseUrl = url.origin;
    const store = await getStoreBySubdomainOrDomain(subdomain, hostname, baseUrl);

    if (!store) {
      // Invalid subdomain/domain - redirect to 404 page
      return NextResponse.rewrite(new URL("/store-not-found", request.url));
    }

    // Rewrite to store route with slug
    // vendor1.stormcom.app/products → /store/vendor1/products
    const storePath = pathname === "/" ? "" : pathname;
    const storeUrl = new URL(`/store/${store.slug}${storePath}`, request.url);
    
    // Preserve query parameters
    storeUrl.search = url.search;

    const response = NextResponse.rewrite(storeUrl);
    
    // Pass store data via headers for downstream use
    response.headers.set("x-store-id", store.id);
    response.headers.set("x-store-slug", store.slug);
    response.headers.set("x-store-name", store.name);

    return response;
  }

  // Check if route needs authentication
  const protectedPaths = [
    "/dashboard",
    "/settings",
    "/team",
    "/projects",
    "/products",
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath) {
    // Check for valid session token
    const token = await getToken({ req: request });

    if (!token) {
      // Redirect to login with callback URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected routes (NextAuth)
    "/dashboard/:path*",
    "/settings/:path*",
    "/team/:path*",
    "/projects/:path*",
    "/products/:path*",
    // All other routes for subdomain handling (exclude static files and API)
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)",
  ],
};
