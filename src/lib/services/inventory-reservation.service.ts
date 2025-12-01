// src/lib/services/inventory-reservation.service.ts
// Inventory Reservation Service
// Handles short-lived inventory reservations to prevent overselling

import { prisma } from '@/lib/prisma';
import { Prisma, ReservationStatus } from '@prisma/client';
import { AuditLogService } from './audit-log.service';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Default reservation TTL in minutes
 * Can be overridden per reservation
 */
export const DEFAULT_RESERVATION_TTL_MINUTES = 15;

/**
 * Maximum extension time in minutes (once per reservation)
 */
export const MAX_EXTENSION_MINUTES = 15;

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Item to reserve
 */
export interface ReservationItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

/**
 * Options for creating reservations
 */
export interface CreateReservationOptions {
  storeId: string;
  items: ReservationItem[];
  cartId?: string;
  ttlMinutes?: number;
}

/**
 * Created reservation result
 */
export interface ReservationResult {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  expiresAt: Date;
  status: ReservationStatus;
}

/**
 * Batch reservation result
 */
export interface BatchReservationResult {
  success: boolean;
  reservations: ReservationResult[];
  errors: Array<{ productId: string; variantId?: string; message: string }>;
}

/**
 * Available stock info
 */
export interface AvailableStockInfo {
  productId: string;
  variantId?: string;
  totalStock: number;
  reservedQuantity: number;
  availableStock: number;
}

// ============================================================================
// INVENTORY RESERVATION SERVICE
// ============================================================================

export class InventoryReservationService {
  private static instance: InventoryReservationService;
  private auditLogService: AuditLogService;

  private constructor() {
    this.auditLogService = AuditLogService.getInstance();
  }

  static getInstance(): InventoryReservationService {
    if (!InventoryReservationService.instance) {
      InventoryReservationService.instance = new InventoryReservationService();
    }
    return InventoryReservationService.instance;
  }

  // ==========================================================================
  // RESERVATION OPERATIONS
  // ==========================================================================

