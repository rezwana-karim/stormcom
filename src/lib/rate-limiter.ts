/**
 * Rate Limiter - Role-based API rate limiting
 * 
 * Implements sliding window rate limiting with different limits per role.
 * Prevents API abuse while allowing legitimate usage.
 */

import { prisma } from '@/lib/prisma';
import { Role, Prisma } from '@prisma/client';
import { logRateLimitHit } from './audit-logger';

/**
 * Rate limit configuration per role
 * Format: { maxRequests: number, windowMs: number }
 */
export const RATE_LIMITS: Record<Role | 'ANONYMOUS', { maxRequests: number; windowMs: number }> = {
  // Platform level - highest limits
  SUPER_ADMIN: {
    maxRequests: 1000,  // 1000 requests
    windowMs: 60000,    // per minute
  },

  // Organization level - high limits
  OWNER: {
    maxRequests: 500,
    windowMs: 60000,
  },
  ADMIN: {
    maxRequests: 500,
    windowMs: 60000,
  },
  MEMBER: {
    maxRequests: 200,
    windowMs: 60000,
  },
  VIEWER: {
    maxRequests: 100,
    windowMs: 60000,
  },

  // Store level - moderate limits
  STORE_ADMIN: {
    maxRequests: 300,
    windowMs: 60000,
  },
  SALES_MANAGER: {
    maxRequests: 250,
    windowMs: 60000,
  },
  INVENTORY_MANAGER: {
    maxRequests: 250,
    windowMs: 60000,
  },
  CUSTOMER_SERVICE: {
    maxRequests: 200,
    windowMs: 60000,
  },
  CONTENT_MANAGER: {
    maxRequests: 200,
    windowMs: 60000,
  },
  MARKETING_MANAGER: {
    maxRequests: 150,
    windowMs: 60000,
  },
  DELIVERY_BOY: {
    maxRequests: 100,
    windowMs: 60000,
  },

  // Customer level - lower limits
  CUSTOMER: {
    maxRequests: 100,
    windowMs: 60000,
  },

  // Anonymous - strictest limits
  ANONYMOUS: {
    maxRequests: 50,
    windowMs: 60000,
  },
};

/**
 * Get rate limit for a role
 */
export function getRateLimitForRole(role?: Role | string): { maxRequests: number; windowMs: number } {
  if (!role) return RATE_LIMITS.ANONYMOUS;
  return RATE_LIMITS[role as Role] || RATE_LIMITS.ANONYMOUS;
}

/**
 * Check if request should be rate limited
 * Returns { allowed: boolean, remaining: number, resetAt: Date }
 */
export async function checkRateLimit(
  identifier: string,  // userId or IP address
  endpoint: string,    // API endpoint pattern
  role?: Role | string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}> {
  const limits = getRateLimitForRole(role);
  const now = new Date();
  const windowStart = new Date(now.getTime() - limits.windowMs);

  try {
    // Clean up old rate limit records (older than window)
    await prisma.rateLimit.deleteMany({
      where: {
        windowStart: {
          lt: windowStart,
        },
      },
    });

    // Get or create rate limit record
    const existingRecord = await prisma.rateLimit.findFirst({
      where: {
        identifier,
        endpoint,
        windowStart: {
          gte: windowStart,
        },
      },
      orderBy: {
        windowStart: 'desc',
      },
    });

    let requestCount: number;
    let recordWindowStart: Date;

    if (existingRecord) {
      // Update existing record
      requestCount = existingRecord.requestCount + 1;
      recordWindowStart = existingRecord.windowStart;

      await prisma.rateLimit.update({
        where: { id: existingRecord.id },
        data: {
          requestCount,
          lastRequest: now,
        },
      });
    } else {
      // Create new record
      requestCount = 1;
      recordWindowStart = now;

      await prisma.rateLimit.create({
        data: {
          identifier,
          endpoint,
          role: role || 'ANONYMOUS',
          requestCount,
          windowStart: now,
          lastRequest: now,
        },
      });
    }

    const allowed = requestCount <= limits.maxRequests;
    const remaining = Math.max(0, limits.maxRequests - requestCount);
    const resetAt = new Date(recordWindowStart.getTime() + limits.windowMs);

    // Log rate limit hit
    if (!allowed) {
      await logRateLimitHit(identifier, endpoint, role);
    }

    return {
      allowed,
      remaining,
      resetAt,
      limit: limits.maxRequests,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow request (fail open for availability)
    return {
      allowed: true,
      remaining: limits.maxRequests,
      resetAt: new Date(now.getTime() + limits.windowMs),
      limit: limits.maxRequests,
    };
  }
}

/**
 * Get identifier for rate limiting (userId or IP)
 */
export function getRateLimitIdentifier(userId?: string, ipAddress?: string): string {
  if (userId) return `user:${userId}`;
  if (ipAddress) return `ip:${ipAddress}`;
  return 'ip:unknown';
}

/**
 * Get endpoint pattern for rate limiting
 * Normalizes endpoints to prevent bypass (e.g., /api/products/123 -> /api/products/:id)
 */
export function normalizeEndpoint(path: string): string {
  // Remove query string
  const cleanPath = path.split('?')[0];

  // Replace UUIDs and numeric IDs with :id
  return cleanPath
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/[a-z0-9]{20,}/gi, '/:id')
    .replace(/\/\d+/g, '/:id')
    .toLowerCase();
}

