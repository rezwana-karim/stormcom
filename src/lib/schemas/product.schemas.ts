// src/lib/schemas/product.schemas.ts
// Zod schemas for Product API request/response validation

import { z } from 'zod';
import { ProductStatus, InventoryStatus } from '@prisma/client';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

/**
 * Pagination response schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1),
  perPage: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

/**
 * Error response schema
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  details: z.array(z.object({
    code: z.string().optional(),
    message: z.string(),
    path: z.array(z.union([z.string(), z.number()])).optional(),
  })).optional(),
});

// ============================================================================
// VARIANT SCHEMAS
// ============================================================================

/**
 * Product variant schema
 */
export const variantResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  barcode: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  compareAtPrice: z.number().nullable().optional(),
  inventoryQty: z.number().int(),
  lowStockThreshold: z.number().int(),
  weight: z.number().nullable().optional(),
  image: z.string().nullable().optional(),
  options: z.string(),
  isDefault: z.boolean(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

/**
 * Variant create input schema
 */
export const variantCreateSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  barcode: z.string().max(100).optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  compareAtPrice: z.number().min(0).optional().nullable(),
  inventoryQty: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  weight: z.number().min(0).optional().nullable(),
  image: z.string().url().optional().nullable(),
  options: z.union([z.string(), z.record(z.string(), z.string())]).default('{}'),
  isDefault: z.boolean().default(false),
});

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

/**
 * Category reference schema
 */
export const categoryRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
}).nullable().optional();

/**
 * Brand reference schema
 */
export const brandRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
}).nullable().optional();

/**
 * Product attribute value schema (for custom attributes)
 */
export const productAttributeValueSchema = z.object({
  id: z.string(),
  attributeId: z.string(),
  value: z.string(),
  attribute: z.object({
    id: z.string(),
    name: z.string(),
    values: z.string(), // JSON array of possible values
  }).optional(),
});

/**
 * Product response schema
 */
export const productResponseSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  price: z.number(),
  compareAtPrice: z.number().nullable().optional(),
  costPrice: z.number().nullable().optional(),
  sku: z.string(),
  barcode: z.string().nullable().optional(),
  trackInventory: z.boolean(),
  inventoryQty: z.number().int(),
  lowStockThreshold: z.number().int(),
  inventoryStatus: z.nativeEnum(InventoryStatus),
  weight: z.number().nullable().optional(),
  length: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  category: categoryRefSchema,
  brandId: z.string().nullable().optional(),
  brand: brandRefSchema,
  images: z.array(z.string()),
  thumbnailUrl: z.string().nullable().optional(),
  // SEO fields
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  metaKeywords: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  status: z.nativeEnum(ProductStatus),
  publishedAt: z.union([z.date(), z.string()]).nullable().optional(),
  archivedAt: z.union([z.date(), z.string()]).nullable().optional(),
  isFeatured: z.boolean(),
  variants: z.array(variantResponseSchema).optional(),
  attributes: z.array(productAttributeValueSchema).optional(),
  _count: z.object({
    orderItems: z.number().int(),
    reviews: z.number().int(),
  }).optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  deletedAt: z.union([z.date(), z.string()]).nullable().optional(),
});

/**
 * Product create request schema
 * Note: storeId is NOT included here - it should be derived from the authenticated
 * user's context (session) in route handlers to prevent tenant spoofing attacks.
 * The storeId is passed separately to the service layer.
 */
export const productCreateSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  sku: z.string().min(1).max(100),
  barcode: z.string().max(100).optional().nullable(),
  trackInventory: z.boolean().default(true),
  inventoryQty: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  weight: z.number().min(0).optional().nullable(),
  length: z.number().min(0).optional().nullable(),
  width: z.number().min(0).optional().nullable(),
  height: z.number().min(0).optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  brandId: z.string().cuid().optional().nullable(),
  images: z.array(z.string().url()).default([]),
  thumbnailUrl: z.string().url().optional().nullable(),
  // SEO fields
  metaTitle: z.string().max(255).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  metaKeywords: z.string().optional().nullable(),
  seoTitle: z.string().max(255).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  isFeatured: z.boolean().default(false),
  variants: z.array(variantCreateSchema).min(0).max(100).optional(),
  // Product attributes (custom attributes)
  attributes: z.array(z.object({
    attributeId: z.string().cuid(),
    value: z.string().min(1),
  })).optional(),
});

/**
 * Product update request schema
 */
export const productUpdateSchema = productCreateSchema.partial();

/**
 * Product list response schema
 */
export const productListResponseSchema = z.object({
  products: z.array(productResponseSchema),
  pagination: paginationSchema,
});

// ============================================================================
// BULK IMPORT SCHEMAS
// ============================================================================

/**
 * Import result schema
 */
export const importResultSchema = z.object({
  success: z.boolean(),
  imported: z.number().int().min(0),
  total: z.number().int().min(0),
  errors: z.array(z.object({
    row: z.number().int(),
    error: z.string(),
  })),
});

// ============================================================================
// IMAGE UPLOAD SCHEMAS
// ============================================================================

/**
 * Single image upload response schema
 */
export const imageUploadResponseSchema = z.object({
  success: z.boolean(),
  url: z.string(),
  filename: z.string(),
  originalName: z.string(),
  size: z.number().int(),
  type: z.string(),
});

/**
 * Multiple image upload response schema
 */
export const imagesUploadResponseSchema = z.object({
  success: z.boolean(),
  uploaded: z.number().int().min(0),
  total: z.number().int().min(0),
  urls: z.array(z.string()),
  results: z.array(z.object({
    success: z.boolean(),
    url: z.string().optional(),
    filename: z.string().optional(),
    originalName: z.string(),
    error: z.string().optional(),
  })),
});

// ============================================================================
// DELETE RESPONSE SCHEMA
// ============================================================================

/**
 * Delete response schema
 */
export const deleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  deletedAt: z.string().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ProductResponse = z.infer<typeof productResponseSchema>;
export type ProductCreateRequest = z.infer<typeof productCreateSchema>;
export type ProductUpdateRequest = z.infer<typeof productUpdateSchema>;
export type ProductListResponse = z.infer<typeof productListResponseSchema>;
export type VariantResponse = z.infer<typeof variantResponseSchema>;
export type VariantCreateRequest = z.infer<typeof variantCreateSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;
export type ImageUploadResponse = z.infer<typeof imageUploadResponseSchema>;
export type ImagesUploadResponse = z.infer<typeof imagesUploadResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type DeleteResponse = z.infer<typeof deleteResponseSchema>;
export type ProductAttributeValue = z.infer<typeof productAttributeValueSchema>;
