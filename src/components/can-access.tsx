/**
 * Permission-Based Access Control Components
 * 
 * Provides React components for conditional rendering based on permissions
 */

'use client';

import { ReactNode } from 'react';
import { Role } from '@prisma/client';
import { usePermissions } from '@/hooks/use-permissions';
import { Permission } from '@/lib/permissions';

export interface CanAccessProps {
  /**
   * Permission(s) required to access the content
   */
  permission?: Permission | Permission[];
  
  /**
   * Require all permissions (if multiple provided)
   */
  requireAll?: boolean;
  
  /**
   * Role(s) required to access the content
   */
  role?: Role | Role[];
  
  /**
   * Require super admin access
   */
  requireSuperAdmin?: boolean;
  
  /**
   * Content to render if user has access
   */
  children: ReactNode;
  
  /**
   * Optional fallback content if user doesn't have access
   */
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 * 
 * @example
 * <CanAccess permission="products:create">
 *   <Button>Add Product</Button>
 * </CanAccess>
 * 
 * @example
 * <CanAccess permission={["products:create", "inventory:manage"]} requireAll>
 *   <Button>Create with Inventory</Button>
 * </CanAccess>
 * 
 * @example
 * <CanAccess role="STORE_ADMIN">
 *   <AdminPanel />
 * </CanAccess>
 */
export function CanAccess({
  permission,
  requireAll = false,
  role,
  requireSuperAdmin = false,
  children,
  fallback = null,
}: CanAccessProps) {
  const { canAny, canAll, hasRole, isSuperAdmin, isLoading } = usePermissions();

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // Check super admin requirement
  if (requireSuperAdmin) {
    return isSuperAdmin ? <>{children}</> : <>{fallback}</>;
  }

  // Check role requirement
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    const hasRequiredRole = roles.some(r => hasRole(r));
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirement
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Component that renders only for super admins
 */
export function SuperAdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <CanAccess requireSuperAdmin fallback={fallback}>
      {children}
    </CanAccess>
  );
}

/**
 * Component that renders for specific roles
 */
export function RoleOnly({ role, children, fallback = null }: { role: Role | Role[]; children: ReactNode; fallback?: ReactNode }) {
  return (
    <CanAccess role={role} fallback={fallback}>
      {children}
    </CanAccess>
  );
}

/**
 * Component that checks if user cannot access (inverse of CanAccess)
 */
export function CannotAccess({
  permission,
  requireAll = false,
  role,
  children,
  fallback = null,
}: Omit<CanAccessProps, 'requireSuperAdmin'>) {
  const { canAny, canAll, hasRole, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  // Check role requirement (inverse)
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    const hasRequiredRole = roles.some(r => hasRole(r));
    if (hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirement (inverse)
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
    if (hasAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
