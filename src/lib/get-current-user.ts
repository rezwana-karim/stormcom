/**
 * Current User Utilities
 * Helper functions to get authenticated user and their store context
 * 
 * Uses cached session to avoid redundant lookups within the same request.
 */

import { getCachedSession } from "@/lib/cached-session";
import prisma from "@/lib/prisma";

/**
 * Get current authenticated user from session
 * @returns User with id and email, or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getCachedSession();
  
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
  const session = await getCachedSession();
  
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
  const session = await getCachedSession();
  
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

/**
 * Verify user has access to a specific store
 * Checks if the user is a member of the organization that owns the store
 * OR if the user is directly assigned as store staff
 * @param storeId - The store ID to verify access for
 * @returns True if user has access, false otherwise
 */
export async function verifyStoreAccess(storeId: string): Promise<boolean> {
  const session = await getCachedSession();
  
  if (!session?.user?.id) {
    return false;
  }

  // Check if user is super admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true },
  });

  if (user?.isSuperAdmin) {
    return true;
  }

  // Check if user is store staff (direct assignment)
  const storeStaff = await prisma.storeStaff.findFirst({
    where: {
      userId: session.user.id,
      storeId: storeId,
      isActive: true,
    },
  });

  if (storeStaff) {
    return true;
  }

  // Check if user is member of organization that owns this store
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: {
        store: {
          id: storeId,
        },
      },
    },
  });

  return membership !== null;
}

/**
 * Require verified store access - verifies user has access to specific store
 * Use this when you need to verify access to a client-provided storeId
 * @param storeId - The store ID to verify access for
 * @throws Error if user doesn't have access to the store
 * @returns Store ID (the same one passed in, for convenience)
 */
export async function requireVerifiedStoreAccess(storeId: string): Promise<string> {
  const hasAccess = await verifyStoreAccess(storeId);
  
  if (!hasAccess) {
    throw new Error('Access denied. You do not have permission to access this store.');
  }
  
  return storeId;
}

/**
 * Get current user's default organization ID
 * Returns the first organization membership
 * @returns Organization ID or null if user has no memberships
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const session = await getCachedSession();
  
  if (!session?.user?.id) {
    return null;
  }

  // Find user's first membership
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'asc', // Get the oldest/first membership
    },
  });

  return membership?.organizationId || null;
}

/**
 * Require organization access - throws error if user has no organization
 * @throws Error if no organization found
 * @returns Organization ID
 */
export async function requireOrganizationId(): Promise<string> {
  const organizationId = await getCurrentOrganizationId();
  
  if (!organizationId) {
    throw new Error('Organization access required. Please create or join an organization.');
  }
  
  return organizationId;
}
