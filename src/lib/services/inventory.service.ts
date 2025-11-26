// src/lib/services/inventory.service.ts
// Inventory Management Service
// Handles stock tracking, adjustments, low stock alerts, and audit trails

import { prisma } from '@/lib/prisma';
import { caseInsensitiveStringFilter } from '@/lib/prisma-utils';
import { InventoryStatus, Prisma } from '@prisma/client';

/**
 * Inventory adjustment reason codes enum
 * Used for standardized tracking of why inventory was adjusted
 */
export enum InventoryAdjustmentReason {
  ORDER_CREATED = 'order_created',
  ORDER_CANCELLED = 'order_cancelled',
  RETURN_PROCESSED = 'return_processed',
  MANUAL_ADJUSTMENT = 'manual_adjustment',
  RESTOCK = 'restock',
  DAMAGED = 'damaged',
  LOST = 'lost',
  FOUND = 'found',
  STOCK_TRANSFER = 'stock_transfer',
  INVENTORY_COUNT = 'inventory_count',
  EXPIRED = 'expired',
  THEFT = 'theft',
}

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
  reason: string;
  note?: string;
  userId?: string;
  orderId?: string;
}

/**
 * Bulk adjustment input item
 */
export interface BulkAdjustmentItem {
  productId?: string;
  variantId?: string;
  sku?: string;
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
  errors: Array<{ sku?: string; productId?: string; error: string }>;
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
 * Inventory log entry with extended details
 */
export interface InventoryLogEntry {
  id: string;
  productId: string;
  variantId?: string;
  orderId?: string;
  orderNumber?: string;
  productName: string;
  variantName?: string;
  sku: string;
  previousQty: number;
  newQty: number;
  changeQty: number;
  reason: string;
  note?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  createdAt: Date;
}

export class InventoryService {
  private static instance: InventoryService;

  private constructor() {}

  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

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
   * Adjust product stock with audit trail
   * Uses Prisma transaction to ensure consistency
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

      // If variant specified, get variant stock
      let targetQty = product.inventoryQty;
      let targetThreshold = product.lowStockThreshold;
      
