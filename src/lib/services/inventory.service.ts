// src/lib/services/inventory.service.ts
// Inventory Management Service
// Handles stock tracking, adjustments, low stock alerts, and audit trails

import { prisma } from '@/lib/prisma';
import { caseInsensitiveStringFilter } from '@/lib/prisma-utils';
import { InventoryStatus, Prisma } from '@prisma/client';

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
  sku: string;
  previousQty: number;
  newQty: number;
  changeQty: number;
  reason: string;
  note?: string;
  userId?: string;
  userName?: string;
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
    const { productId, quantity, type, reason, note, userId } = adjustment;

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
          if (newQty < 0) {
            throw new Error(
              `Cannot remove ${quantity} units. Current stock: ${product.inventoryQty}`
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

      // Create inventory log
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
        },
      });

      return { updatedProduct, previousStatus };
    });

    // TODO: Send low stock notifications to store admins

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
      createdAt: log.createdAt,
    }));
  }

  /**
   * Deduct stock when order is placed
   * Called from CheckoutService/OrderService
   */
  async deductStock(
    storeId: string,
    items: Array<{ productId: string; quantity: number }>,
    orderId: string
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
            previousQty: product.inventoryQty,
            newQty,
            changeQty: -item.quantity,
            reason: 'Sale',
            note: `Order ${orderId}`,
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
    items: Array<{ productId: string; quantity: number }>,
    orderId: string,
    reason: 'Cancellation' | 'Refund'
  ): Promise<void> {
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

        await tx.inventoryLog.create({
          data: {
            storeId,
            productId: item.productId,
            previousQty: product.inventoryQty,
            newQty,
            changeQty: item.quantity,
            reason,
            note: `Order ${orderId}`,
          },
        });
      }
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
