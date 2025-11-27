// src/lib/services/inventory.service.ts
// Inventory Management Service
// Handles stock tracking, adjustments, low stock alerts, and audit trails

import { prisma } from '@/lib/prisma';
import { caseInsensitiveStringFilter } from '@/lib/prisma-utils';
import { InventoryStatus, Prisma } from '@prisma/client';

// ============================================================================
// INVENTORY ADJUSTMENT REASON CODES
// ============================================================================

/**
 * Standardized reason codes for inventory adjustments
 * Used for analytics, auditing, and filtering inventory history
 */
export enum InventoryAdjustmentReason {
  ORDER_CREATED = 'order_created',
  ORDER_CANCELLED = 'order_cancelled',
  RETURN_PROCESSED = 'return_processed',
  MANUAL_ADJUSTMENT = 'manual_adjustment',
  DAMAGED = 'damaged',
  LOST = 'lost',
  FOUND = 'found',
  STOCK_TRANSFER = 'stock_transfer',
  RESTOCK = 'restock',
  INVENTORY_COUNT = 'inventory_count',
  EXPIRED = 'expired',
  THEFT = 'theft',
}

/**
 * Human-readable labels for reason codes
 */
export const InventoryAdjustmentReasonLabels: Record<InventoryAdjustmentReason, string> = {
  [InventoryAdjustmentReason.ORDER_CREATED]: 'Order Created',
  [InventoryAdjustmentReason.ORDER_CANCELLED]: 'Order Cancelled',
  [InventoryAdjustmentReason.RETURN_PROCESSED]: 'Return Processed',
  [InventoryAdjustmentReason.MANUAL_ADJUSTMENT]: 'Manual Adjustment',
  [InventoryAdjustmentReason.DAMAGED]: 'Damaged',
  [InventoryAdjustmentReason.LOST]: 'Lost',
  [InventoryAdjustmentReason.FOUND]: 'Found',
  [InventoryAdjustmentReason.STOCK_TRANSFER]: 'Stock Transfer',
  [InventoryAdjustmentReason.RESTOCK]: 'Restock',
  [InventoryAdjustmentReason.INVENTORY_COUNT]: 'Inventory Count',
  [InventoryAdjustmentReason.EXPIRED]: 'Expired',
  [InventoryAdjustmentReason.THEFT]: 'Theft',
};

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Options for retrieving inventory levels
 */
export interface GetInventoryOptions {
  search?: string;
  categoryId?: string;
  brandId?: string;
  lowStockOnly?: boolean;
  page?: number;
  perPage?: number;
}

/**
 * Stock adjustment details
 */
export interface StockAdjustment {
  productId: string;
  variantId?: string;
  quantity: number;
  type: 'ADD' | 'REMOVE' | 'SET';
  reason: InventoryAdjustmentReason | string;
  note?: string;
  userId?: string;
  orderId?: string;
}

/**
 * Bulk adjustment item for CSV imports
 */
export interface BulkAdjustmentItem {
  productId?: string;
  sku?: string;
  variantSku?: string;
  quantity: number;
  type: 'ADD' | 'REMOVE' | 'SET';
  reason: InventoryAdjustmentReason;
  note?: string;
}

/**
 * Bulk adjustment result
 */
export interface BulkAdjustmentResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ index: number; sku?: string; error: string }>;
}

/**
 * Inventory item with product details
 */
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  inventoryQty: number;
  lowStockThreshold: number;
  inventoryStatus: InventoryStatus;
  categoryName?: string;
  brandName?: string;
  updatedAt: Date;
}

/**
 * Inventory log entry
 */
export interface InventoryLogEntry {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  previousQty: number;
  newQty: number;
  changeQty: number;
  reason: string;
  reasonLabel: string;
  note?: string;
  userId?: string;
  userName?: string;
  orderId?: string;
  createdAt: Date;
}

/**
 * Low stock alert item
 */
