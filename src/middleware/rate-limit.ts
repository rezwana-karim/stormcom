/**
 * Rate Limiting Middleware
 * 
 * Wrapper function to add rate limiting to Next.js API routes.
 * Automatically extracts user info and enforces role-based limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserContext } from '@/lib/auth-helpers';
import { 
  checkRateLimit, 
  getRateLimitIdentifier, 
  normalizeEndpoint,
  getRateLimitForRole 
} from '@/lib/rate-limiter';

export interface RateLimitConfig {
  /**
   * Custom rate limit override (bypasses role-based limits)
   */
  maxRequests?: number;
  windowMs?: number;
  
  /**
   * Skip rate limiting for certain conditions
   */
  skip?: (request: NextRequest) => Promise<boolean> | boolean;
  
  /**
   * Custom identifier function
   */
  getIdentifier?: (request: NextRequest) => Promise<string> | string;
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 * 
 * @example
 * export const GET = withRateLimit(async (request) => {
 *   // Your handler logic
 *   return NextResponse.json({ data: 'success' });
 * });
 */
export function withRateLimit<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Check if rate limiting should be skipped
      if (config?.skip && await config.skip(request)) {
        return handler(request, ...args);
      }

      // Get user context and session
      const session = await getServerSession(authOptions);
      const context = session?.user ? await getUserContext() : null;
      
      // Determine role
      const role = context?.isSuperAdmin 
        ? 'SUPER_ADMIN' 
        : (context?.storeRole || context?.organizationRole);

      // Get identifier (userId or IP)
      let identifier: string;
      if (config?.getIdentifier) {
        identifier = await config.getIdentifier(request);
      } else {
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown';
        identifier = getRateLimitIdentifier(context?.userId, ipAddress);
      }

      // Normalize endpoint
      const endpoint = normalizeEndpoint(request.nextUrl.pathname);

      // Check rate limit
      const rateLimitResult = await checkRateLimit(identifier, endpoint, role);

      // Add rate limit headers
      const headers = {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': Math.floor(rateLimitResult.resetAt.getTime() / 1000).toString(),
      };

      // If rate limit exceeded, return 429
      if (!rateLimitResult.allowed) {
        const retryAfter = Math.ceil(
          (rateLimitResult.resetAt.getTime() - Date.now()) / 1000
        );

        return NextResponse.json(
          {
            error: 'Too many requests',
            message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
            retryAfter,
            limit: rateLimitResult.limit,
            remaining: 0,
            resetAt: rateLimitResult.resetAt.toISOString(),
          },
          {
            status: 429,
            headers: {
              ...headers,
              'Retry-After': retryAfter.toString(),
            },
          }
        );
      }

      // Execute handler with rate limit headers
      const response = await handler(request, ...args);
      
      // Add rate limit headers to successful response
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      console.error('Rate limiting middleware error:', error);
      // On error, allow request (fail open)
      return handler(request, ...args);
    }
  };
}

/**
 * Simple rate limiter for specific endpoints (without role-based logic)
 */
export async function rateLimitCheck(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 60000
): Promise<{
  allowed: boolean;
  headers: Record<string, string>;
  retryAfter?: number;
}> {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const identifier = getRateLimitIdentifier(undefined, ipAddress);
  const endpoint = normalizeEndpoint(request.nextUrl.pathname);

  const result = await checkRateLimit(identifier, endpoint);

  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(result.resetAt.getTime() / 1000).toString(),
  };

  const retryAfter = !result.allowed
    ? Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
    : undefined;

  return {
    allowed: result.allowed,
    headers,
    retryAfter,
  };
}

/**
 * Get rate limit info for response headers
 */
export async function getRateLimitHeaders(
  request: NextRequest
): Promise<Record<string, string>> {
  const session = await getServerSession(authOptions);
  const context = session?.user ? await getUserContext() : null;
  
  const role = context?.isSuperAdmin 
    ? 'SUPER_ADMIN' 
    : (context?.storeRole || context?.organizationRole);

  const limits = getRateLimitForRole(role);

  return {
    'X-RateLimit-Limit': limits.maxRequests.toString(),
    'X-RateLimit-Window': limits.windowMs.toString(),
  };
}
