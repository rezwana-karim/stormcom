/**
 * Cached Session Management
 * 
 * This module provides cached session retrieval to avoid redundant
 * session lookups within the same request lifecycle.
 * 
 * Uses React's cache() for request-level memoization as recommended by Next.js 16.
 * All getServerSession calls should use this cached version.
 */

import { cache } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import 'server-only';

/**
 * Get current session with request-level caching
 * 
 * This function is cached using React.cache(), meaning:
 * - Multiple calls within the same request will reuse the same session
 * - Eliminates redundant session lookups
 * - Automatically cleaned up after request completes
 * 
 * @returns Session object or null if not authenticated
 */
export const getCachedSession = cache(async () => {
  return getServerSession(authOptions);
});

/**
 * Get current user ID from cached session
 * Convenience helper for the most common use case
 * 
 * @returns User ID or null if not authenticated
 */
export const getCachedUserId = cache(async () => {
  const session = await getCachedSession();
  return session?.user?.id ?? null;
});

/**
 * Check if user is authenticated (cached)
 * 
 * @returns true if user has valid session
 */
export const isAuthenticated = cache(async () => {
  const session = await getCachedSession();
  return !!session?.user?.id;
});