export interface LowStockAlert {
  id: string;
  name: string;
  sku: string;
  inventoryQty: number;
  lowStockThreshold: number;
  inventoryStatus: InventoryStatus;
  categoryName?: string;
  brandName?: string;
  deficit: number; // How many units below threshold
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    inventoryQty: number;
    lowStockThreshold: number;
    deficit: number;
  }>;
}

// ============================================================================
// INVENTORY SERVICE
// ============================================================================

export class InventoryService {
  private static instance: InventoryService;

  private constructor() {}

  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  // ==========================================================================
  // INVENTORY QUERIES
  // ==========================================================================

  /**
   * Get inventory levels for a store with filters and pagination
   */
  async getInventoryLevels(
    storeId: string,
    options: GetInventoryOptions = {}
  ): Promise<{ items: InventoryItem[]; total: number }> {
    const {
      search,
      categoryId,
      brandId,
      lowStockOnly = false,
      page = 1,
      perPage = 20,
    } = options;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      storeId,
      deletedAt: null,
      trackInventory: true,
      AND: [],
    };

    if (search) {
      (where.AND as Prisma.ProductWhereInput[]).push({
        OR: [
          { name: caseInsensitiveStringFilter(search) },
          { sku: caseInsensitiveStringFilter(search) },
        ],
      });
    }

    if (categoryId) {
      (where.AND as Prisma.ProductWhereInput[]).push({ categoryId });
    }

    if (brandId) {
      (where.AND as Prisma.ProductWhereInput[]).push({ brandId });
    }

    if (lowStockOnly) {
      (where.AND as Prisma.ProductWhereInput[]).push({
        inventoryStatus: {
          in: [InventoryStatus.LOW_STOCK, InventoryStatus.OUT_OF_STOCK],
        },
      });
    }

