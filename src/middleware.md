import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Next.js 16 Proxy (formerly Middleware)
 * 
 * Handles:
 * - Dynamic subdomain routing for multi-tenant stores
 * - Authentication protection for admin routes
 * - Security headers
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

/**
 * Simple in-memory cache with TTL support
 * Used in Proxy where Prisma isn't available (Edge Runtime compatible)
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
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // HSTS in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

/**
 * Proxy handler for subdomain routing and auth protection
 * 
 * Next.js 16: middleware.ts is deprecated, renamed to proxy.ts
 * Function name changed from middleware() to proxy()
 * 
 * Subdomain Routing:
 * - For production: Works automatically with proper DNS (demo.stormcom.app -> store)
 * - For local development: Requires hosts file setup (127.0.0.1 demo.localhost)
 * - Direct URL access: Always works via /store/[slug] routes
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const pathname = url.pathname;
  
  // Log every request to verify proxy is running
  console.log("============================================");
  console.log("[proxy] Request received");
  console.log("[proxy] Hostname:", hostname);
  console.log("[proxy] Pathname:", pathname);
  console.log("============================================");
  
  // Construct the proper base URL using the Host header
  // This is necessary because url.origin may not reflect the actual host in some scenarios
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${hostname}`;

  // Get subdomain
  const subdomain = extractSubdomain(hostname);
  
  // For internal API calls, we need to use the main host without subdomain
  // e.g., demo.localhost:3000 → localhost:3000
  // e.g., demo.stormcom.app → stormcom.app
  let apiBaseUrl = baseUrl;
  if (subdomain) {
    // Extract port if present
    const [hostWithoutPort, port] = hostname.split(":");
    // Remove the subdomain prefix from the hostname
    const mainHost = hostWithoutPort.replace(`${subdomain}.`, "");
    apiBaseUrl = port ? `${protocol}://${mainHost}:${port}` : `${protocol}://${mainHost}`;
  }

  // Check if we should process subdomain/custom domain routing
  if (!shouldSkipSubdomainRouting(subdomain, pathname, hostname)) {
    // Subdomain or custom domain detected - handle store routing
    console.log("[proxy] Looking up store with apiBaseUrl:", apiBaseUrl);
    const store = await getStoreBySubdomainOrDomain(subdomain, hostname, apiBaseUrl);

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
    console.log("[proxy] Rewriting to:", storeUrl.pathname);

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

  // Apply security headers and return
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
