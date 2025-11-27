// src/lib/services/inventory.service.ts
// Inventory Management Service
// Handles stock tracking, adjustments, low stock alerts, and audit trails

import { prisma } from '@/lib/prisma';
import { caseInsensitiveStringFilter } from '@/lib/prisma-utils';
import { InventoryStatus, Prisma } from '@prisma/client';

/**
 * Inventory adjustment reason codes
 * Used for tracking why inventory was adjusted
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
  quantity: number;
  type: 'ADD' | 'REMOVE' | 'SET';
  reason: string;
  note?: string;
  userId?: string;
  orderId?: string;
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
 * Inventory log entry with user tracking
 */
export interface InventoryLogEntry {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  previousQty: number;
  newQty: number;
  changeQty: number;
  reason: string;
  note?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  orderId?: string;
  orderNumber?: string;
  createdAt: Date;
}

/**
 * Bulk adjustment item for CSV import
 */
export interface BulkAdjustmentItem {
  productId?: string;
  sku?: string;
  quantity: number;
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
   * Adjust product stock atomically with audit trail
   * Uses Prisma transaction to ensure consistency
   */
  async adjustStock(
    storeId: string,
    adjustment: StockAdjustment
  ): Promise<InventoryItem> {
    const { productId, quantity, type, reason, note, userId, orderId } = adjustment;

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

      // Calculate new quantity
      let newQty: number;
      let changeQty: number;

      switch (type) {
        case 'ADD':
          newQty = product.inventoryQty + quantity;
          changeQty = quantity;
          break;
        case 'REMOVE':
          newQty = product.inventoryQty - quantity;
          changeQty = -quantity;
          // Prevent negative inventory
          if (newQty < 0) {
            throw new Error(
              `Insufficient stock: current=${product.inventoryQty}, requested=${quantity}`
            );
          }
          break;
        case 'SET':
          newQty = quantity;
          changeQty = quantity - product.inventoryQty;
          break;
        default:
          throw new Error(`Invalid adjustment type: ${type}`);
      }

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

      // Create inventory log with optional order reference
      await tx.inventoryLog.create({
        data: {
          storeId,
          productId,
          previousQty: product.inventoryQty,
          newQty,
          changeQty,
          reason,
          note,
          userId,
          orderId,
        },
      });

      // Check for low stock alert trigger
      if (newStatus === InventoryStatus.LOW_STOCK && previousStatus === InventoryStatus.IN_STOCK) {
        await this.sendLowStockAlert(productId, newQty, storeId, tx);
      }

      return { updatedProduct, previousStatus };
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
   * Get inventory change history for a product with user tracking
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
        product: {
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
            email: true,
          },
        },
        orderId: true,
        order: {
          select: {
            orderNumber: true,
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
      productName: log.product.name,
      sku: log.product.sku,
      previousQty: log.previousQty,
      newQty: log.newQty,
      changeQty: log.changeQty,
      reason: log.reason,
      note: log.note || undefined,
      userId: log.userId || undefined,
      userName: log.user?.name || undefined,
      userEmail: log.user?.email || undefined,
      orderId: log.orderId || undefined,
      orderNumber: log.order?.orderNumber || undefined,
      createdAt: log.createdAt,
    }));
  }

  /**
   * Get inventory history for entire store with pagination
   */
  async getStoreInventoryHistory(
    storeId: string,
    options: { page?: number; perPage?: number; reason?: string } = {}
  ): Promise<{ logs: InventoryLogEntry[]; total: number }> {
    const { page = 1, perPage = 50, reason } = options;

    const where: Prisma.InventoryLogWhereInput = {
      storeId,
      ...(reason && { reason }),
    };

    const [logs, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        select: {
          id: true,
          productId: true,
          product: {
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
              email: true,
            },
          },
          orderId: true,
          order: {
            select: {
              orderNumber: true,
            },
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.inventoryLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        productId: log.productId,
        productName: log.product.name,
        sku: log.product.sku,
        previousQty: log.previousQty,
        newQty: log.newQty,
        changeQty: log.changeQty,
        reason: log.reason,
        note: log.note || undefined,
        userId: log.userId || undefined,
        userName: log.user?.name || undefined,
        userEmail: log.user?.email || undefined,
        orderId: log.orderId || undefined,
        orderNumber: log.order?.orderNumber || undefined,
        createdAt: log.createdAt,
      })),
      total,
    };
  }

  /**
   * Bulk adjust inventory for multiple products
   * Supports CSV import with up to 1000 products
   */
  async bulkAdjust(
    storeId: string,
    adjustments: BulkAdjustmentItem[],
    userId: string
  ): Promise<BulkAdjustmentResult> {
    // Limit to 1000 products per batch
    if (adjustments.length > 1000) {
      throw new Error('Bulk adjustment limited to 1000 products per request');
    }

    const results: BulkAdjustmentResult = {
      total: adjustments.length,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    // Collect all SKUs that need to be resolved to product IDs
    const skusToResolve = adjustments
      .filter((adj) => adj.sku && !adj.productId)
      .map((adj) => adj.sku!);

    // Batch resolve SKUs to product IDs
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

    // Process each adjustment
    for (const adj of adjustments) {
      try {
        // Resolve product ID from SKU if needed
        let productId = adj.productId;
        if (!productId && adj.sku) {
          productId = skuToProductMap.get(adj.sku);
          if (!productId) {
            results.failed++;
            results.errors.push({
              sku: adj.sku,
              error: `Product with SKU "${adj.sku}" not found`,
            });
            continue;
          }
        }

        if (!productId) {
          results.failed++;
          results.errors.push({
            sku: adj.sku,
            productId: adj.productId,
            error: 'Product ID or SKU is required',
          });
          continue;
        }

        // Perform the adjustment
        await this.adjustStock(storeId, {
          productId,
          quantity: Math.abs(adj.quantity),
          type: adj.quantity >= 0 ? 'ADD' : 'REMOVE',
          reason: adj.reason,
          note: adj.note,
          userId,
        });

        results.succeeded++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          sku: adj.sku,
          productId: adj.productId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Deduct stock atomically when order is placed
   * Uses Prisma transaction to prevent race conditions
   * Called from CheckoutService/OrderService
   */
  async deductStock(
    storeId: string,
    items: Array<{ productId: string; quantity: number }>,
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

        const newQty = product.inventoryQty - item.quantity;

        // Prevent negative inventory
        if (newQty < 0) {
          throw new Error(
            `Insufficient stock for product "${product.name}". Available: ${product.inventoryQty}, Requested: ${item.quantity}`
          );
        }

        const newStatus = this.determineInventoryStatus(newQty, product.lowStockThreshold);
        const previousStatus = this.determineInventoryStatus(product.inventoryQty, product.lowStockThreshold);

        await tx.product.update({
          where: { id: item.productId },
          data: {
            inventoryQty: newQty,
            inventoryStatus: newStatus,
          },
        });

        // Create inventory log with order reference
        await tx.inventoryLog.create({
          data: {
            storeId,
            productId: item.productId,
            previousQty: product.inventoryQty,
            newQty,
            changeQty: -item.quantity,
            reason: InventoryAdjustmentReason.ORDER_CREATED,
            note: `Order ID: ${orderId}`,
            orderId,
            userId,
          },
        });

        // Check for low stock alert trigger
        if (newStatus === InventoryStatus.LOW_STOCK && previousStatus === InventoryStatus.IN_STOCK) {
          await this.sendLowStockAlert(item.productId, newQty, storeId, tx);
        }
      }
    });
  }

  /**
   * Restore stock atomically when order is canceled or refunded
   * Called from OrderService
   */
  async restoreStock(
    storeId: string,
    items: Array<{ productId: string; quantity: number }>,
    orderId: string,
    reason: 'Cancellation' | 'Refund',
    userId?: string
  ): Promise<void> {
    const adjustmentReason = reason === 'Cancellation' 
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

        const newQty = product.inventoryQty + item.quantity;
        const newStatus = this.determineInventoryStatus(newQty, product.lowStockThreshold);

        await tx.product.update({
          where: { id: item.productId },
          data: {
            inventoryQty: newQty,
            inventoryStatus: newStatus,
          },
        });

        // Create inventory log with order reference
        await tx.inventoryLog.create({
          data: {
            storeId,
            productId: item.productId,
            previousQty: product.inventoryQty,
            newQty,
            changeQty: item.quantity,
            reason: adjustmentReason,
            note: `Order ${reason}: ${orderId}`,
            orderId,
            userId,
          },
        });
      }
    });
  }

  /**
   * Send low stock alert (placeholder for notification system)
   * Creates an audit log entry for now
   */
  private async sendLowStockAlert(
    productId: string, 
    stock: number, 
    storeId: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx || prisma;
    
    // TODO: Integrate with notification system (Issue CodeStorm-Hub/stormcomui#4.6)
    console.warn(`Low stock alert: Product ${productId}, Stock ${stock}`);

    // Create audit log entry for tracking
    await client.auditLog.create({
      data: {
        storeId,
        action: 'low_stock_alert',
        entityType: 'Product',
        entityId: productId,
        changes: JSON.stringify({ stock, threshold: 'product_default' }),
      },
    });
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
