/**
 * Current User Utilities
 * Helper functions to get authenticated user and their store context
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Get current authenticated user from session
 * @returns User with id and email, or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  // Return user data from session
  return {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name || '',
    image: session.user.image || null,
  };
}

/**
 * Get current user's default store ID
 * Looks up user's first organization membership and returns its store
 * @returns Store ID or null if user has no store
 */
export async function getCurrentStoreId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  // Find user's first membership
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      organization: {
        include: {
          store: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc', // Get the oldest/first membership
    },
  });

  // Return store ID if organization has a store
  return membership?.organization?.store?.id || null;
}

/**
 * Get current user's store with full details
 * @returns Store object or null if user has no store
 */
export async function getCurrentStore() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  // Find user's first membership with store details
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
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

  return membership?.organization?.store || null;
}

/**
 * Require authentication - throws error if not authenticated
 * Use this when authentication is mandatory
 * @throws Error if not authenticated
 * @returns Authenticated user data
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Require store access - throws error if user has no store
 * Use this when store context is mandatory
 * @throws Error if no store found
 * @returns Store ID
 */
export async function requireStoreId(): Promise<string> {
  const storeId = await getCurrentStoreId();
  
  if (!storeId) {
    throw new Error('Store access required. Please create or join an organization with a store.');
  }
  
  return storeId;
}