    // Remove empty AND array
    if ((where.AND as Prisma.ProductWhereInput[]).length === 0) {
      delete where.AND;
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Get paginated products
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        inventoryQty: true,
        lowStockThreshold: true,
        inventoryStatus: true,
        updatedAt: true,
        category: {
          select: { name: true },
        },
        brand: {
          select: { name: true },
        },
      },
      orderBy: [
        { inventoryStatus: 'asc' }, // LOW_STOCK, OUT_OF_STOCK first
        { inventoryQty: 'asc' }, // Then by lowest stock
      ],
      skip: (page - 1) * perPage,
      take: perPage,
    });

    const items: InventoryItem[] = products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      inventoryQty: product.inventoryQty,
      lowStockThreshold: product.lowStockThreshold,
      inventoryStatus: product.inventoryStatus,
      categoryName: product.category?.name,
      brandName: product.brand?.name,
      updatedAt: product.updatedAt,
    }));

    return { items, total };
  }

  /**
   * Get products with low stock alerts
   */
  async getLowStockItems(storeId: string, threshold?: number): Promise<LowStockAlert[]> {
    const products = await prisma.product.findMany({
      where: {
        storeId,
        deletedAt: null,
        trackInventory: true,
        OR: [
          {
            inventoryStatus: {
              in: [InventoryStatus.LOW_STOCK, InventoryStatus.OUT_OF_STOCK],
            },
          },
          // Also check variants for low stock
          {
            variants: {
              some: {
                inventoryQty: { lte: threshold ?? 10 },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        sku: true,
        inventoryQty: true,
        lowStockThreshold: true,
        inventoryStatus: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            inventoryQty: true,
            lowStockThreshold: true,
          },
        },
      },
      orderBy: [
        { inventoryStatus: 'asc' },
        { inventoryQty: 'asc' },
      ],
    });

    return products.map((product) => {
      const lowStockVariants = product.variants.filter(
        (v) => v.inventoryQty <= v.lowStockThreshold
      );

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        inventoryQty: product.inventoryQty,
        lowStockThreshold: product.lowStockThreshold,
        inventoryStatus: product.inventoryStatus,
        categoryName: product.category?.name,
        brandName: product.brand?.name,
        deficit: Math.max(0, product.lowStockThreshold - product.inventoryQty),
        variants: lowStockVariants.length > 0
          ? lowStockVariants.map((v) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
              inventoryQty: v.inventoryQty,
              lowStockThreshold: v.lowStockThreshold,
              deficit: Math.max(0, v.lowStockThreshold - v.inventoryQty),
            }))
          : undefined,
      };
    });
  }

  /**
   * Get low stock count for dashboard widgets
   */
  async getLowStockCount(storeId: string): Promise<{ lowStock: number; outOfStock: number }> {
    const [lowStock, outOfStock] = await Promise.all([
      prisma.product.count({
        where: {
          storeId,
          deletedAt: null,
          trackInventory: true,
          inventoryStatus: InventoryStatus.LOW_STOCK,
        },
      }),
      prisma.product.count({
        where: {
          storeId,
          deletedAt: null,
          trackInventory: true,
          inventoryStatus: InventoryStatus.OUT_OF_STOCK,
        },
      }),
    ]);

    return { lowStock, outOfStock };
  }

  /**
   * Get inventory change history for a product
   */
  async getInventoryHistory(
    storeId: string,
    productId: string,
    options: { limit?: number; page?: number; perPage?: number; reason?: InventoryAdjustmentReason } = {}
  ): Promise<{ logs: InventoryLogEntry[]; total: number }> {
    const { limit, page = 1, perPage = 20, reason } = options;
    const take = limit ?? perPage;
    const skip = limit ? 0 : (page - 1) * perPage;

    const where: Prisma.InventoryLogWhereInput = {
      storeId,
      productId,
      ...(reason && { reason }),
    };

    const [logs, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        select: {
          id: true,
          productId: true,
          variantId: true,
          orderId: true,
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
          variant: {
            select: {
              name: true,
              sku: true,
            },
          },
          previousQty: true,
          newQty: true,
          changeQty: true,
          reason: true,
          note: true,
          userId: true,
          user: {
            select: {
              name: true,
            },
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.inventoryLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        productId: log.productId,
        productName: log.product.name,
        variantId: log.variantId ?? undefined,
        variantName: log.variant?.name ?? undefined,
        sku: log.variant?.sku ?? log.product.sku,
        previousQty: log.previousQty,
        newQty: log.newQty,
        changeQty: log.changeQty,
        reason: log.reason,
        reasonLabel: this.getReasonLabel(log.reason),
        note: log.note ?? undefined,
        userId: log.userId ?? undefined,
        userName: log.user?.name ?? undefined,
        orderId: log.orderId ?? undefined,
        createdAt: log.createdAt,
      })),
      total,
    };
  }

  // ==========================================================================
  // STOCK ADJUSTMENTS
  // ==========================================================================

  /**
   * Adjust product stock with audit trail
   * Uses Prisma transaction to ensure atomicity and prevent race conditions
   * CRITICAL: This is the main method for all inventory adjustments
   */
  async adjustStock(
    storeId: string,
    adjustment: StockAdjustment
  ): Promise<InventoryItem> {
    const { productId, variantId, quantity, type, reason, note, userId, orderId } = adjustment;

    // Validate quantity
    if (quantity < 0) {
      throw new Error('Quantity must be non-negative');
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Handle variant-level inventory if variantId is provided
      if (variantId) {
        return this.adjustVariantStock(tx, storeId, {
          productId,
          variantId,
          quantity,
          type,
          reason,
          note,
          userId,
          orderId,
        });
      }

      // Get current product with lock
      const product = await tx.product.findUnique({
        where: { id: productId, storeId, deletedAt: null },
        select: {
          id: true,
          name: true,
          sku: true,
          inventoryQty: true,
          lowStockThreshold: true,
          inventoryStatus: true,
          updatedAt: true,
          category: { select: { name: true } },
          brand: { select: { name: true } },
        },
      });

      if (!product) {
        throw new Error('Product not found or does not belong to this store');
      }

      // Calculate new quantity
      const { newQty, changeQty } = this.calculateNewQuantity(
        product.inventoryQty,
        quantity,
        type,
        product.name
      );

      // Determine new inventory status
      const newStatus = this.determineInventoryStatus(newQty, product.lowStockThreshold);
      const previousStatus = product.inventoryStatus;

      // Update product inventory
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          inventoryQty: newQty,
          inventoryStatus: newStatus,
        },
        select: {
          id: true,
          name: true,
          sku: true,
          inventoryQty: true,
          lowStockThreshold: true,
          inventoryStatus: true,
          updatedAt: true,
          category: { select: { name: true } },
          brand: { select: { name: true } },
        },
      });

      // Create inventory log
      await tx.inventoryLog.create({
        data: {
          storeId,
          productId,
          variantId: null,
          orderId,
          previousQty: product.inventoryQty,
          newQty,
          changeQty,
          reason: typeof reason === 'string' ? reason : reason,
          note,
          userId,
        },
      });

      // Check for low stock alert trigger
      const shouldAlert = this.shouldTriggerLowStockAlert(
        product.inventoryQty,
        newQty,
        product.lowStockThreshold,
        previousStatus,
        newStatus
      );

      if (shouldAlert) {
        await this.createLowStockAuditLog(tx, storeId, productId, undefined, newQty, product.lowStockThreshold);
      }

      return { updatedProduct };
    });

    return {
      id: result.updatedProduct.id,
      name: result.updatedProduct.name,
      sku: result.updatedProduct.sku,
      inventoryQty: result.updatedProduct.inventoryQty,
      lowStockThreshold: result.updatedProduct.lowStockThreshold,
      inventoryStatus: result.updatedProduct.inventoryStatus,
      categoryName: result.updatedProduct.category?.name,
      brandName: result.updatedProduct.brand?.name,
      updatedAt: result.updatedProduct.updatedAt,
    };
  }

  /**
   * Adjust variant-level stock within a transaction
   */
  private async adjustVariantStock(
    tx: Prisma.TransactionClient,
    storeId: string,
    adjustment: StockAdjustment
  ): Promise<{ updatedProduct: InventoryItem & { category?: { name: string } | null; brand?: { name: string } | null } }> {
    const { productId, variantId, quantity, type, reason, note, userId, orderId } = adjustment;

    // Get variant with product info
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        name: true,
        sku: true,
        inventoryQty: true,
        lowStockThreshold: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            storeId: true,
            inventoryQty: true,
            lowStockThreshold: true,
            inventoryStatus: true,
            category: { select: { name: true } },
            brand: { select: { name: true } },
          },
        },
      },
    });

    if (!variant || variant.product.storeId !== storeId) {
      throw new Error('Variant not found or does not belong to this store');
    }

    // Calculate new quantity
    const { newQty, changeQty } = this.calculateNewQuantity(
      variant.inventoryQty,
      quantity,
      type,
      `${variant.product.name} - ${variant.name}`
    );

    // Update variant inventory
    await tx.productVariant.update({
      where: { id: variantId },
      data: { inventoryQty: newQty },
    });

    // Create inventory log
    await tx.inventoryLog.create({
      data: {
        storeId,
        productId,
        variantId,
        orderId,
        previousQty: variant.inventoryQty,
        newQty,
        changeQty,
        reason: typeof reason === 'string' ? reason : reason,
        note,
        userId,
      },
    });

    // Check for low stock alert trigger
    const shouldAlert = newQty <= variant.lowStockThreshold && variant.inventoryQty > variant.lowStockThreshold;
    if (shouldAlert) {
      await this.createLowStockAuditLog(tx, storeId, productId, variantId, newQty, variant.lowStockThreshold);
    }

    // Return the product info for consistency with product-level adjustments
    return {
      updatedProduct: {
        id: variant.product.id,
        name: variant.product.name,
        sku: variant.sku,
        inventoryQty: newQty, // Return variant qty, not product qty
        lowStockThreshold: variant.lowStockThreshold,
        inventoryStatus: this.determineInventoryStatus(newQty, variant.lowStockThreshold),
        categoryName: variant.product.category?.name,
        brandName: variant.product.brand?.name,
        updatedAt: new Date(),
        category: variant.product.category,
        brand: variant.product.brand,
      },
    };
  }

  /**
   * Bulk adjust inventory (e.g., after CSV import)
   * Processes up to 1000 items
   */
  async bulkAdjust(
    storeId: string,
    items: BulkAdjustmentItem[],
    userId?: string
  ): Promise<BulkAdjustmentResult> {
    // Limit to 1000 items per batch
    if (items.length > 1000) {
      throw new Error('Bulk adjustment limited to 1000 items per request');
    }

    const errors: Array<{ index: number; sku?: string; error: string }> = [];
    let succeeded = 0;

    // First, resolve SKUs to product IDs if needed
    const skusToResolve = items
      .filter((item) => !item.productId && item.sku)
      .map((item) => item.sku!);

    const skuToProductMap = new Map<string, string>();

    if (skusToResolve.length > 0) {
      const products = await prisma.product.findMany({
        where: {
          storeId,
          sku: { in: skusToResolve },
          deletedAt: null,
        },
        select: { id: true, sku: true },
      });

      products.forEach((p) => skuToProductMap.set(p.sku, p.id));
    }

    // Process each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        // Resolve productId from SKU if not provided
        let productId = item.productId;
        if (!productId && item.sku) {
          productId = skuToProductMap.get(item.sku);
          if (!productId) {
            errors.push({ index: i, sku: item.sku, error: `Product not found with SKU: ${item.sku}` });
            continue;
          }
        }

        if (!productId) {
          errors.push({ index: i, sku: item.sku, error: 'Product ID or SKU is required' });
          continue;
        }

        await this.adjustStock(storeId, {
          productId,
          quantity: item.quantity,
          type: item.type,
          reason: item.reason,
          note: item.note,
          userId,
        });

        succeeded++;
      } catch (error) {
        errors.push({
          index: i,
          sku: item.sku,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      total: items.length,
      succeeded,
      failed: errors.length,
      errors,
    };
  }

  // ==========================================================================
  // ORDER INTEGRATION - ATOMIC INVENTORY OPERATIONS
  // ==========================================================================

  /**
   * Atomically deduct stock when order is created
   * CRITICAL: Prevents overselling through transaction isolation
   */
  async deductStockForOrder(
    storeId: string,
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
    orderId: string,
    userId?: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.variantId) {
          // Variant-level deduction
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: {
              inventoryQty: true,
              lowStockThreshold: true,
              name: true,
              product: { select: { name: true, storeId: true } },
            },
          });

          if (!variant || variant.product.storeId !== storeId) {
            throw new Error(`Variant ${item.variantId} not found`);
          }

          const newQty = variant.inventoryQty - item.quantity;

          if (newQty < 0) {
            throw new Error(
              `Insufficient stock for "${variant.product.name} - ${variant.name}". Available: ${variant.inventoryQty}, Requested: ${item.quantity}`
            );
          }

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { inventoryQty: newQty },
          });

          await tx.inventoryLog.create({
            data: {
              storeId,
              productId: item.productId,
              variantId: item.variantId,
              orderId,
              previousQty: variant.inventoryQty,
              newQty,
              changeQty: -item.quantity,
              reason: InventoryAdjustmentReason.ORDER_CREATED,
              note: `Order ${orderId}`,
              userId,
            },
          });

          // Check low stock alert
          if (newQty <= variant.lowStockThreshold && variant.inventoryQty > variant.lowStockThreshold) {
            await this.createLowStockAuditLog(tx, storeId, item.productId, item.variantId, newQty, variant.lowStockThreshold);
          }
        } else {
          // Product-level deduction
          const product = await tx.product.findUnique({
            where: { id: item.productId, storeId },
            select: { inventoryQty: true, lowStockThreshold: true, name: true, inventoryStatus: true },
          });

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          const newQty = product.inventoryQty - item.quantity;

          if (newQty < 0) {
            throw new Error(
              `Insufficient stock for product "${product.name}". Available: ${product.inventoryQty}, Requested: ${item.quantity}`
            );
          }

          const newStatus = this.determineInventoryStatus(newQty, product.lowStockThreshold);

          await tx.product.update({
            where: { id: item.productId },
            data: {
              inventoryQty: newQty,
              inventoryStatus: newStatus,
            },
          });

          await tx.inventoryLog.create({
            data: {
              storeId,
              productId: item.productId,
              orderId,
              previousQty: product.inventoryQty,
              newQty,
              changeQty: -item.quantity,
              reason: InventoryAdjustmentReason.ORDER_CREATED,
              note: `Order ${orderId}`,
              userId,
            },
          });

          // Check low stock alert
          if (
            newStatus !== product.inventoryStatus &&
            (newStatus === InventoryStatus.LOW_STOCK || newStatus === InventoryStatus.OUT_OF_STOCK)
          ) {
            await this.createLowStockAuditLog(tx, storeId, item.productId, undefined, newQty, product.lowStockThreshold);
          }
        }
      }
    });
  }

  /**
   * Restore stock when order is canceled
   */
  async restoreStockForCancellation(
    storeId: string,
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
    orderId: string,
    userId?: string
  ): Promise<void> {
    await this.restoreStockInternal(
      storeId,
      items,
      orderId,
      InventoryAdjustmentReason.ORDER_CANCELLED,
      userId
    );
  }

  /**
   * Restore stock when return is processed
   */
  async restoreStockForReturn(
    storeId: string,
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
    orderId: string,
    userId?: string
  ): Promise<void> {
    await this.restoreStockInternal(
      storeId,
      items,
      orderId,
      InventoryAdjustmentReason.RETURN_PROCESSED,
      userId
    );
  }

  /**
   * Internal method to restore stock
   * Note: Silently skips deleted products/variants to allow processing other items
   * in the order. This is intentional as products may be discontinued after order creation.
   */
  private async restoreStockInternal(
    storeId: string,
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
    orderId: string,
    reason: InventoryAdjustmentReason,
    userId?: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.variantId) {
          // Variant-level restoration
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { inventoryQty: true, lowStockThreshold: true },
          });

          if (!variant) {
            // Log warning for deleted variant - this is expected when product is discontinued
            console.warn(
              `[InventoryService] Skipping stock restoration for deleted variant ${item.variantId} (Order: ${orderId})`
            );
            continue;
          }

          const newQty = variant.inventoryQty + item.quantity;

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { inventoryQty: newQty },
          });

          await tx.inventoryLog.create({
            data: {
              storeId,
              productId: item.productId,
              variantId: item.variantId,
              orderId,
              previousQty: variant.inventoryQty,
              newQty,
              changeQty: item.quantity,
              reason,
              note: `Order ${orderId}`,
              userId,
            },
          });
        } else {
          // Product-level restoration
          const product = await tx.product.findUnique({
            where: { id: item.productId, storeId },
            select: { inventoryQty: true, lowStockThreshold: true },
          });

          if (!product) {
            // Log warning for deleted product - this is expected when product is discontinued
            console.warn(
              `[InventoryService] Skipping stock restoration for deleted product ${item.productId} (Order: ${orderId})`
            );
            continue;
          }

          const newQty = product.inventoryQty + item.quantity;
          const newStatus = this.determineInventoryStatus(newQty, product.lowStockThreshold);

          await tx.product.update({
            where: { id: item.productId },
            data: {
              inventoryQty: newQty,
              inventoryStatus: newStatus,
            },
          });

          await tx.inventoryLog.create({
            data: {
              storeId,
              productId: item.productId,
              orderId,
              previousQty: product.inventoryQty,
              newQty,
              changeQty: item.quantity,
              reason,
              note: `Order ${orderId}`,
              userId,
            },
          });
        }
      }
    });
  }

  // ==========================================================================
  // LEGACY COMPATIBILITY METHODS
  // ==========================================================================

  /**
   * @deprecated Use deductStockForOrder instead
   * Deduct stock when order is placed
   */
  async deductStock(
    storeId: string,
    items: Array<{ productId: string; quantity: number }>,
    orderId: string
  ): Promise<void> {
    await this.deductStockForOrder(storeId, items, orderId);
  }

  /**
   * @deprecated Use restoreStockForCancellation or restoreStockForReturn instead
   * Restore stock when order is canceled or refunded
   */
  async restoreStock(
    storeId: string,
    items: Array<{ productId: string; quantity: number }>,
    orderId: string,
    reason: 'Cancellation' | 'Refund'
  ): Promise<void> {
    const adjustmentReason = reason === 'Cancellation'
      ? InventoryAdjustmentReason.ORDER_CANCELLED
      : InventoryAdjustmentReason.RETURN_PROCESSED;

    await this.restoreStockInternal(storeId, items, orderId, adjustmentReason);
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Calculate new quantity based on adjustment type
   */
  private calculateNewQuantity(
    currentQty: number,
    adjustmentQty: number,
    type: 'ADD' | 'REMOVE' | 'SET',
    itemName: string
  ): { newQty: number; changeQty: number } {
    let newQty: number;
    let changeQty: number;

    switch (type) {
      case 'ADD':
        newQty = currentQty + adjustmentQty;
        changeQty = adjustmentQty;
        break;
      case 'REMOVE':
        newQty = currentQty - adjustmentQty;
        changeQty = -adjustmentQty;
        if (newQty < 0) {
          throw new Error(
            `Cannot remove ${adjustmentQty} units from "${itemName}". Current stock: ${currentQty}`
          );
        }
        break;
      case 'SET':
        newQty = adjustmentQty;
        changeQty = adjustmentQty - currentQty;
        break;
      default:
        throw new Error(`Invalid adjustment type: ${type}`);
    }

    return { newQty, changeQty };
  }

  /**
   * Determine inventory status based on quantity and threshold
   */
  private determineInventoryStatus(
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
   * Check if a low stock alert should be triggered
   */
  private shouldTriggerLowStockAlert(
    previousQty: number,
    newQty: number,
    threshold: number,
    previousStatus: InventoryStatus,
    newStatus: InventoryStatus
  ): boolean {
    // Trigger alert when crossing threshold downward
    return (
      newQty <= threshold &&
      previousQty > threshold
    ) || (
      // Or when status changes to LOW_STOCK or OUT_OF_STOCK
      previousStatus === InventoryStatus.IN_STOCK &&
      (newStatus === InventoryStatus.LOW_STOCK || newStatus === InventoryStatus.OUT_OF_STOCK)
    );
  }

  /**
   * Create audit log entry for low stock alert
   */
  private async createLowStockAuditLog(
    tx: Prisma.TransactionClient,
    storeId: string,
    productId: string,
    variantId: string | undefined,
    currentStock: number,
    threshold: number
  ): Promise<void> {
    await tx.auditLog.create({
      data: {
        storeId,
        action: 'low_stock_alert',
        entityType: variantId ? 'ProductVariant' : 'Product',
        entityId: variantId ?? productId,
        changes: JSON.stringify({
          type: 'low_stock_alert',
          productId,
          variantId: variantId ?? null,
          currentStock,
          threshold,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  }

  /**
   * Get human-readable label for reason code
   */
  private getReasonLabel(reason: string): string {
    const enumReason = reason as InventoryAdjustmentReason;
    return InventoryAdjustmentReasonLabels[enumReason] ?? reason;
  }
}
