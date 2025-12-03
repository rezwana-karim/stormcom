/**
 * Prisma Select Helpers
 * 
 * Reusable field selection patterns for Prisma queries.
 * Helps reduce over-fetching and improve performance.
 */

/**
 * Basic user fields for listings
 * Use when you only need basic user info
 */
export const userBasicSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const;

/**
 * Extended user fields including status
 */
export const userExtendedSelect = {
  ...userBasicSelect,
  isSuperAdmin: true,
  accountStatus: true,
  createdAt: true,
} as const;

/**
 * Basic store fields for listings
 */
export const storeBasicSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
} as const;

/**
 * Extended store fields including settings
 */
export const storeExtendedSelect = {
  ...storeBasicSelect,
  domain: true,
  isActive: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Basic organization fields
 */
export const organizationBasicSelect = {
  id: true,
  name: true,
  slug: true,
  image: true,
} as const;

/**
 * Basic product fields for listings
 */
export const productListSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  compareAtPrice: true,
  images: true,
  isPublished: true,
  stock: true,
  lowStockThreshold: true,
} as const;

/**
 * Extended product fields for detail views
 */
export const productDetailSelect = {
  ...productListSelect,
  sku: true,
  barcode: true,
  weight: true,
  dimensions: true,
  categoryId: true,
  brandId: true,
  tags: true,
  metaTitle: true,
  metaDescription: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Basic category fields
 */
export const categoryBasicSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  isPublished: true,
} as const;

/**
 * Basic brand fields
 */
export const brandBasicSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  isPublished: true,
} as const;

/**
 * Basic order fields for listings
 */
export const orderListSelect = {
  id: true,
  orderNumber: true,
  status: true,
  total: true,
  customerEmail: true,
  customerName: true,
  createdAt: true,
} as const;

/**
 * Extended order fields for detail views
 */
export const orderDetailSelect = {
  ...orderListSelect,
  subtotal: true,
  tax: true,
  shipping: true,
  discount: true,
  shippingAddress: true,
  billingAddress: true,
  paymentMethod: true,
  notes: true,
  updatedAt: true,
} as const;

/**
 * Membership with organization select
 */
export const membershipWithOrgSelect = {
  id: true,
  role: true,
  userId: true,
  organizationId: true,
  createdAt: true,
  organization: {
    select: organizationBasicSelect,
  },
} as const;

/**
 * Store staff with store select
 */
export const storeStaffWithStoreSelect = {
  id: true,
  role: true,
  userId: true,
  storeId: true,
  isActive: true,
  createdAt: true,
  store: {
    select: storeBasicSelect,
  },
} as const;
