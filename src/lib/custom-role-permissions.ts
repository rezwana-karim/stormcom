/**
 * Custom Role Permission Definitions
 * 
 * This module defines permissions available for custom roles.
 * Custom roles allow store owners to create tailored permission sets
 * that must be approved by Super Admin.
 * 
 * Permission format: resource:action
 * - resource: products, orders, customers, etc.
 * - action: read, create, update, delete
 */

export interface PermissionDefinition {
  key: string;
  name: string;
  description: string;
}

export interface PermissionCategory {
  category: string;
  description: string;
  permissions: PermissionDefinition[];
}

/**
 * All available permissions that can be assigned to custom roles
 * Organized by category for the permission picker UI
 */
export const AVAILABLE_PERMISSIONS: PermissionCategory[] = [
  {
    category: 'Products',
    description: 'Product catalog management',
    permissions: [
      { key: 'products:read', name: 'View Products', description: 'View all products in the store' },
      { key: 'products:create', name: 'Create Products', description: 'Add new products to the store' },
      { key: 'products:update', name: 'Edit Products', description: 'Modify existing product information' },
      { key: 'products:delete', name: 'Delete Products', description: 'Remove products from the store' },
    ],
  },
  {
    category: 'Categories',
    description: 'Category management',
    permissions: [
      { key: 'categories:read', name: 'View Categories', description: 'View product categories' },
      { key: 'categories:create', name: 'Create Categories', description: 'Add new categories' },
      { key: 'categories:update', name: 'Edit Categories', description: 'Modify category information' },
      { key: 'categories:delete', name: 'Delete Categories', description: 'Remove categories' },
    ],
  },
  {
    category: 'Brands',
    description: 'Brand management',
    permissions: [
      { key: 'brands:read', name: 'View Brands', description: 'View product brands' },
      { key: 'brands:create', name: 'Create Brands', description: 'Add new brands' },
      { key: 'brands:update', name: 'Edit Brands', description: 'Modify brand information' },
      { key: 'brands:delete', name: 'Delete Brands', description: 'Remove brands' },
    ],
  },
  {
    category: 'Orders',
    description: 'Order processing and management',
    permissions: [
      { key: 'orders:read', name: 'View Orders', description: 'View all orders' },
      { key: 'orders:create', name: 'Create Orders', description: 'Create manual orders' },
      { key: 'orders:update', name: 'Process Orders', description: 'Update order status and details' },
      { key: 'orders:cancel', name: 'Cancel Orders', description: 'Cancel pending orders' },
      { key: 'orders:refund', name: 'Process Refunds', description: 'Issue refunds for orders' },
    ],
  },
  {
    category: 'Customers',
    description: 'Customer relationship management',
    permissions: [
      { key: 'customers:read', name: 'View Customers', description: 'View customer information' },
      { key: 'customers:create', name: 'Add Customers', description: 'Add new customers manually' },
      { key: 'customers:update', name: 'Edit Customers', description: 'Update customer information' },
      { key: 'customers:delete', name: 'Delete Customers', description: 'Remove customer records' },
    ],
  },
  {
    category: 'Inventory',
    description: 'Stock and inventory management',
    permissions: [
      { key: 'inventory:read', name: 'View Inventory', description: 'View stock levels and inventory' },
      { key: 'inventory:update', name: 'Update Stock', description: 'Adjust stock quantities' },
      { key: 'inventory:transfer', name: 'Transfer Stock', description: 'Transfer stock between locations' },
    ],
  },
  {
    category: 'Reports',
    description: 'Business reports and insights',
    permissions: [
      { key: 'reports:read', name: 'View Reports', description: 'Access sales and business reports' },
      { key: 'reports:export', name: 'Export Reports', description: 'Download reports as files' },
    ],
  },
  {
    category: 'Analytics',
    description: 'Store analytics and dashboards',
    permissions: [
      { key: 'analytics:read', name: 'View Analytics', description: 'Access analytics dashboards' },
    ],
  },
  {
    category: 'Content',
    description: 'Store content management',
    permissions: [
      { key: 'content:read', name: 'View Content', description: 'View store content and pages' },
      { key: 'content:create', name: 'Create Content', description: 'Add new content' },
      { key: 'content:update', name: 'Edit Content', description: 'Modify existing content' },
      { key: 'content:delete', name: 'Delete Content', description: 'Remove content' },
    ],
  },
  {
    category: 'Marketing',
    description: 'Marketing and promotions',
    permissions: [
      { key: 'marketing:read', name: 'View Marketing', description: 'View marketing campaigns' },
      { key: 'marketing:create', name: 'Create Campaigns', description: 'Create marketing campaigns' },
      { key: 'marketing:update', name: 'Edit Campaigns', description: 'Modify campaigns' },
      { key: 'marketing:delete', name: 'Delete Campaigns', description: 'Remove campaigns' },
    ],
  },
  {
    category: 'Support',
    description: 'Customer support and tickets',
    permissions: [
      { key: 'support:read', name: 'View Support Tickets', description: 'View customer support tickets' },
      { key: 'support:create', name: 'Create Tickets', description: 'Create support tickets' },
      { key: 'support:update', name: 'Handle Tickets', description: 'Respond to and update tickets' },
      { key: 'support:close', name: 'Close Tickets', description: 'Close resolved tickets' },
    ],
  },
  {
    category: 'Settings',
    description: 'Store configuration',
    permissions: [
      { key: 'settings:read', name: 'View Settings', description: 'View store settings' },
      { key: 'settings:update', name: 'Edit Settings', description: 'Modify store settings' },
    ],
  },
  {
    category: 'Deliveries',
    description: 'Delivery management',
    permissions: [
      { key: 'deliveries:read', name: 'View Deliveries', description: 'View delivery assignments' },
      { key: 'deliveries:update', name: 'Update Deliveries', description: 'Update delivery status' },
      { key: 'deliveries:assign', name: 'Assign Deliveries', description: 'Assign deliveries to drivers' },
    ],
  },
];