/**
 * Get current rate limit status for an identifier
 */
export async function getRateLimitStatus(
  identifier: string,
  endpoint: string,
  role?: Role | string
): Promise<{
  requestCount: number;
  limit: number;
  remaining: number;
  resetAt: Date;
}> {
  const limits = getRateLimitForRole(role);
  const now = new Date();
  const windowStart = new Date(now.getTime() - limits.windowMs);

  const record = await prisma.rateLimit.findFirst({
    where: {
      identifier,
      endpoint,
      windowStart: {
        gte: windowStart,
      },
    },
    orderBy: {
      windowStart: 'desc',
    },
  });

  const requestCount = record?.requestCount || 0;
  const remaining = Math.max(0, limits.maxRequests - requestCount);
  const resetAt = record
    ? new Date(record.windowStart.getTime() + limits.windowMs)
    : new Date(now.getTime() + limits.windowMs);

  return {
    requestCount,
    limit: limits.maxRequests,
    remaining,
    resetAt,
  };
}

/**
 * Reset rate limit for an identifier (admin function)
 */
export async function resetRateLimit(
  identifier: string,
  endpoint?: string
): Promise<number> {
  const where: Prisma.RateLimitWhereInput = { identifier };
  if (endpoint) where.endpoint = endpoint;

  const result = await prisma.rateLimit.deleteMany({ where });
  return result.count;
}

/**
 * Get rate limit statistics
 */
export async function getRateLimitStats(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const where: Prisma.RateLimitWhereInput = {};

  if (filters?.startDate || filters?.endDate) {
    where.windowStart = {};
    if (filters.startDate) where.windowStart.gte = filters.startDate;
    if (filters.endDate) where.windowStart.lte = filters.endDate;
  }

  const [
    totalRecords,
    uniqueIdentifiers,
    endpointCounts,
    roleCounts,
  ] = await Promise.all([
    prisma.rateLimit.count({ where }),
    prisma.rateLimit.groupBy({
      by: ['identifier'],
      where,
      _count: true,
    }),
    prisma.rateLimit.groupBy({
      by: ['endpoint'],
      where,
      _sum: {
        requestCount: true,
      },
    }),
    prisma.rateLimit.groupBy({
      by: ['role'],
      where,
      _count: true,
      _sum: {
        requestCount: true,
      },
    }),
  ]);

  return {
    totalRecords,
    uniqueIdentifiers: uniqueIdentifiers.length,
    topEndpoints: endpointCounts
      .map(({ endpoint, _sum }) => ({
        endpoint,
        requests: _sum.requestCount || 0,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10),
    roleStats: roleCounts.map(({ role, _count, _sum }) => ({
      role,
      records: _count,
      requests: _sum.requestCount || 0,
    })),
  };
}

/**
 * Clean up old rate limit records
 */
export async function cleanupRateLimits(olderThanMinutes: number = 60): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setMinutes(cutoffDate.getMinutes() - olderThanMinutes);

  const result = await prisma.rateLimit.deleteMany({
    where: {
      windowStart: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}
