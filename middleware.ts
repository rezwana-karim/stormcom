import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ============================================================================
// STORE SLUG CACHE (Simple in-memory cache with 10-minute TTL)
// ============================================================================

interface CacheEntry {
  exists: boolean;
  storeId?: string;
  storeName?: string;
  timestamp: number;
}

const storeCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCachedStore(slug: string): CacheEntry | null {
  const entry = storeCache.get(slug);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    storeCache.delete(slug);
    return null;
  }
  return entry;
}

function setCachedStore(slug: string, entry: Omit<CacheEntry, "timestamp">) {
  storeCache.set(slug, { ...entry, timestamp: Date.now() });
}

// ============================================================================
// ROUTE PATTERNS
// ============================================================================

// Admin/protected routes that should NOT go through subdomain routing
const ADMIN_ROUTE_PATTERNS = [
  "/dashboard",
  "/settings",
  "/team",
  "/projects",
  "/products",
  "/api",
  "/login",
  "/signup",
  "/verify-email",
  "/onboarding",
  "/checkout",
  "/_next",
  "/favicon.ico",
];

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/settings",
  "/team",
  "/projects",
  "/products",
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractSubdomain(hostname: string): string | null {
  // Handle localhost with subdomain (e.g., vendor1.localhost:3000)
  if (hostname.includes("localhost")) {
    const parts = hostname.split(".");
    if (parts.length >= 2 && parts[0] !== "localhost" && parts[0] !== "www") {
      return parts[0];
    }
    return null;
  }

  // Handle production domains (e.g., vendor1.stormcom.app)
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Skip www and other non-store subdomains
    if (subdomain !== "www" && subdomain !== "api" && subdomain !== "admin") {
      return subdomain;
    }
  }

  return null;
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTE_PATTERNS.some(
    (pattern) => pathname === pattern || pathname.startsWith(pattern + "/") || pathname.startsWith(pattern)
  );
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (pattern) => pathname === pattern || pathname.startsWith(pattern + "/")
  );
}

// ============================================================================
// STORE VALIDATION (API call to check if store exists)
// ============================================================================

async function validateStore(
  slug: string,
  request: NextRequest
): Promise<CacheEntry> {
  // Check cache first
  const cached = getCachedStore(slug);
  if (cached !== null) {
    return cached;
  }

  try {
    // Make internal API call to validate store
    // In production, this would be an actual API call
    // For now, we'll validate via internal lookup
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/stores/validate?slug=${encodeURIComponent(slug)}`, {
      headers: {
        "x-middleware-request": "true",
      },
    });

    if (response.ok) {
      const data = await response.json();
      const entry: CacheEntry = {
        exists: true,
        storeId: data.storeId,
        storeName: data.storeName,
        timestamp: Date.now(),
      };
      setCachedStore(slug, entry);
      return entry;
    }

    // Store doesn't exist
    const entry: CacheEntry = { exists: false, timestamp: Date.now() };
    setCachedStore(slug, entry);
    return entry;
  } catch {
    // On error, don't cache and assume store doesn't exist
    return { exists: false, timestamp: Date.now() };
  }
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // 1. Handle NextAuth protected routes first
  if (isProtectedRoute(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const signInUrl = new URL("/login", request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    }

    // User is authenticated, continue
    return NextResponse.next();
  }

  // 2. Skip subdomain routing for admin routes
  if (isAdminRoute(pathname)) {
    return NextResponse.next();
  }

  // 3. Extract subdomain
  const subdomain = extractSubdomain(hostname);

  // No subdomain - serve main site
  if (!subdomain) {
    return NextResponse.next();
  }

  // 4. Validate store exists
  const storeEntry = await validateStore(subdomain, request);

  if (!storeEntry.exists) {
    // Store doesn't exist - show 404 page
    // Rewrite to a custom store-not-found page
    const notFoundUrl = request.nextUrl.clone();
    notFoundUrl.pathname = "/store-not-found";
    return NextResponse.rewrite(notFoundUrl);
  }

  // 5. Rewrite to store route and inject store data via headers
  const rewriteUrl = request.nextUrl.clone();
  
  // Rewrite / -> /store/[slug]
  // Rewrite /products -> /store/[slug]/products
  // etc.
  if (pathname === "/" || pathname === "") {
    rewriteUrl.pathname = `/store/${subdomain}`;
  } else {
    rewriteUrl.pathname = `/store/${subdomain}${pathname}`;
  }

  const response = NextResponse.rewrite(rewriteUrl);

  // Inject store data via headers for Server Components
  response.headers.set("x-store-slug", subdomain);
  if (storeEntry.storeId) {
    response.headers.set("x-store-id", storeEntry.storeId);
  }
  if (storeEntry.storeName) {
    response.headers.set("x-store-name", storeEntry.storeName);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (static assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
