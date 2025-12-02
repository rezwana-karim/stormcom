/**
 * Permission Hooks for Client-Side Components
 * 
 * Provides React hooks to check permissions in client components
 */

'use client';

import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { hasPermission, hasAnyPermission, hasAllPermissions, Permission } from '@/lib/permissions';

export interface UsePermissionsReturn {
  /**
   * Check if user has a specific permission
   */
  can: (permission: Permission) => boolean;
  
  /**
   * Check if user has any of the specified permissions
   */
  canAny: (permissions: Permission[]) => boolean;
  
  /**
   * Check if user has all of the specified permissions
   */
  canAll: (permissions: Permission[]) => boolean;
  
  /**
   * Check if user has a specific role
   */
  hasRole: (role: Role) => boolean;
  
  /**
   * Check if user is super admin
   */
  isSuperAdmin: boolean;
  
  /**
   * User's organization role
   */
  organizationRole?: Role;
  
  /**
   * User's store role
   */
  storeRole?: Role;
  
  /**
   * All permissions for the user
   */
  permissions: Permission[];
  
  /**
   * Loading state
   */
  isLoading: boolean;
}

/**
 * Hook to check user permissions in client components
 */
export function usePermissions(): UsePermissionsReturn {
  const { data: session, status } = useSession();
  
  const isLoading = status === 'loading';
  const user = session?.user;
  const isSuperAdmin = user?.isSuperAdmin || false;
  const permissions = user?.permissions || [];
  const organizationRole = user?.organizationRole;
  const storeRole = user?.storeRole;

  // Determine effective role (store role takes precedence)
  const effectiveRole = isSuperAdmin 
    ? ('SUPER_ADMIN' as Role)
    : storeRole || organizationRole;

  const can = (permission: Permission): boolean => {
    if (isSuperAdmin) return true;
    if (!effectiveRole) return false;
    return hasPermission(effectiveRole, permission);
  };

  const canAny = (perms: Permission[]): boolean => {
    if (isSuperAdmin) return true;
    if (!effectiveRole) return false;
    return hasAnyPermission(effectiveRole, perms);
  };

  const canAll = (perms: Permission[]): boolean => {
    if (isSuperAdmin) return true;
    if (!effectiveRole) return false;
    return hasAllPermissions(effectiveRole, perms);
  };

  const hasRoleCheck = (role: Role): boolean => {
    if (isSuperAdmin && role === 'SUPER_ADMIN') return true;
    return storeRole === role || organizationRole === role;
  };

  return {
    can,
    canAny,
    canAll,
    hasRole: hasRoleCheck,
    isSuperAdmin,
    organizationRole,
    storeRole,
    permissions,
    isLoading,
  };
}

/**
 * Hook to get current user context
 */
export function useUserContext() {
  const { data: session, status } = useSession();
  
  return {
    userId: session?.user?.id,
    email: session?.user?.email,
    name: session?.user?.name,
    isSuperAdmin: session?.user?.isSuperAdmin || false,
    organizationRole: session?.user?.organizationRole,
    organizationId: session?.user?.organizationId,
    storeRole: session?.user?.storeRole,
    storeId: session?.user?.storeId,
    permissions: session?.user?.permissions || [],
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