/**
 * Permissions that are RESTRICTED and cannot be assigned to custom roles
 * These are reserved for predefined roles or Super Admin only
 */
export const RESTRICTED_PERMISSIONS = [
  // Store management - only STORE_ADMIN and above
  'stores:*',
  'stores:create',
  'stores:delete',
  'stores:settings:delete',
  
  // Staff management - sensitive operations
  'staff:delete',
  'staff:manage:all',
  
  // Role management - Super Admin only
  'roles:*',
  'roles:create',
  'roles:delete',
  
  // Billing - Owner only
  'billing:*',
  'billing:manage',
  'subscriptions:*',
  
  // Organization level
  'org:*',
  'org:delete',
  
  // Platform level
  'platform:*',
  'users:*',
];

/**
 * Get flat list of all available permission keys
 */
export function getAllPermissionKeys(): string[] {
  return AVAILABLE_PERMISSIONS.flatMap(category => 
    category.permissions.map(p => p.key)
  );
}

/**
 * Validate that all requested permissions are allowed
 */
export function validatePermissions(permissions: string[]): { 
  valid: boolean; 
  errors: string[];
  invalidPermissions: string[];
} {
  const errors: string[] = [];
  const invalidPermissions: string[] = [];
  const allowedKeys = getAllPermissionKeys();
  
  for (const perm of permissions) {
    // Check if permission exists in available list
    if (!allowedKeys.includes(perm)) {
      errors.push(`Permission "${perm}" is not available for custom roles`);
      invalidPermissions.push(perm);
      continue;
    }
    
    // Check if permission is restricted
    const isRestricted = RESTRICTED_PERMISSIONS.some(restricted => {
      if (restricted.endsWith(':*')) {
        const prefix = restricted.replace(':*', '');
        return perm.startsWith(prefix + ':');
      }
      return perm === restricted;
    });
    
    if (isRestricted) {
      errors.push(`Permission "${perm}" is restricted and cannot be assigned to custom roles`);
      invalidPermissions.push(perm);
    }
  }
  
  return { 
    valid: errors.length === 0, 
    errors,
    invalidPermissions,
  };
}