  /**
   * Create batch reservations for cart items
   * Validates stock availability (currentStock - activeReservations >= requested)
   * Uses transaction to ensure atomicity
   */
  async createReservations(
    options: CreateReservationOptions
  ): Promise<BatchReservationResult> {
    const { storeId, items, cartId, ttlMinutes = DEFAULT_RESERVATION_TTL_MINUTES } = options;

    if (items.length === 0) {
      return { success: true, reservations: [], errors: [] };
    }

    const errors: Array<{ productId: string; variantId?: string; message: string }> = [];
    const reservations: ReservationResult[] = [];
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Use transaction for atomic batch reservation
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        try {
          // Get available stock considering active reservations
          const availableStock = await this.getAvailableStockInTransaction(
            tx,
            storeId,
            item.productId,
            item.variantId
          );

          if (availableStock.availableStock < item.quantity) {
            errors.push({
              productId: item.productId,
              variantId: item.variantId,
              message: `Insufficient stock. Available: ${availableStock.availableStock}, Requested: ${item.quantity}`,
            });
            continue;
          }

          // Create reservation
          const reservation = await tx.inventoryReservation.create({
            data: {
              storeId,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              status: ReservationStatus.ACTIVE,
              cartId,
              expiresAt,
            },
          });

          reservations.push({
            id: reservation.id,
            productId: reservation.productId,
            variantId: reservation.variantId ?? undefined,
            quantity: reservation.quantity,
            expiresAt: reservation.expiresAt,
            status: reservation.status,
          });
        } catch (error) {
          errors.push({
            productId: item.productId,
            variantId: item.variantId,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // If any errors occurred, throw to rollback transaction
      if (errors.length > 0 && reservations.length === 0) {
        const errorSummary = errors.map(e => 
          `${e.productId}${e.variantId ? `/${e.variantId}` : ''}: ${e.message}`
        ).join('; ');
        throw new Error(`All reservations failed: ${errorSummary}`);
      }
    });

    // Create audit log entries for successful reservations (outside transaction)
    for (const reservation of reservations) {
      await this.auditLogService.create(
        'CREATE',
        'InventoryReservation',
        reservation.id,
        {
          storeId,
          changes: {
            action: { old: null, new: 'inventory_reservation_created' },
            productId: { old: null, new: reservation.productId },
            variantId: { old: null, new: reservation.variantId ?? null },
            quantity: { old: null, new: reservation.quantity },
            expiresAt: { old: null, new: reservation.expiresAt.toISOString() },
            cartId: { old: null, new: cartId ?? null },
          },
        }
      );
    }

    return {
      success: errors.length === 0,
      reservations,
      errors,
    };
  }

  /**
   * Release a reservation manually
   */
  async releaseReservation(
    reservationId: string,
    storeId: string
  ): Promise<boolean> {
    const reservation = await prisma.inventoryReservation.findFirst({
      where: {
        id: reservationId,
        storeId,
        status: ReservationStatus.ACTIVE,
      },
    });

    if (!reservation) {
      return false;
    }

    await prisma.inventoryReservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.RELEASED },
    });

    // Create audit log
    await this.auditLogService.create(
      'UPDATE',
      'InventoryReservation',
      reservationId,
      {
        storeId,
        changes: {
          action: { old: 'ACTIVE', new: 'inventory_reservation_released' },
          status: { old: ReservationStatus.ACTIVE, new: ReservationStatus.RELEASED },
        },
      }
    );

    return true;
  }

  /**
   * Release all reservations for a cart
   */
  async releaseCartReservations(
    cartId: string,
    storeId: string
  ): Promise<number> {
    const result = await prisma.inventoryReservation.updateMany({
      where: {
        cartId,
        storeId,
        status: ReservationStatus.ACTIVE,
      },
      data: { status: ReservationStatus.RELEASED },
    });

    // Create audit log for batch release
    if (result.count > 0) {
      await this.auditLogService.create(
        'UPDATE',
        'InventoryReservation',
        `cart:${cartId}`,
        {
          storeId,
          changes: {
            action: { old: null, new: 'inventory_reservations_released_batch' },
            cartId: { old: cartId, new: cartId },
            count: { old: null, new: result.count },
          },
        }
      );
    }

    return result.count;
  }

  /**
   * Consume reservations when order is created
   * Atomically converts reservations to inventory deductions
   * CRITICAL: Prevents double decrement by setting status to CONSUMED
   */
  async consumeReservations(
    tx: Prisma.TransactionClient,
    storeId: string,
    cartId: string,
    orderId: string
  ): Promise<void> {
    // Get active reservations for this cart
    const reservations = await tx.inventoryReservation.findMany({
      where: {
        cartId,
        storeId,
        status: ReservationStatus.ACTIVE,
      },
    });

    if (reservations.length === 0) {
      return;
    }

    // Update all reservations to CONSUMED with orderId
    await tx.inventoryReservation.updateMany({
      where: {
        cartId,
        storeId,
        status: ReservationStatus.ACTIVE,
      },
      data: {
        status: ReservationStatus.CONSUMED,
        orderId,
      },
    });
  }

  /**
   * Extend a reservation (only allowed once per reservation)
   */
  async extendReservation(
    reservationId: string,
    storeId: string,
    extensionMinutes: number = MAX_EXTENSION_MINUTES
  ): Promise<ReservationResult | null> {
    // Validate extension time
    if (extensionMinutes > MAX_EXTENSION_MINUTES) {
      throw new Error(`Extension time cannot exceed ${MAX_EXTENSION_MINUTES} minutes`);
    }

    const reservation = await prisma.inventoryReservation.findFirst({
      where: {
        id: reservationId,
        storeId,
        status: ReservationStatus.ACTIVE,
      },
    });

    if (!reservation) {
      return null;
    }

    // Check if already extended
    if (reservation.extendedAt !== null) {
      throw new Error('Reservation can only be extended once');
    }

    // Calculate new expiration time
    // Use Math.max to handle the edge case where reservation hasn't expired yet but is close
    // to expiring. This ensures the extension always adds time from the later of:
    // - the current expiration time (if not yet expired), or
    // - the current time (if already expired, we extend from now)
    const baseTime = Math.max(reservation.expiresAt.getTime(), Date.now());
    const newExpiresAt = new Date(baseTime + extensionMinutes * 60 * 1000);

    const updated = await prisma.inventoryReservation.update({
      where: { id: reservationId },
      data: {
        expiresAt: newExpiresAt,
        extendedAt: new Date(),
      },
    });

    // Create audit log
    await this.auditLogService.create(
      'UPDATE',
      'InventoryReservation',
      reservationId,
      {
        storeId,
        changes: {
          action: { old: null, new: 'inventory_reservation_extended' },
          expiresAt: { old: reservation.expiresAt.toISOString(), new: newExpiresAt.toISOString() },
          extensionMinutes: { old: null, new: extensionMinutes },
        },
      }
    );

    return {
      id: updated.id,
      productId: updated.productId,
      variantId: updated.variantId ?? undefined,
      quantity: updated.quantity,
      expiresAt: updated.expiresAt,
      status: updated.status,
    };
  }

  // ==========================================================================
  // EXPIRATION SWEEPER
  // ==========================================================================

  /**
   * Expire all reservations past their expiration time
   * Should be run every minute via cron job
   * Returns count of expired reservations
   */
  async expireReservations(): Promise<number> {
    const now = new Date();

    // Get expired reservations before updating (for audit logging)
    const expiredReservations = await prisma.inventoryReservation.findMany({
      where: {
        status: ReservationStatus.ACTIVE,
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        storeId: true,
        productId: true,
        variantId: true,
        quantity: true,
      },
    });

    if (expiredReservations.length === 0) {
      return 0;
    }

    // Update all expired reservations
    const result = await prisma.inventoryReservation.updateMany({
      where: {
        status: ReservationStatus.ACTIVE,
        expiresAt: { lte: now },
      },
      data: { status: ReservationStatus.EXPIRED },
    });

    // Create audit log entries for expired reservations
    for (const reservation of expiredReservations) {
      await this.auditLogService.create(
        'UPDATE',
        'InventoryReservation',
        reservation.id,
        {
          storeId: reservation.storeId,
          changes: {
            action: { old: 'ACTIVE', new: 'inventory_reservation_expired' },
            status: { old: ReservationStatus.ACTIVE, new: ReservationStatus.EXPIRED },
            productId: { old: null, new: reservation.productId },
            variantId: { old: null, new: reservation.variantId ?? null },
            quantity: { old: null, new: reservation.quantity },
          },
        }
      );
    }

    return result.count;
  }

  // ==========================================================================
  // STOCK AVAILABILITY QUERIES
  // ==========================================================================

  /**
   * Get available stock for a product/variant
   * Available = Total Stock - Active Reservations
   */
  async getAvailableStock(
    storeId: string,
    productId: string,
    variantId?: string
  ): Promise<AvailableStockInfo> {
    return this.getAvailableStockInTransaction(
      prisma,
      storeId,
      productId,
      variantId
    );
  }

  /**
   * Internal method to get available stock within a transaction
   */
  private async getAvailableStockInTransaction(
    tx: Prisma.TransactionClient | typeof prisma,
    storeId: string,
    productId: string,
    variantId?: string
  ): Promise<AvailableStockInfo> {
    // Get total stock
    let totalStock = 0;

    if (variantId) {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { inventoryQty: true },
      });
      totalStock = variant?.inventoryQty ?? 0;
    } else {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { inventoryQty: true },
      });
      totalStock = product?.inventoryQty ?? 0;
    }

    // Get active reservation count
    const reservations = await tx.inventoryReservation.aggregate({
      where: {
        storeId,
        productId,
        variantId: variantId ?? null,
        status: ReservationStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      _sum: { quantity: true },
    });

    const reservedQuantity = reservations._sum.quantity ?? 0;
    const availableStock = Math.max(0, totalStock - reservedQuantity);

    return {
      productId,
      variantId,
      totalStock,
      reservedQuantity,
      availableStock,
    };
  }

  /**
   * Get active reservations for a cart
   */
  async getCartReservations(
    cartId: string,
    storeId: string
  ): Promise<ReservationResult[]> {
    const reservations = await prisma.inventoryReservation.findMany({
      where: {
        cartId,
        storeId,
        status: ReservationStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
    });

    return reservations.map((r) => ({
      id: r.id,
      productId: r.productId,
      variantId: r.variantId ?? undefined,
      quantity: r.quantity,
      expiresAt: r.expiresAt,
      status: r.status,
    }));
  }

  /**
   * Get total reserved quantity for a product (for low stock alert accuracy)
   */
  async getTotalReservedQuantity(
    storeId: string,
    productId: string,
    variantId?: string
  ): Promise<number> {
    const result = await prisma.inventoryReservation.aggregate({
      where: {
        storeId,
        productId,
        variantId: variantId ?? null,
        status: ReservationStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      _sum: { quantity: true },
    });

    return result._sum.quantity ?? 0;
  }

  /**
   * Check if reservation exists for a specific product in a cart
   */
  async hasReservation(
    cartId: string,
    storeId: string,
    productId: string,
    variantId?: string
  ): Promise<boolean> {
    const count = await prisma.inventoryReservation.count({
      where: {
        cartId,
        storeId,
        productId,
        variantId: variantId ?? null,
        status: ReservationStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
    });

    return count > 0;
  }
}
