/**
 * Query Helpers - Reusable Database Query Patterns
 * 
 * This module provides cached, reusable query helpers for common
 * database access patterns with proper multi-tenancy filtering.
 * 
 * Uses React cache() for request-level memoization as recommended by Next.js 16.
 */

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { getCachedUserId } from '@/lib/cached-session';
import 'server-only';

/**
 * Get user by ID with caching
 * Includes relationships commonly needed across the app
 */
export const getUserById = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              store: true,
            },
          },
        },
      },
      storeStaff: {
        where: {
          isActive: true,
        },
        include: {
          store: true,
        },
      },
    },
  });
});

/**
 * Get store by ID with caching
 * Includes organization relationship
 */
export const getStoreById = cache(async (storeId: string) => {
  return prisma.store.findUnique({
    where: { id: storeId },
    include: {
      organization: true,
    },
  });
});

/**
 * Get store by slug with caching
 */
export const getStoreBySlug = cache(async (slug: string) => {
  return prisma.store.findUnique({
    where: { slug },
    include: {
      organization: true,
    },
  });
});

/**
 * Get organization by ID with caching
 * Includes store relationship
 */
export const getOrganizationById = cache(async (orgId: string) => {
  return prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      store: true,
    },
  });
});

/**
 * Check if user has access to store
 * Returns true if user is super admin, store staff, or member of owning organization
 * 
 * Optimized with parallel queries for better performance
 */
export const checkStoreAccess = cache(async (storeId: string, userId?: string) => {
  const currentUserId = userId ?? await getCachedUserId();
  
  if (!currentUserId) {
    return false;
  }

  // Run all checks in parallel for better performance
  const [user, storeStaff, membership] = await Promise.all([
    // Check if user is super admin
    prisma.user.findUnique({
      where: { id: currentUserId },
      select: { isSuperAdmin: true },
    }),
    // Check if user is store staff
    prisma.storeStaff.findFirst({
      where: {
        userId: currentUserId,
        storeId,
        isActive: true,
      },
    }),
    // Check if user is member of organization that owns this store
    prisma.membership.findFirst({
      where: {
        userId: currentUserId,
        organization: {
          store: {
            id: storeId,
          },
        },
      },
    }),
  ]);

  return user?.isSuperAdmin || !!storeStaff || !!membership;
});

/**
 * Get user's default membership
 * Returns the first (oldest) membership for the user
 */
export const getUserDefaultMembership = cache(async (userId?: string) => {
  const currentUserId = userId ?? await getCachedUserId();
  
  if (!currentUserId) {
    return null;
  }

  return prisma.membership.findFirst({
    where: {
      userId: currentUserId,
    },
    include: {
      organization: {
        include: {
          store: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
});

/**
 * Get all memberships for a user with caching
 */
export const getUserMemberships = cache(async (userId?: string) => {
  const currentUserId = userId ?? await getCachedUserId();
  
  if (!currentUserId) {
    return [];
  }

  return prisma.membership.findMany({
    where: {
      userId: currentUserId,
    },
    include: {
      organization: {
        include: {
          store: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
});

/**
 * Get user's active store staff assignments with caching
 */
export const getUserStoreStaff = cache(async (userId?: string) => {
  const currentUserId = userId ?? await getCachedUserId();
  
  if (!currentUserId) {
    return [];
  }

  return prisma.storeStaff.findMany({
    where: {
      userId: currentUserId,
      isActive: true,
    },
    include: {
      store: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
});
