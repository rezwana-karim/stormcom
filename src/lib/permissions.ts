/**
 * Role-Based Permission System
 * 
 * This module defines permissions for all roles in the system.
 * Permission format: resource:action:scope
 * - resource: products, orders, customers, etc.
 * - action: create, read, update, delete, manage (manage = all CRUD operations)
 * - scope: own, store, org, platform (optional, defaults to store)
 * 
 * Special permissions:
 * - `*` = all permissions (SUPER_ADMIN)
 * - `resource:*` = all actions on resource
 * - `resource:action` = action on resource (default scope: store)
 */

import { Role } from '@prisma/client';

export type Permission = string;

export interface RolePermissions {
  role: Role;
  permissions: Permission[];
  description: string;
}

/**
 * Permission definitions for each role
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // ========== PLATFORM LEVEL ==========
  
  /**
   * SUPER_ADMIN - Platform administrator
   * Full access to everything across all organizations and stores
   */
  SUPER_ADMIN: ['*'],

  // ========== ORGANIZATION LEVEL ==========
  
  /**
   * OWNER - Organization owner
   * Full control over organization, stores, and can manage all roles
   */
  OWNER: [
    'org:*',
    'organization:*',
    'stores:*',
    'store:*',
    'users:*',
    'roles:*',
    'billing:*',
    'settings:*',
    'subscriptions:*',
    'webhooks:*',
    'integrations:*',
    // Can access all store-level permissions for their org's stores
    'products:*',
    'categories:*',
    'brands:*',
    'attributes:*',
    'inventory:*',
    'orders:*',
    'customers:*',
    'reviews:*',
    'reports:*',
    'analytics:*',
    'staff:*',
    'content:*',
    'marketing:*',
    'coupons:*',
    'support:*',
  ],

  /**
   * ADMIN - Organization administrator
   * Can manage stores and most operations except billing
   */
  ADMIN: [
    'org:read',
    'org:update',
    'organization:read',
    'organization:update',
    'stores:*',
    'store:*',
    'users:read',
    'users:invite',
    'settings:read',
    'settings:update',
    'subscriptions:read',
    // Store-level access
    'products:*',
    'categories:*',
    'brands:*',
    'attributes:*',
    'inventory:*',
    'orders:*',
    'customers:*',
    'reviews:*',
    'reports:*',
    'analytics:*',
    'staff:read',
    'staff:create',
    'staff:update',
    'content:*',
    'marketing:*',
    'coupons:*',
    'support:*',
  ],

  /**
   * MEMBER - Organization member
   * Basic read access to organization and stores
   */
  MEMBER: [
    'org:read',
    'stores:read',
    'products:read',
    'categories:read',
    'brands:read',
    'orders:read',
    'customers:read',
    'reports:read',
  ],

  /**
   * VIEWER - Organization viewer
   * Read-only access to public information
   */
  VIEWER: [
    'org:read',
    'stores:read',
    'products:read',
    'categories:read',
    'brands:read',
  ],

  // ========== STORE LEVEL ==========
  
  /**
   * STORE_ADMIN - Store administrator
   * Full control over assigned store
   */
  STORE_ADMIN: [
    'store:read',
    'store:update',
    'stores:read',
    'products:*',
    'categories:*',
    'brands:*',
    'attributes:*',
    'inventory:*',
    'orders:*',
    'customers:*',
    'reviews:*',
    'reports:*',
    'analytics:*',
    'staff:*',
    'content:*',
    'marketing:*',
    'coupons:*',
    'support:*',
    'settings:read',
    'settings:update',
    'subscriptions:read',
    'webhooks:*',
    'integrations:*',
  ],

  /**
   * SALES_MANAGER - Sales and order management
   * Manages orders, customers, and product information
   */
  SALES_MANAGER: [
    'products:read',
    'products:update', // Can update product info like prices
    'categories:read',
    'brands:read',
    'orders:*',
    'customers:read',
    'customers:update',
    'customers:create',
    'reports:read',
    'analytics:read',
    'support:read',
    'support:create',
    'support:update',
  ],

  /**
   * INVENTORY_MANAGER - Inventory and product management
   * Full control over products and inventory
   */
  INVENTORY_MANAGER: [
    'products:*',
    'categories:*',
    'brands:*',
    'inventory:*',
    'reports:read',
    'analytics:read',
    'orders:read', // Need to see orders for inventory planning
  ],

  /**
   * CUSTOMER_SERVICE - Customer support and service
   * Manages customer interactions, orders, and support tickets
   */
  CUSTOMER_SERVICE: [
    'orders:read',
    'orders:update',
    'customers:*',
    'products:read',
    'support:*',
    'reports:read',
  ],

  /**
   * CONTENT_MANAGER - Content and product information
   * Manages product content, categories, and marketing materials
   */
  CONTENT_MANAGER: [
    'products:read',
    'products:update',
    'products:create', // Can create product listings
    'categories:*',
    'brands:*',
    'content:*',
    'marketing:read',
    'marketing:create',
    'marketing:update',
  ],

  /**
   * MARKETING_MANAGER - Marketing and campaigns
   * Manages marketing campaigns, analytics, and customer insights
   */
  MARKETING_MANAGER: [
    'products:read',
    'customers:read',
    'marketing:*',
    'campaigns:*',
    'analytics:*',
    'reports:read',
    'content:read',
    'content:create',
    'content:update',
  ],

  /**
   * DELIVERY_BOY - Delivery and logistics
   * Views and updates delivery assignments
   */
  DELIVERY_BOY: [
    'deliveries:read',
    'deliveries:update',
    'orders:read',
    'customers:read', // Read customer contact info for delivery
  ],

  // ========== CUSTOMER LEVEL ==========
  
  /**
   * CUSTOMER - End customer
   * Can browse products and manage their own orders and profile
   */
  CUSTOMER: [
    'products:read',
    'categories:read',
    'brands:read',
    'orders:create',
    'orders:read:own',
    'orders:update:own', // Can cancel their own orders
    'profile:*:own',
    'wishlist:*:own',
    'reviews:create',
    'reviews:read',
    'reviews:update:own',
    'reviews:delete:own',
    'support:create',
    'support:read:own',
  ],
};

