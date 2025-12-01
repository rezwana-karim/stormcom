/**
 * Shared constants for the application
 */

/**
 * Predefined store staff roles available for assignment
 * These match the Prisma Role enum
 */
export const PREDEFINED_STORE_ROLES = [
  'STORE_ADMIN',
  'SALES_MANAGER',
  'INVENTORY_MANAGER',
  'CUSTOMER_SERVICE',
  'CONTENT_MANAGER',
  'MARKETING_MANAGER',
  'DELIVERY_BOY',
] as const;

/**
 * Role priority for organization memberships
 * Higher values indicate higher priority
 */
export const ORG_ROLE_PRIORITY: Record<string, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

/**
 * Role priority for store staff
 * Higher values indicate higher priority
 */
export const STORE_ROLE_PRIORITY: Record<string, number> = {
  STORE_ADMIN: 4,
  SALES_MANAGER: 3,
  INVENTORY_MANAGER: 2,
  CUSTOMER_SERVICE: 2,
  CONTENT_MANAGER: 2,
  MARKETING_MANAGER: 2,
  DELIVERY_BOY: 1,
};

/**
 * Default notification fetch limit
 */
export const DEFAULT_NOTIFICATION_LIMIT = 10;
