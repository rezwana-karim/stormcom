// src/lib/services/product.service.ts
// Product Management Service for StormCom E-commerce Platform
// Provides CRUD operations, validation, and business logic for products with multi-tenant isolation

import { prisma } from "@/lib/prisma";
import { 
  Product, 
  ProductVariant, 
  ProductStatus,
  InventoryStatus,
  Prisma 
} from "@prisma/client";
import { z } from "zod";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ProductWithRelations extends Product {
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variants: ProductVariant[];
  _count?: {
    orderItems: number;
    reviews: number;
  };
}

export interface ProductSearchFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inventoryStatus?: InventoryStatus;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListResult {
  products: ProductWithRelations[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Variant validation schema
export const variantSchema = z.object({
  id: z.string().cuid().optional(), // Optional for new variants
  name: z.string().min(1, "Variant name is required").max(255),
  sku: z.string().min(1, "Variant SKU is required").max(100),
  barcode: z.string().max(100).optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  compareAtPrice: z.number().min(0).optional().nullable(),
  inventoryQty: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  weight: z.number().min(0).optional().nullable(),
  image: z.string().min(1).optional().nullable().refine((v) => {
    if (!v) return true;
    try {
      // Accept absolute URLs
      // eslint-disable-next-line no-new
      new URL(v);
      return true;
    } catch {
      // Accept relative paths starting with '/'
      return typeof v === 'string' && v.startsWith('/');
    }
  }, { message: 'Invalid image URL' }),
  options: z.union([z.string(), z.record(z.string(), z.string())]).default("{}"), // JSON string or object
  isDefault: z.boolean().default(false),
});

export type VariantData = z.infer<typeof variantSchema>;

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  slug: z.string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")
    .optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  price: z.number().min(0, "Price must be non-negative"),
  compareAtPrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  sku: z.string().min(1, "SKU is required").max(100),
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
  images: z.array(z.string().min(1).refine((v) => {
    try {
      // Accept absolute URLs
      // eslint-disable-next-line no-new
      new URL(v);
      return true;
    } catch {
      // Accept relative paths starting with '/'
      return typeof v === 'string' && v.startsWith('/');
    }
  }, { message: 'Invalid image URL' })).default([]),
  thumbnailUrl: z.string().url().optional().nullable(),
  // SEO fields
  metaTitle: z.string().max(255).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  metaKeywords: z.string().optional().nullable(),
  seoTitle: z.string().max(255).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  isFeatured: z.boolean().default(false),
  // Variants support (min 0, max 100)
  variants: z.array(variantSchema).min(0).max(100).optional(),
  // Product attributes (custom attributes)
  attributes: z.array(z.object({
    attributeId: z.string().cuid(),
    value: z.string().min(1),
  })).optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().cuid(),
});

export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;

// ============================================================================
// PRODUCT SERVICE CLASS
// ============================================================================