/**
 * Check if a role has a specific permission
 * Supports wildcards and hierarchical permissions
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];
  
  if (!rolePermissions) {
    return false;
  }

  // Check for wildcard (all permissions)
  if (rolePermissions.includes('*')) {
    return true;
  }

  // Direct match
  if (rolePermissions.includes(permission)) {
    return true;
  }

  // Check for wildcard in resource (e.g., products:*)
  const [resource] = permission.split(':');
  if (rolePermissions.includes(`${resource}:*`)) {
    return true;
  }

  return false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role can access a resource
 */
export function canAccessResource(role: Role, resource: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];
  
  if (!rolePermissions) {
    return false;
  }

  // Check for wildcard
  if (rolePermissions.includes('*')) {
    return true;
  }

  // Check for resource-level access
  return rolePermissions.some(perm => 
    perm === `${resource}:*` || perm.startsWith(`${resource}:`)
  );
}

/**
 * Role levels for hierarchical checks
 */
export enum RoleLevel {
  PLATFORM = 4,
  ORGANIZATION = 3,
  STORE = 2,
  CUSTOMER = 1,
}

/**
 * Get the level of a role
 */
export function getRoleLevel(role: Role): RoleLevel {
  if (role === 'SUPER_ADMIN') return RoleLevel.PLATFORM;
  if (['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(role)) return RoleLevel.ORGANIZATION;
  if (['STORE_ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'CUSTOMER_SERVICE', 
       'CONTENT_MANAGER', 'MARKETING_MANAGER', 'DELIVERY_BOY'].includes(role)) return RoleLevel.STORE;
  if (role === 'CUSTOMER') return RoleLevel.CUSTOMER;
  return RoleLevel.CUSTOMER;
}

/**
 * Check if role1 has higher or equal level than role2
 */
export function hasRoleLevelOrHigher(role1: Role, role2: Role): boolean {
  return getRoleLevel(role1) >= getRoleLevel(role2);
}

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  SUPER_ADMIN: 'Platform administrator with full access to all features',
  OWNER: 'Organization owner with full control over the organization',
  ADMIN: 'Organization administrator with management access',
  MEMBER: 'Organization member with basic access',
  VIEWER: 'Organization viewer with read-only access',
  STORE_ADMIN: 'Store administrator with full control over the store',
  SALES_MANAGER: 'Manages sales, orders, and customer relationships',
  INVENTORY_MANAGER: 'Manages products, inventory, and stock',
  CUSTOMER_SERVICE: 'Handles customer support and service',
  CONTENT_MANAGER: 'Manages product content and categories',
  MARKETING_MANAGER: 'Manages marketing campaigns and analytics',
  DELIVERY_BOY: 'Manages deliveries and order fulfillment',
  CUSTOMER: 'End customer with shopping access',
};

/**
 * Get human-readable role name
 */
export function getRoleName(role: Role): string {
  const names: Record<Role, string> = {
    SUPER_ADMIN: 'Super Admin',
    OWNER: 'Owner',
    ADMIN: 'Admin',
    MEMBER: 'Member',
    VIEWER: 'Viewer',
    STORE_ADMIN: 'Store Admin',
    SALES_MANAGER: 'Sales Manager',
    INVENTORY_MANAGER: 'Inventory Manager',
    CUSTOMER_SERVICE: 'Customer Service',
    CONTENT_MANAGER: 'Content Manager',
    MARKETING_MANAGER: 'Marketing Manager',
    DELIVERY_BOY: 'Delivery Boy',
    CUSTOMER: 'Customer',
  };
  return names[role] || role;
}