/**
 * Get permission details by key
 */
export function getPermissionByKey(key: string): PermissionDefinition | null {
  for (const category of AVAILABLE_PERMISSIONS) {
    const perm = category.permissions.find(p => p.key === key);
    if (perm) return perm;
  }
  return null;
}

/**
 * Get category for a permission key
 */
export function getPermissionCategory(key: string): string | null {
  for (const category of AVAILABLE_PERMISSIONS) {
    const hasPermission = category.permissions.some(p => p.key === key);
    if (hasPermission) return category.category;
  }
  return null;
}

/**
 * Format permissions for display (grouped by category)
 */
export function formatPermissionsForDisplay(permissions: string[]): {
  category: string;
  permissions: PermissionDefinition[];
}[] {
  const grouped: Record<string, PermissionDefinition[]> = {};
  
  for (const permKey of permissions) {
    const perm = getPermissionByKey(permKey);
    const category = getPermissionCategory(permKey);
    
    if (perm && category) {
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(perm);
    }
  }
  
  return Object.entries(grouped).map(([category, perms]) => ({
    category,
    permissions: perms,
  }));
}

/**
 * Check if a custom role has a specific permission
 */
export function customRoleHasPermission(
  rolePermissions: string[],
  requiredPermission: string
): boolean {
  // Direct match
  if (rolePermissions.includes(requiredPermission)) {
    return true;
  }
  
  // Check for wildcard in resource (e.g., products:*)
  const [resource] = requiredPermission.split(':');
  if (rolePermissions.includes(`${resource}:*`)) {
    return true;
  }
  
  return false;
}

/**
 * Get suggested permissions for common role types
 */
export const SUGGESTED_ROLE_TEMPLATES = {
  'Product Manager': [
    'products:read', 'products:create', 'products:update',
    'categories:read', 'categories:create', 'categories:update',
    'brands:read', 'brands:create', 'brands:update',
    'inventory:read', 'inventory:update',
  ],
  'Order Processor': [
    'orders:read', 'orders:update',
    'customers:read',
    'products:read',
    'deliveries:read', 'deliveries:update',
  ],
  'Customer Support': [
    'customers:read', 'customers:update',
    'orders:read', 'orders:update',
    'support:read', 'support:create', 'support:update', 'support:close',
    'products:read',
  ],
  'Content Editor': [
    'products:read', 'products:update',
    'content:read', 'content:create', 'content:update',
    'categories:read',
    'brands:read',
  ],
  'Analytics Viewer': [
    'analytics:read',
    'reports:read', 'reports:export',
    'products:read',
    'orders:read',
    'customers:read',
  ],
  'Delivery Manager': [
    'deliveries:read', 'deliveries:update', 'deliveries:assign',
    'orders:read', 'orders:update',
    'customers:read',
  ],
};

export type SuggestedRoleTemplate = keyof typeof SUGGESTED_ROLE_TEMPLATES;

/**
 * Alias for AVAILABLE_PERMISSIONS for backward compatibility
 */
export const ALLOWED_PERMISSIONS = AVAILABLE_PERMISSIONS;

/**
 * Get permissions organized by category as a record
 */
export function getPermissionsByCategory(): Record<string, { key: string; label: string; description?: string }[]> {
  const result: Record<string, { key: string; label: string; description?: string }[]> = {};
  
  for (const category of AVAILABLE_PERMISSIONS) {
    result[category.category] = category.permissions.map(p => ({
      key: p.key,
      label: p.name,
      description: p.description,
    }));
  }
  
  return result;
}

/**
 * Check if a permission is allowed for custom roles
 */
export function isPermissionAllowed(permission: string): boolean {
  const allowedKeys = getAllPermissionKeys();
  
  if (!allowedKeys.includes(permission)) {
    return false;
  }
  
  // Check if restricted
  const isRestricted = RESTRICTED_PERMISSIONS.some(restricted => {
    if (restricted.endsWith(':*')) {
      const prefix = restricted.replace(':*', '');
      return permission.startsWith(prefix + ':');
    }
    return permission === restricted;
  });
  
  return !isRestricted;
}