export class ProductService {
  private static instance: ProductService;

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Get products with filtering, pagination, and search
   * @param storeId - Store ID for multi-tenant isolation
   * @param filters - Search and filter options
   * @param page - Page number (1-indexed)
   * @param perPage - Items per page
   */
  async getProducts(
    storeId: string,
    filters: ProductSearchFilters = {},
    page: number = 1,
    perPage: number = 10
  ): Promise<ProductListResult> {
    const where = this.buildWhereClause(storeId, filters);
    const orderBy = this.buildOrderByClause(filters.sortBy, filters.sortOrder);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          brand: {
            select: { id: true, name: true, slug: true },
          },
          variants: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              inventoryQty: true,
              isDefault: true,
              image: true,
            },
            orderBy: { isDefault: 'desc' },
          },
          _count: {
            select: {
              orderItems: true,
              reviews: true,
            },
          },
        },
        orderBy,
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      prisma.product.count({ where }),
    ]);

    const normalized = products.map((p) => this.normalizeProductFields(p));

    return {
      products: normalized as unknown as ProductWithRelations[],
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get single product by ID with full relations
   * @param productId - Product ID
   * @param storeId - Store ID for multi-tenant isolation
   */
  async getProductById(
    productId: string,
    storeId: string
  ): Promise<ProductWithRelations | null> {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
        deletedAt: null,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            price: true,
            compareAtPrice: true,
            inventoryQty: true,
            lowStockThreshold: true,
            weight: true,
            image: true,
            options: true,
            isDefault: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { isDefault: 'desc' },
        },
        attributes: {
          select: {
            id: true,
            productId: true,
            attributeId: true,
            value: true,
            attribute: {
              select: {
                id: true,
                name: true,
                values: true,
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          },
        },
      },
    });

    if (!product) return null;

    return this.normalizeProductFields(product) as unknown as ProductWithRelations;
  }

  /**
   * Get product by slug
   * @param slug - Product slug
   * @param storeId - Store ID for multi-tenant isolation
   */
  async getProductBySlug(
    slug: string,
    storeId: string
  ): Promise<ProductWithRelations | null> {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        storeId,
        deletedAt: null,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            inventoryQty: true,
            isDefault: true,
            image: true,
          },
          orderBy: { isDefault: 'desc' },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          },
        },
      },
    });

    if (!product) return null;

    return this.normalizeProductFields(product) as unknown as ProductWithRelations;
  }

  /**
   * Get total product count for a store
   * @param storeId - Store ID
   */
  async getTotalProductCount(storeId: string): Promise<number> {
    return prisma.product.count({
      where: {
        storeId,
        deletedAt: null,
      },
    });
  }

  /**
   * Get low stock products
   * @param storeId - Store ID
   * @param limit - Maximum number of products to return
   */
  async getLowStockProducts(
    storeId: string,
    limit: number = 10
  ): Promise<ProductWithRelations[]> {
    const products = await prisma.product.findMany({
      where: {
        storeId,
        deletedAt: null,
        trackInventory: true,
        inventoryStatus: {
          in: [InventoryStatus.LOW_STOCK, InventoryStatus.OUT_OF_STOCK],
        },
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: true,
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        inventoryQty: 'asc',
      },
      take: limit,
    });

    return products.map((p) => this.normalizeProductFields(p)) as unknown as ProductWithRelations[];
  }

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Create a new product
   * @param storeId - Store ID for multi-tenant isolation
   * @param data - Product creation data
   */
  async createProduct(
    storeId: string,
    data: CreateProductData
  ): Promise<ProductWithRelations> {
    // Validate input
    const validatedData = createProductSchema.parse(data);

    // Generate slug if not provided
    const slug = validatedData.slug || 
      await this.generateUniqueSlug(storeId, validatedData.name);

    // Validate business rules
    await this.validateBusinessRules(storeId, { ...validatedData, slug });

    // Calculate inventory status
    const inventoryStatus = this.calculateInventoryStatus(
      validatedData.inventoryQty,
      validatedData.lowStockThreshold
    );

    // Prepare product data
    const productData: Prisma.ProductCreateInput = {
      store: { connect: { id: storeId } },
      name: validatedData.name,
      slug,
      description: validatedData.description,
      shortDescription: validatedData.shortDescription,
      price: validatedData.price,
      compareAtPrice: validatedData.compareAtPrice,
      costPrice: validatedData.costPrice,
      sku: validatedData.sku,
      barcode: validatedData.barcode,
      trackInventory: validatedData.trackInventory,
      inventoryQty: validatedData.inventoryQty,
      lowStockThreshold: validatedData.lowStockThreshold,
      inventoryStatus,
      weight: validatedData.weight,
      length: validatedData.length,
      width: validatedData.width,
      height: validatedData.height,
      images: JSON.stringify(validatedData.images),
      thumbnailUrl: validatedData.thumbnailUrl || validatedData.images[0] || null,
      // SEO fields
      metaTitle: validatedData.metaTitle,
      metaDescription: validatedData.metaDescription,
      metaKeywords: validatedData.metaKeywords,
      seoTitle: validatedData.seoTitle,
      seoDescription: validatedData.seoDescription,
      status: validatedData.status,
      publishedAt: validatedData.status === ProductStatus.ACTIVE ? new Date() : null,
      isFeatured: validatedData.isFeatured,
    };

    // Connect category if provided
    if (validatedData.categoryId) {
      productData.category = { connect: { id: validatedData.categoryId } };
    }

    // Connect brand if provided
    if (validatedData.brandId) {
      productData.brand = { connect: { id: validatedData.brandId } };
    }

    // Add variants if provided
    if (validatedData.variants && validatedData.variants.length > 0) {
      // Validate variant SKUs are unique
      await this.validateVariantSkus(validatedData.variants.map(v => v.sku));
      
      productData.variants = {
        create: validatedData.variants.map((variant, index) => ({
          name: variant.name,
          sku: variant.sku,
          barcode: variant.barcode,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          inventoryQty: variant.inventoryQty ?? 0,
          lowStockThreshold: variant.lowStockThreshold ?? 5,
          weight: variant.weight,
          image: variant.image,
          options: typeof variant.options === 'string' ? variant.options : JSON.stringify(variant.options),
          isDefault: variant.isDefault ?? (index === 0), // First variant is default if not specified
        })),
      };
    }

    // Add product attributes if provided
    if (validatedData.attributes && validatedData.attributes.length > 0) {
      productData.attributes = {
        create: validatedData.attributes.map(attr => ({
          attribute: { connect: { id: attr.attributeId } },
          value: attr.value,
        })),
      };
    }

    const product = await prisma.product.create({
      data: productData,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: true,
        attributes: {
          select: {
            id: true,
            productId: true,
            attributeId: true,
            value: true,
            attribute: {
              select: {
                id: true,
                name: true,
                values: true,
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          },
        },
      },
    });

    return this.normalizeProductFields(product) as unknown as ProductWithRelations;
  }

  /**
   * Update an existing product
   * @param productId - Product ID
   * @param storeId - Store ID for multi-tenant isolation
   * @param data - Partial product update data
   */
  async updateProduct(
    productId: string,
    storeId: string,
    data: Partial<CreateProductData>
  ): Promise<ProductWithRelations> {
    // Validate input
    const validatedData = updateProductSchema.parse({ ...data, id: productId });

    // Check if product exists
    const existingProduct = await this.getProductById(productId, storeId);
    if (!existingProduct) {
      throw new Error("Product not found");
    }

    // Generate new slug if name changed but slug not provided
    if (validatedData.name && validatedData.name !== existingProduct.name && !validatedData.slug) {
      validatedData.slug = await this.generateUniqueSlug(storeId, validatedData.name, productId);
    }

    // Validate business rules
    await this.validateBusinessRules(storeId, validatedData, productId);

    // Calculate inventory status if quantity changed
    let inventoryStatus = existingProduct.inventoryStatus;
    if (validatedData.inventoryQty !== undefined) {
      const lowStockThreshold = validatedData.lowStockThreshold ?? existingProduct.lowStockThreshold;
      inventoryStatus = this.calculateInventoryStatus(validatedData.inventoryQty, lowStockThreshold);
    }

    // Prepare update data (exclude JSON fields like images, variants, and attributes from direct spread to satisfy Prisma types)
    const validatedProductData = validatedData as UpdateProductData & {
      images?: string[];
      variants?: VariantData[];
      attributes?: { attributeId: string; value: string }[];
    };
    const {
      images: imagesArr,
      variants: variantsArr,
      attributes: attributesArr,
      ...rest
    } = validatedProductData;
    const updateData: Prisma.ProductUpdateInput = {
      ...rest,
      inventoryStatus,
    };

    // Handle JSON fields
    if (imagesArr) {
      updateData.images = JSON.stringify(imagesArr);
      if (!updateData.thumbnailUrl && imagesArr.length > 0) {
        updateData.thumbnailUrl = imagesArr[0];
      }
    }

    // Handle status change
    if (validatedData.status === ProductStatus.ACTIVE && !existingProduct.publishedAt) {
      updateData.publishedAt = new Date();
    } else if (validatedData.status && validatedData.status !== ProductStatus.ACTIVE) {
      updateData.publishedAt = null;
    }

    // Handle category and brand connections
    if (validatedData.categoryId !== undefined) {
      updateData.category = validatedData.categoryId 
        ? { connect: { id: validatedData.categoryId } }
        : { disconnect: true };
    }

    if (validatedData.brandId !== undefined) {
      updateData.brand = validatedData.brandId
        ? { connect: { id: validatedData.brandId } }
        : { disconnect: true };
    }

    // Handle variants update
    if (variantsArr !== undefined) {
      // Get existing variant IDs for the product
      const existingVariants = await prisma.productVariant.findMany({
        where: { productId },
        select: { id: true, sku: true },
      });
      const existingVariantIds = new Set(existingVariants.map(v => v.id));
      const existingVariantSkus = new Map(existingVariants.map(v => [v.id, v.sku]));

      // Separate variants into updates and creates
      const variantsToUpdate = variantsArr.filter(v => v.id && existingVariantIds.has(v.id));
      const variantsToCreate = variantsArr.filter(v => !v.id);
      const variantIdsToKeep = new Set(variantsToUpdate.map(v => v.id));
      const variantIdsToDelete = existingVariants
        .filter(v => !variantIdsToKeep.has(v.id))
        .map(v => v.id);

      // Validate variant SKUs for new variants
      const newVariantSkus = variantsToCreate.map(v => v.sku);
      if (newVariantSkus.length > 0) {
        await this.validateVariantSkus(newVariantSkus, productId);
      }

      // Validate SKU changes for existing variants being updated
      // Only check SKUs that are actually changing
      const changedSkuVariants = variantsToUpdate.filter(v => {
        const oldSku = existingVariantSkus.get(v.id!);
        return oldSku !== v.sku;
      });
      
      if (changedSkuVariants.length > 0) {
        const changedSkus = changedSkuVariants.map(v => v.sku);
        // Check if any changed SKU conflicts with other variants (excluding the ones being updated)
        const variantIdsBeingUpdated = changedSkuVariants.map(v => v.id!);
        await this.validateVariantSkusForUpdate(changedSkus, productId, variantIdsBeingUpdated);
      }

      // Check for duplicate SKUs within the request itself (new + updated)
      const allRequestSkus = [...newVariantSkus, ...variantsToUpdate.map(v => v.sku)];
      const uniqueRequestSkus = new Set(allRequestSkus);
      if (uniqueRequestSkus.size !== allRequestSkus.length) {
        const duplicates = allRequestSkus.filter((sku, index) => allRequestSkus.indexOf(sku) !== index);
        throw new Error(`Duplicate variant SKUs in request: ${[...new Set(duplicates)].join(', ')}`);
      }

      /**
       * Transactional Guarantee:
       * Variant and attribute updates for a product are performed within a single transaction to ensure atomicity.
       * This means that either all changes to variants and attributes are applied together, or none are applied if any part fails.
       * This prevents inconsistent product state (e.g., variants updated but attributes not, or vice versa) which could lead to data integrity issues.
       * If any operation within the transaction fails (such as a constraint violation or a database error), all changes are rolled back.
       * Keeping these updates atomic is critical for e-commerce correctness, especially in multi-tenant environments.
       */
      await prisma.$transaction(async (tx) => {
        // Delete variants that are no longer in the list
        if (variantIdsToDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: { id: { in: variantIdsToDelete } },
          });
        }

        // Update existing variants individually (updateMany can't handle different data per record)
        for (const variant of variantsToUpdate) {
          await tx.productVariant.update({
            where: { id: variant.id! },
            data: {
              name: variant.name,
              sku: variant.sku,
              barcode: variant.barcode,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              inventoryQty: variant.inventoryQty ?? 0,
              lowStockThreshold: variant.lowStockThreshold ?? 5,
              weight: variant.weight,
              image: variant.image,
              options: typeof variant.options === 'string' ? variant.options : JSON.stringify(variant.options),
              isDefault: variant.isDefault ?? false,
            },
          });
        }

        // Create new variants
        if (variantsToCreate.length > 0) {
          await tx.productVariant.createMany({
            data: variantsToCreate.map((variant, index) => ({
              productId,
              name: variant.name,
              sku: variant.sku,
              barcode: variant.barcode,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              inventoryQty: variant.inventoryQty ?? 0,
              lowStockThreshold: variant.lowStockThreshold ?? 5,
              weight: variant.weight,
              image: variant.image,
              options: typeof variant.options === 'string' ? variant.options : JSON.stringify(variant.options),
              isDefault: variant.isDefault ?? (variantsToUpdate.length === 0 && index === 0),
            })),
          });
        }

        // Handle attributes update within the same transaction
        if (attributesArr !== undefined) {
          // Delete existing attributes and create new ones
          await tx.productAttributeValue.deleteMany({
            where: { productId },
          });
          
          if (attributesArr.length > 0) {
            await tx.productAttributeValue.createMany({
              data: attributesArr.map(attr => ({
                productId,
                attributeId: attr.attributeId,
                value: attr.value,
              })),
            });
          }
        }
      });
    } else if (attributesArr !== undefined) {
      // Handle attributes update when no variants are being updated
      await prisma.$transaction(async (tx) => {
        await tx.productAttributeValue.deleteMany({
          where: { productId },
        });
        
        if (attributesArr.length > 0) {
          await tx.productAttributeValue.createMany({
            data: attributesArr.map(attr => ({
              productId,
              attributeId: attr.attributeId,
              value: attr.value,
            })),
          });
        }
      });
    }

    // Remove id from update data
    delete updateData.id;

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            inventoryQty: true,
            isDefault: true,
            image: true,
          },
          orderBy: { isDefault: 'desc' },
        },
        attributes: {
          select: {
            id: true,
            productId: true,
            attributeId: true,
            value: true,
            attribute: {
              select: {
                id: true,
                name: true,
                values: true,
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          },
        },
      },
    });

    return this.normalizeProductFields(product) as unknown as ProductWithRelations;
  }

  /**
   * Soft delete a product
   * @param productId - Product ID
   * @param storeId - Store ID for multi-tenant isolation
   */
  async deleteProduct(productId: string, storeId: string): Promise<void> {
    const product = await this.getProductById(productId, storeId);
    if (!product) {
      throw new Error("Product not found");
    }

    await prisma.product.update({
      where: { id: productId },
      data: { 
        deletedAt: new Date(),
        status: ProductStatus.ARCHIVED,
      },
    });
  }

  /**
   * Permanently delete a product (admin only)
   * @param productId - Product ID
   * @param storeId - Store ID for multi-tenant isolation
   */
  async permanentlyDeleteProduct(productId: string, storeId: string): Promise<void> {
    const product = await this.getProductById(productId, storeId);
    if (!product) {
      throw new Error("Product not found");
    }

    await prisma.product.delete({
      where: { id: productId },
    });
  }

  /**
   * Restore a soft-deleted product
   * @param productId - Product ID
   * @param storeId - Store ID for multi-tenant isolation
   */
  async restoreProduct(productId: string, storeId: string): Promise<ProductWithRelations> {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
        deletedAt: { not: null },
      },
    });

    if (!product) {
      throw new Error("Product not found or not deleted");
    }

    const restored = await prisma.product.update({
      where: { id: productId },
      data: { 
        deletedAt: null,
        status: ProductStatus.DRAFT,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: true,
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          },
        },
      },
    });

    return this.normalizeProductFields(restored) as unknown as ProductWithRelations;
  }

  // --------------------------------------------------------------------------
  // INVENTORY MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Update product inventory
   * @param productId - Product ID
   * @param storeId - Store ID for multi-tenant isolation
   * @param quantity - New inventory quantity
   * @param reason - Reason for inventory adjustment
   */
  async updateInventory(
    productId: string,
    storeId: string,
    quantity: number,
    reason: string = "Manual adjustment"
  ): Promise<ProductWithRelations> {
    const product = await this.getProductById(productId, storeId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.trackInventory) {
      throw new Error("Inventory tracking is disabled for this product");
    }

    const newQuantity = Math.max(0, quantity);
    const inventoryStatus = this.calculateInventoryStatus(
      newQuantity,
      product.lowStockThreshold
    );

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        inventoryQty: newQuantity,
        inventoryStatus,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            inventoryQty: true,
            isDefault: true,
            image: true,
          },
          orderBy: { isDefault: 'desc' },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          },
        },
      },
    });

    return this.normalizeProductFields(updatedProduct) as unknown as ProductWithRelations;
  }

  /**
   * Adjust inventory by delta (add or subtract)
   * @param productId - Product ID
   * @param storeId - Store ID for multi-tenant isolation
   * @param delta - Quantity to add (positive) or subtract (negative)
   */
  async adjustInventory(
    productId: string,
    storeId: string,
    delta: number
  ): Promise<ProductWithRelations> {
    const product = await this.getProductById(productId, storeId);
    if (!product) {
      throw new Error("Product not found");
    }

    const newQuantity = Math.max(0, product.inventoryQty + delta);
    return this.updateInventory(
      productId,
      storeId,
      newQuantity,
      `Adjusted by ${delta > 0 ? '+' : ''}${delta}`
    );
  }

  /**
   * Decrease product stock (for order fulfillment)
   * @param productId - Product ID
   * @param storeId - Store ID for multi-tenant isolation
   * @param quantity - Quantity to decrease
   */
  async decreaseStock(
    productId: string,
    storeId: string,
    quantity: number
  ): Promise<ProductWithRelations> {
    const product = await this.getProductById(productId, storeId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.trackInventory) {
      throw new Error("Inventory tracking is disabled for this product");
    }

    const newStock = product.inventoryQty - quantity;
    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }

    return this.updateInventory(
      productId,
      storeId,
      newStock,
      `Stock decreased by ${quantity} (order fulfillment)`
    );
  }

  /**
   * Increase product stock (for returns or restocking)
   * @param productId - Product ID
   * @param storeId - Store ID for multi-tenant isolation
   * @param quantity - Quantity to increase
   */
  async increaseStock(
    productId: string,
    storeId: string,
    quantity: number
  ): Promise<ProductWithRelations> {
    const product = await this.getProductById(productId, storeId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.trackInventory) {
      throw new Error("Inventory tracking is disabled for this product");
    }

    const newStock = product.inventoryQty + quantity;
    return this.updateInventory(
      productId,
      storeId,
      newStock,
      `Stock increased by ${quantity}`
    );
  }

  /**
   * Check if product is in stock for given quantity
   * @param productId - Product ID
   * @param storeId - Store ID for multi-tenant isolation
   * @param quantity - Quantity to check
   */
  async isInStock(
    productId: string,
    storeId: string,
    quantity: number
  ): Promise<boolean> {
    const product = await this.getProductById(productId, storeId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.trackInventory) {
      return true; // Products without inventory tracking are always "in stock"
    }

    return product.inventoryQty >= quantity;
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Normalize product fields from database format to application format
   * Parses JSON strings for images and metaKeywords
   */
  // Accept raw DB product payloads (which may not strictly match ProductWithRelations)
  // and normalize fields (images JSON, thumbnails). Return a loose any which
  // callers cast to ProductWithRelations as needed.
  private normalizeProductFields(product: unknown): unknown {
    if (!product) return product;

    const p = { ...(product as Record<string, unknown>) } as Record<string, unknown>;

    // Normalize images: JSON string -> string[]
    try {
      if (typeof p.images === 'string') {
        const parsed = JSON.parse(p.images);
        p.images = Array.isArray(parsed) ? parsed : (p.images ? [p.images] : []);
      } else if (!Array.isArray(p.images)) {
        p.images = [];
      }
    } catch (e) {
      p.images = p.images ? [String(p.images)] : [];
    }

    // Ensure thumbnailUrl falls back to first image
    if ((!p.thumbnailUrl || p.thumbnailUrl === '') && Array.isArray(p.images) && p.images.length > 0) {
      p.thumbnailUrl = p.images[0];
    }

    return p;
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(
    storeId: string,
    filters: ProductSearchFilters
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      storeId,
      deletedAt: null,
    };

    if (filters.search) {
      // SQLite doesn't support mode parameter, case sensitivity handled at DB level
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
        { sku: { contains: filters.search } },
      ];
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.brandId) {
      where.brandId = filters.brandId;
    }

    if (filters.status !== undefined && filters.status !== null) {
      where.status = filters.status;
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    if (filters.inventoryStatus !== undefined && filters.inventoryStatus !== null) {
      where.inventoryStatus = filters.inventoryStatus;
    }

    return where;
  }

  /**
   * Build Prisma orderBy clause
   */
  private buildOrderByClause(
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc'
  ): Prisma.ProductOrderByWithRelationInput {
    const validSortFields = ['name', 'price', 'createdAt', 'updatedAt'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    return { [field]: order };
  }

  /**
   * Generate unique slug for product
   */
  private async generateUniqueSlug(
    storeId: string,
    name: string,
    excludeId?: string
  ): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.product.findFirst({
        where: {
          storeId,
          slug,
          deletedAt: null,
          ...(excludeId && { id: { not: excludeId } }),
        },
        select: { id: true },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Calculate inventory status based on quantity and threshold
   */
  private calculateInventoryStatus(
    quantity: number,
    lowStockThreshold: number
  ): InventoryStatus {
    if (quantity === 0) {
      return InventoryStatus.OUT_OF_STOCK;
    } else if (quantity <= lowStockThreshold) {
      return InventoryStatus.LOW_STOCK;
    } else {
      return InventoryStatus.IN_STOCK;
    }
  }

  /**
   * Validate business rules for product creation/update
   */
  private async validateBusinessRules(
    storeId: string,
    data: Partial<CreateProductData> & { slug?: string },
    excludeId?: string
  ): Promise<void> {
    // Run all validation queries in parallel for performance
    const [skuExists, slugExists, categoryExists, brandExists] = await Promise.all([
      // Check SKU uniqueness
      data.sku
        ? prisma.product.findFirst({
            where: {
              storeId,
              sku: data.sku,
              deletedAt: null,
              ...(excludeId && { id: { not: excludeId } }),
            },
            select: { id: true },
          })
        : Promise.resolve(null),

      // Check slug uniqueness
      data.slug
        ? prisma.product.findFirst({
            where: {
              storeId,
              slug: data.slug,
              deletedAt: null,
              ...(excludeId && { id: { not: excludeId } }),
            },
            select: { id: true },
          })
        : Promise.resolve(null),

      // Validate category exists
      data.categoryId
        ? prisma.category.findFirst({
            where: {
              id: data.categoryId,
              storeId,
              deletedAt: null,
            },
            select: { id: true },
          })
        : Promise.resolve(null),

      // Validate brand exists
      data.brandId
        ? prisma.brand.findFirst({
            where: {
              id: data.brandId,
              storeId,
              deletedAt: null,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    // Check validation results
    if (data.sku && skuExists) {
      throw new Error(`SKU '${data.sku}' already exists in this store`);
    }

    if (data.slug && slugExists) {
      throw new Error(`Slug '${data.slug}' already exists in this store`);
    }

    if (data.categoryId && !categoryExists) {
      throw new Error("Category not found");
    }

    if (data.brandId && !brandExists) {
      throw new Error("Brand not found");
    }

    // Validate price constraints
    if (
      data.price !== undefined &&
      data.compareAtPrice !== undefined &&
      data.compareAtPrice !== null
    ) {
      if (data.compareAtPrice <= data.price) {
        throw new Error("Compare at price must be greater than regular price");
      }
    }
  }

  /**
   * Validate that variant SKUs are unique globally
   * @param skus - Array of SKUs to validate
   * @param excludeProductId - Product ID to exclude from validation (for updates)
   */
  private async validateVariantSkus(skus: string[], excludeProductId?: string): Promise<void> {
    if (skus.length === 0) return;

    // Check for duplicate SKUs in the input array itself
    const uniqueSkus = new Set(skus);
    if (uniqueSkus.size !== skus.length) {
      const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index);
      throw new Error(`Duplicate variant SKUs provided: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Check if any SKU already exists in the database
    const existingVariants = await prisma.productVariant.findMany({
      where: {
        sku: { in: skus },
        ...(excludeProductId && { productId: { not: excludeProductId } }),
      },
      select: { sku: true },
    });

    if (existingVariants.length > 0) {
      const existingSkus = existingVariants.map(v => v.sku);
      throw new Error(`Variant SKUs already exist: ${existingSkus.join(', ')}`);
    }
  }

  /**
   * Validate that updated variant SKUs don't conflict with other variants
   * This is used when existing variants change their SKU value
   * @param skus - Array of new SKU values for variants being updated
   * @param productId - Product ID the variants belong to
   * @param excludeVariantIds - Variant IDs to exclude (the ones being updated)
   */
  private async validateVariantSkusForUpdate(
    skus: string[], 
    productId: string, 
    excludeVariantIds: string[]
  ): Promise<void> {
    if (skus.length === 0) return;

    // Check if any of the new SKUs conflict with existing variants
    // (excluding the variants that are being updated themselves)
    const conflictingVariants = await prisma.productVariant.findMany({
      where: {
        sku: { in: skus },
        id: { notIn: excludeVariantIds },
      },
      select: { sku: true },
    });

    if (conflictingVariants.length > 0) {
      const conflictingSkus = conflictingVariants.map(v => v.sku);
      throw new Error(`Cannot update variant SKU(s) - already in use: ${conflictingSkus.join(', ')}`);
    }
  }

  // --------------------------------------------------------------------------
  // CONVENIENCE ALIASES
  // --------------------------------------------------------------------------

  /**
   * Alias for createProduct
   */
  async create(storeId: string, data: CreateProductData): Promise<ProductWithRelations> {
    return this.createProduct(storeId, data);
  }

  /**
   * Alias for getProductById
   */
  async getById(storeId: string, productId: string): Promise<ProductWithRelations | null> {
    return this.getProductById(productId, storeId);
  }

  /**
   * Alias for updateProduct
   */
  async update(
    storeId: string,
    productId: string,
    data: Partial<CreateProductData>
  ): Promise<ProductWithRelations> {
    return this.updateProduct(productId, storeId, data);
  }

  /**
   * Alias for deleteProduct
   */
  async delete(storeId: string, productId: string): Promise<void> {
    return this.deleteProduct(productId, storeId);
  }

  /**
   * Alias for getProducts with simplified parameters
   */
  async list(
    storeId: string,
    options: ProductSearchFilters & { page?: number; perPage?: number } = {}
  ): Promise<ProductListResult> {
    const { page = 1, perPage = 10, ...filters } = options;
    return this.getProducts(storeId, filters, page, perPage);
  }

  /**
   * Update product stock quantity (alias for updateInventory)
   */
  async updateStock(
    storeId: string,
    productId: string,
    quantity: number
  ): Promise<ProductWithRelations> {
    return this.updateInventory(productId, storeId, quantity, "Stock updated");
  }

  // --------------------------------------------------------------------------
  // BULK OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Bulk import products from parsed CSV data
   * @param storeId - Store ID for multi-tenant isolation
   * @param records - Array of product records to import
   * @returns Object containing imported count and any errors
   */
  async bulkImport(
    storeId: string,
    records: Array<{
      name: string;
      sku: string;
      price: number | string;
      description?: string;
      categoryId?: string;
      brandId?: string;
      inventoryQty?: number | string;
      status?: string;
      images?: string;
    }>
  ): Promise<{ imported: number; errors: Array<{ row: number; error: string }> }> {
    const errors: Array<{ row: number; error: string }> = [];
    let imported = 0;

    // Process in batches for better performance (batch size: 50)
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchStartRow = batchIndex * batchSize;

      // Prepare product creation data
      const productPromises = batch.map(async (record, index) => {
        const rowNumber = batchStartRow + index + 1;
        try {
          // Parse and validate record
          const price = typeof record.price === 'string' ? parseFloat(record.price) : record.price;
          const inventoryQty = record.inventoryQty 
            ? (typeof record.inventoryQty === 'string' ? parseInt(record.inventoryQty) : record.inventoryQty)
            : 0;

          if (isNaN(price) || price < 0) {
            throw new Error(`Invalid price: ${record.price}`);
          }

          // Parse images (comma-separated URLs or JSON array)
          let images: string[] = [];
          if (record.images) {
            try {
              images = JSON.parse(record.images);
            } catch {
              // Try comma-separated
              images = record.images.split(',').map(url => url.trim()).filter(url => url.length > 0);
            }
          }

          // Map status string to enum
          let status: ProductStatus = ProductStatus.DRAFT;
          if (record.status) {
            const statusUpper = record.status.toUpperCase();
            if (statusUpper === 'ACTIVE') status = ProductStatus.ACTIVE;
            else if (statusUpper === 'ARCHIVED') status = ProductStatus.ARCHIVED;
          }

          // Build product data object with all required fields explicitly defined
          // The createProductSchema has defaults, but we provide them here for type safety
          const productData: CreateProductData = {
            name: record.name,
            sku: record.sku,
            price,
            description: record.description,
            categoryId: record.categoryId || undefined,
            brandId: record.brandId || undefined,
            inventoryQty: isNaN(inventoryQty) ? 0 : inventoryQty,
            status,
            images,
            // Provide defaults for fields that have schema defaults
            trackInventory: true,
            lowStockThreshold: 5,
            isFeatured: false,
          };

          await this.createProduct(storeId, productData);
          return { success: true, row: rowNumber };
        } catch (error) {
          return { 
            success: false, 
            row: rowNumber, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      });

      const results = await Promise.all(productPromises);

      for (const result of results) {
        if (result.success) {
          imported++;
        } else {
          errors.push({ row: result.row, error: result.error || 'Unknown error' });
        }
      }
    }

    return { imported, errors };
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const productService = ProductService.getInstance();