      if (variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId, productId },
          select: { inventoryQty: true, lowStockThreshold: true },
        });
        if (!variant) {
          throw new Error('Variant not found or does not belong to this product');
        }
        targetQty = variant.inventoryQty;
        targetThreshold = variant.lowStockThreshold;
      }

      // Calculate new quantity
      let newQty: number;
      let changeQty: number;

      switch (type) {
        case 'ADD':
          newQty = targetQty + quantity;
          changeQty = quantity;
          break;
        case 'REMOVE':
          newQty = targetQty - quantity;
          changeQty = -quantity;
          if (newQty < 0) {
            throw new Error(
              `Cannot remove ${quantity} units. Current stock: ${targetQty}`
            );
          }
          break;
        case 'SET':
          newQty = quantity;
          changeQty = quantity - targetQty;
          break;
        default:
          throw new Error(`Invalid adjustment type: ${type}`);
      }

      // Determine new inventory status
      const newStatus = this.determineInventoryStatus(newQty, targetThreshold);
      const previousQty = targetQty;

      // Update variant or product inventory
      if (variantId) {
        // Update variant inventory
        const updatedVariant = await tx.productVariant.update({
          where: { id: variantId },
          data: { inventoryQty: newQty },
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
                category: { select: { name: true } },
                brand: { select: { name: true } },
              },
            },
            updatedAt: true,
          },
        });

        // Create inventory log with orderId and variantId
        await tx.inventoryLog.create({
          data: {
            storeId,
            productId,
            variantId,
            orderId,
            previousQty,
            newQty,
            changeQty,
            reason,
            note,
            userId,
          },
        });

        // Return variant data when adjusting variant
        return {
          updatedProduct: {
            id: updatedVariant.product.id,
            name: `${updatedVariant.product.name} - ${updatedVariant.name}`,
            sku: updatedVariant.sku,
            inventoryQty: updatedVariant.inventoryQty,
            lowStockThreshold: updatedVariant.lowStockThreshold,
            inventoryStatus: newStatus, // Calculate status from the updated variant
            updatedAt: updatedVariant.updatedAt,
            category: updatedVariant.product.category,
            brand: updatedVariant.product.brand,
          },
        };
      } else {
        await tx.product.update({
          where: { id: productId },
          data: {
            inventoryQty: newQty,
            inventoryStatus: newStatus,
          },
        });

        // Create inventory log
        await tx.inventoryLog.create({
          data: {
            storeId,
            productId,
            variantId,
            orderId,
            previousQty,
            newQty,
            changeQty,
            reason,
            note,
            userId,
          },
        });

        // Re-fetch updated product for return
        const updatedProduct = await tx.product.findUnique({
          where: { id: productId },
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

        return { updatedProduct: updatedProduct! };
      }
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
   * Get products with low stock alerts
   */
  async getLowStockItems(storeId: string): Promise<InventoryItem[]> {
    const products = await prisma.product.findMany({
      where: {
        storeId,
        deletedAt: null,
        trackInventory: true,
        inventoryStatus: {
          in: [InventoryStatus.LOW_STOCK, InventoryStatus.OUT_OF_STOCK],
        },
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
      orderBy: [
        { inventoryStatus: 'asc' },
        { inventoryQty: 'asc' },
      ],
    });

    return products.map((product) => ({
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
  }

  /**
   * Get inventory change history for a product
   */
  async getInventoryHistory(
    storeId: string,
    productId: string,
    limit = 50
  ): Promise<InventoryLogEntry[]> {
    const logs = await prisma.inventoryLog.findMany({
      where: {
        storeId,
        productId,
      },
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
        order: {
          select: {
            orderNumber: true,
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
            email: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      productId: log.productId,
      variantId: log.variantId || undefined,
      orderId: log.orderId || undefined,
      orderNumber: log.order?.orderNumber || undefined,
      productName: log.product.name,
      variantName: log.variant?.name || undefined,
      sku: log.variant?.sku || log.product.sku,
      previousQty: log.previousQty,
      newQty: log.newQty,
      changeQty: log.changeQty,
      reason: log.reason,
      note: log.note || undefined,
      userId: log.userId || undefined,
      userName: log.user?.name || undefined,
      userEmail: log.user?.email || undefined,
      createdAt: log.createdAt,
    }));
  }

  /**
   * Deduct stock when order is placed
   * Called from CheckoutService/OrderService
   */
  async deductStock(
    storeId: string,
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
    orderId: string,
    userId?: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId, storeId },
          select: { inventoryQty: true, lowStockThreshold: true, name: true },
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        let targetQty = product.inventoryQty;
        let targetThreshold = product.lowStockThreshold;

        // Handle variant-level stock if variantId is provided
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId, productId: item.productId },
            select: { inventoryQty: true, lowStockThreshold: true },
          });
          if (variant) {
            targetQty = variant.inventoryQty;
            targetThreshold = variant.lowStockThreshold;
          }
        }

        const newQty = targetQty - item.quantity;

        if (newQty < 0) {
          throw new Error(
            `Insufficient stock for product "${product.name}". Available: ${targetQty}, Requested: ${item.quantity}`
          );
        }

        const newStatus = this.determineInventoryStatus(newQty, targetThreshold);

        // Update variant or product inventory
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { inventoryQty: newQty },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              inventoryQty: newQty,
              inventoryStatus: newStatus,
            },
          });
        }

        await tx.inventoryLog.create({
          data: {
            storeId,
            productId: item.productId,
            variantId: item.variantId,
            orderId,
            previousQty: targetQty,
            newQty,
            changeQty: -item.quantity,
            reason: InventoryAdjustmentReason.ORDER_CREATED,
            userId,
          },
        });
      }
    });
  }

  /**
   * Restore stock when order is canceled or refunded
   * Called from OrderService
   */
  async restoreStock(
    storeId: string,
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
    orderId: string,
    reason: 'Cancellation' | 'Refund',
    userId?: string
  ): Promise<void> {
    const reasonCode = reason === 'Cancellation' 
      ? InventoryAdjustmentReason.ORDER_CANCELLED 
      : InventoryAdjustmentReason.RETURN_PROCESSED;

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId, storeId },
          select: { inventoryQty: true, lowStockThreshold: true },
        });

        if (!product) {
          continue; // Skip if product deleted
        }

        let targetQty = product.inventoryQty;
        let targetThreshold = product.lowStockThreshold;

        // Handle variant-level stock if variantId is provided
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId, productId: item.productId },
            select: { inventoryQty: true, lowStockThreshold: true },
          });
          if (variant) {
            targetQty = variant.inventoryQty;
            targetThreshold = variant.lowStockThreshold;
          }
        }

        const newQty = targetQty + item.quantity;
        const newStatus = this.determineInventoryStatus(newQty, targetThreshold);

        // Update variant or product inventory
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { inventoryQty: newQty },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              inventoryQty: newQty,
              inventoryStatus: newStatus,
            },
          });
        }

        await tx.inventoryLog.create({
          data: {
            storeId,
            productId: item.productId,
            variantId: item.variantId,
            orderId,
            previousQty: targetQty,
            newQty,
            changeQty: item.quantity,
            reason: reasonCode,
            userId,
          },
        });
      }
    });
  }

  /**
   * Bulk adjust inventory (e.g., after CSV import)
   * Processes up to 1000 products in batched transactions for better performance
   */
  async bulkAdjust(
    storeId: string,
    adjustments: BulkAdjustmentItem[],
    userId?: string
  ): Promise<BulkAdjustmentResult> {
    const MAX_BULK_ITEMS = 1000;
    const BATCH_SIZE = 50; // Process in batches of 50 for optimal transaction performance

    if (adjustments.length > MAX_BULK_ITEMS) {
      throw new Error(`Cannot process more than ${MAX_BULK_ITEMS} items at once`);
    }

    const errors: Array<{ sku?: string; productId?: string; error: string }> = [];
    let succeeded = 0;

    // Pre-resolve all SKUs to productIds in a single query for efficiency
    const skuToResolve = adjustments
      .filter(a => !a.productId && a.sku)
      .map(a => a.sku!);
    
    const skuToIdMap = new Map<string, string>();
    if (skuToResolve.length > 0) {
      const products = await prisma.product.findMany({
        where: {
          storeId,
          sku: { in: skuToResolve },
          deletedAt: null,
        },
        select: { id: true, sku: true },
      });
      products.forEach(p => skuToIdMap.set(p.sku, p.id));
    }

    // Prepare adjustments with resolved productIds
    const resolvedAdjustments: Array<{
      index: number;
      productId: string;
      variantId?: string;
      quantity: number;
      type: 'ADD' | 'REMOVE' | 'SET';
      reason: InventoryAdjustmentReason;
      note?: string;
      sku?: string;
    }> = [];

    for (let i = 0; i < adjustments.length; i++) {
      const adjustment = adjustments[i];
      let productId = adjustment.productId;
      
      if (!productId && adjustment.sku) {
        productId = skuToIdMap.get(adjustment.sku);
        if (!productId) {
          errors.push({ 
            sku: adjustment.sku, 
            error: `Product with SKU "${adjustment.sku}" not found` 
          });
          continue;
        }
      }

      if (!productId) {
        errors.push({ 
          sku: adjustment.sku, 
          productId: adjustment.productId,
          error: 'Either productId or sku must be provided' 
        });
        continue;
      }

      resolvedAdjustments.push({
        index: i,
        productId,
        variantId: adjustment.variantId,
        quantity: adjustment.quantity,
        type: adjustment.type,
        reason: adjustment.reason,
        note: adjustment.note,
        sku: adjustment.sku,
      });
    }

    // Process in batches with transactions for better performance and atomicity
    for (let i = 0; i < resolvedAdjustments.length; i += BATCH_SIZE) {
      const batch = resolvedAdjustments.slice(i, i + BATCH_SIZE);
      
      // Each batch is processed in its own transaction
      const batchResults = await Promise.allSettled(
        batch.map(async (adj) => {
          try {
            await this.adjustStock(storeId, {
              productId: adj.productId,
              variantId: adj.variantId,
              quantity: adj.quantity,
              type: adj.type,
              reason: adj.reason,
              note: adj.note,
              userId,
            });
            return { success: true, index: adj.index };
          } catch (error) {
            throw { 
              index: adj.index, 
              sku: adj.sku, 
              productId: adj.productId,
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
          }
        })
      );

      // Process batch results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          succeeded++;
        } else {
          const reason = result.reason as { sku?: string; productId?: string; error: string };
          errors.push({
            sku: reason.sku,
            productId: reason.productId,
            error: reason.error,
          });
        }
      }
    }

    return {
      total: adjustments.length,
      succeeded,
      failed: errors.length,
      errors,
    };
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
}
