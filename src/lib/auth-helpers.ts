/**
 * Auth Helpers - Permission Checking and Role Management
 * 
 * This module provides helper functions to check user permissions
 * and roles in both client and server contexts.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissions,
  Permission,
} from './permissions';
import { logPermissionCheck } from './audit-logger';

/**
 * User context with roles and permissions
 */
export interface UserContext {
  userId: string;
  email: string | null;
  name: string | null;
  isSuperAdmin: boolean;
  organizationRole?: Role;
  organizationId?: string;
  storeRole?: Role;
  storeId?: string;
  permissions: Permission[];
}

/**
 * Get current user context with roles and permissions
 * This should be called in server components and API routes
 */
export async function getUserContext(): Promise<UserContext | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  // Get user with memberships and store staff assignments
  // Fetch ALL memberships and store staff, then prioritize in code
  const user = await prisma.user.findUnique({
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

  if (!user) {
    return null;
  }

  // Prioritize memberships: OWNER > ADMIN > MEMBER > VIEWER
  // This ensures store owners always see their stores
  const rolePriority: Record<string, number> = {
    OWNER: 4,
    ADMIN: 3,
    MEMBER: 2,
    VIEWER: 1,
  };

  // Sort memberships by role priority (highest first), then by createdAt (newest first)
  const sortedMemberships = [...user.memberships].sort((a, b) => {
    const priorityDiff = (rolePriority[b.role] || 0) - (rolePriority[a.role] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Prioritize store staff: STORE_ADMIN > SALES_MANAGER > others
  const storeRolePriority: Record<string, number> = {
    STORE_ADMIN: 4,
    SALES_MANAGER: 3,
    INVENTORY_MANAGER: 2,
    CUSTOMER_SUPPORT: 1,
  };

  const sortedStoreStaff = [...user.storeStaff].sort((a, b) => {
    const priorityDiff = (storeRolePriority[b.role || ''] || 0) - (storeRolePriority[a.role || ''] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Determine roles - use the highest priority membership/staff
  const membership = sortedMemberships[0];
  const storeStaff = sortedStoreStaff[0];

  const organizationRole = membership?.role;
  const organizationId = membership?.organizationId;
  const storeRole = storeStaff?.role;
  const storeId = storeStaff?.storeId || membership?.organization?.store?.id;

  // Determine effective role (highest level role takes precedence)
  let effectiveRole: Role | undefined;
  if (user.isSuperAdmin) {
    effectiveRole = 'SUPER_ADMIN' as Role;
  } else if (storeRole) {
    effectiveRole = storeRole;
  } else if (organizationRole) {
    effectiveRole = organizationRole;
  }

  // Get permissions for effective role
  const permissions = effectiveRole ? getPermissions(effectiveRole) : [];

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
    organizationRole,
    organizationId,
    storeRole: storeRole ?? undefined,
    storeId,
    permissions,
  };
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<UserContext> {
  const context = await getUserContext();
  
  if (!context) {
    throw new Error('Authentication required');
  }
  
  return context;
}

/**
 * Check if current user has a specific permission
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const context = await getUserContext();
  
  if (!context) {
    return false;
  }

  // Determine effective role for logging
  const effectiveRole = context.isSuperAdmin 
    ? 'SUPER_ADMIN' 
    : (context.storeRole || context.organizationRole || 'NONE');

  // Super admin has all permissions
  if (context.isSuperAdmin) {
    // Log successful permission check
    await logPermissionCheck(context.userId, permission, effectiveRole, true, {
      storeId: context.storeId,
    });
    return true;
  }

  // Check store role first (more specific)
  if (context.storeRole && hasPermission(context.storeRole, permission)) {
    await logPermissionCheck(context.userId, permission, effectiveRole, true, {
      storeId: context.storeId,
    });
    return true;
  }

  // Check organization role
  if (context.organizationRole && hasPermission(context.organizationRole, permission)) {
    await logPermissionCheck(context.userId, permission, effectiveRole, true, {
      storeId: context.storeId,
    });
    return true;
  }

  // Permission denied - log it
  await logPermissionCheck(context.userId, permission, effectiveRole, false, {
    storeId: context.storeId,
  });

  return false;
}

/**
 * Check if current user has any of the specified permissions
 */
export async function checkAnyPermission(permissions: Permission[]): Promise<boolean> {
  const context = await getUserContext();
  
  if (!context) {
    return false;
  }

  // Super admin has all permissions
  if (context.isSuperAdmin) {
    return true;
  }

  // Check store role
  if (context.storeRole && hasAnyPermission(context.storeRole, permissions)) {
    return true;
  }

  // Check organization role
  if (context.organizationRole && hasAnyPermission(context.organizationRole, permissions)) {
    return true;
  }

  return false;
}

/**
 * Check if current user has all of the specified permissions
 */
export async function checkAllPermissions(permissions: Permission[]): Promise<boolean> {
  const context = await getUserContext();
  
  if (!context) {
    return false;
  }

  // Super admin has all permissions
  if (context.isSuperAdmin) {
    return true;
  }

  // Check store role
  if (context.storeRole && hasAllPermissions(context.storeRole, permissions)) {
    return true;
  }

  // Check organization role
  if (context.organizationRole && hasAllPermissions(context.organizationRole, permissions)) {
    return true;
  }

  return false;
}

/**
 * Require specific permission - throws error if user doesn't have permission
 */
export async function requirePermission(permission: Permission): Promise<UserContext> {
  const context = await requireAuth();
  
  const hasAccess = context.isSuperAdmin ||
    (context.storeRole && hasPermission(context.storeRole, permission)) ||
    (context.organizationRole && hasPermission(context.organizationRole, permission));

  if (!hasAccess) {
    throw new Error(`Permission denied: ${permission} required`);
  }

  return context;
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<UserContext> {
  const context = await requireAuth();
  
  const hasAccess = context.isSuperAdmin ||
    (context.storeRole && hasAnyPermission(context.storeRole, permissions)) ||
    (context.organizationRole && hasAnyPermission(context.organizationRole, permissions));

  if (!hasAccess) {
    throw new Error(`Permission denied: one of [${permissions.join(', ')}] required`);
  }

  return context;
}

/**
 * Require all of the specified permissions
 */
export async function requireAllPermissions(permissions: Permission[]): Promise<UserContext> {
  const context = await requireAuth();
  
  const hasAccess = context.isSuperAdmin ||
    (context.storeRole && hasAllPermissions(context.storeRole, permissions)) ||
    (context.organizationRole && hasAllPermissions(context.organizationRole, permissions));

  if (!hasAccess) {
    throw new Error(`Permission denied: all of [${permissions.join(', ')}] required`);
  }

  return context;
}

/**
 * Check if current user has a specific role
 */
export async function hasRole(role: Role): Promise<boolean> {
  const context = await getUserContext();
  
  if (!context) {
    return false;
  }

  if (context.isSuperAdmin && role === 'SUPER_ADMIN') {
    return true;
  }

  return context.storeRole === role || context.organizationRole === role;
}

/**
 * Require specific role - throws error if user doesn't have role
 */
export async function requireRole(role: Role): Promise<UserContext> {
  const context = await requireAuth();
  
  const hasRequiredRole = 
    (context.isSuperAdmin && role === 'SUPER_ADMIN') ||
    context.storeRole === role ||
    context.organizationRole === role;

  if (!hasRequiredRole) {
    throw new Error(`Role required: ${role}`);
  }

  return context;
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const context = await getUserContext();
  return context?.isSuperAdmin || false;
}

/**
 * Require super admin access
 */
export async function requireSuperAdmin(): Promise<UserContext> {
  const context = await requireAuth();
  
  if (!context.isSuperAdmin) {
    throw new Error('Super admin access required');
  }

  return context;
}

/**
 * Get user's effective role (highest level role)
 */
export async function getEffectiveRole(): Promise<Role | null> {
  const context = await getUserContext();
  
  if (!context) {
    return null;
  }

  if (context.isSuperAdmin) {
    return 'SUPER_ADMIN' as Role;
  }

  return context.storeRole || context.organizationRole || null;
}
