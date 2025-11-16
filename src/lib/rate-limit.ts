/**
 * Rate Limiting Utilities
 * Prevents abuse of API endpoints
 */

import { NextResponse } from "next/server";

interface RateLimitConfig {
  interval: number; // milliseconds
  uniqueTokenPerInterval: number;
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiter
 * For production, use Redis or similar
 */
export function rateLimit(config: RateLimitConfig) {
  const { interval, uniqueTokenPerInterval } = config;

  return {
    check: (limit: number, token: string): boolean => {
      const now = Date.now();
      const tokenData = rateLimitMap.get(token);

      if (!tokenData || now > tokenData.resetTime) {
        rateLimitMap.set(token, {
          count: 1,
          resetTime: now + interval,
        });
        return true;
      }

      if (tokenData.count >= limit) {
        return false;
      }

      tokenData.count += 1;
      return true;
    },

    remaining: (token: string): number => {
      const tokenData = rateLimitMap.get(token);
      if (!tokenData) return uniqueTokenPerInterval;
      return Math.max(0, uniqueTokenPerInterval - tokenData.count);
    },

    reset: (token: string): void => {
      rateLimitMap.delete(token);
    },
  };
}

/**
 * Rate limit middleware helper
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60000 // 1 minute
): Promise<NextResponse | null> {
  const limiter = rateLimit({
    interval: window,
    uniqueTokenPerInterval: 500,
  });

  const allowed = limiter.check(limit, identifier);

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Please try again later",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(window / 1000)),
        },
      }
    );
  }

  return null;
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  if (userId) return `user:${userId}`;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return `ip:${ip}`;
}
