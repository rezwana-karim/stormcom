// src/lib/services/wordpress-integration.service.ts
// WordPress/WooCommerce Integration Service
// Handles bidirectional order sync, product mapping, and inventory synchronization

import { prisma } from '@/lib/prisma';
import { 
  OrderStatus, 
  PaymentStatus, 
  SyncAction, 
  SyncStatus, 
  SyncDirection,
  IntegrationType,
  Prisma 
} from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface WebsiteIntegrationWithRelations {
  id: string;
  storeId: string;
  type: IntegrationType;
  websiteUrl: string | null;
  apiKey: string | null;
  isActive: boolean;
  syncProducts: boolean;
  syncOrders: boolean;
  syncInventory: boolean;
  orderSyncDirection: SyncDirection;
  lastSyncAt: Date | null;
}

export interface ExternalOrderItem {
  externalProductId: string;
  name: string;
  quantity: number;
  price: number;
  sku?: string;
  image?: string;
  variantId?: string;
}

export interface ExternalOrderData {
  externalOrderId: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address?: {
      address1: string;
      address2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
  };
  items: ExternalOrderItem[];
  subtotal: number;
  taxAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  total: number;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  shippingMethod?: string;
  customerNote?: string;
  source?: string;
}

export interface OrderStatusUpdate {
  externalOrderId: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  note?: string;
}

export interface SyncResult {
  success: boolean;
  orderId?: string;
  externalOrderId?: string;
  error?: string;
  action?: SyncAction;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const externalOrderItemSchema = z.object({
  externalProductId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().min(0),
  sku: z.string().optional(),
  image: z.string().optional(),
  variantId: z.string().optional(),
});

const externalOrderSchema = z.object({
  externalOrderId: z.string().min(1),
  customer: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
    address: z.object({
      address1: z.string().min(1),
      address2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().optional(),
      postalCode: z.string().min(1),
      country: z.string().min(1),
    }).optional(),
  }),
  items: z.array(externalOrderItemSchema).min(1),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).optional(),
  shippingAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  total: z.number().min(0),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.string().optional(),
  shippingMethod: z.string().optional(),
  customerNote: z.string().optional(),
  source: z.string().optional(),
});

const orderStatusUpdateSchema = z.object({
  externalOrderId: z.string().min(1),
  status: z.string().min(1),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
  note: z.string().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique API key for external integrations
 */
function generateApiKey(): string {
  return `sk_live_${crypto.randomBytes(24).toString('hex')}`;
}

/**
 * Generate a unique API secret for webhook verification
 */
function generateApiSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a unique order number
 */
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Map external order status to StormCom OrderStatus
 */
function mapExternalStatusToOrderStatus(externalStatus: string): OrderStatus {
  const statusMap: Record<string, OrderStatus> = {
    // WooCommerce statuses
    'pending': OrderStatus.PENDING,
    'processing': OrderStatus.PROCESSING,
    'on-hold': OrderStatus.PENDING,
    'completed': OrderStatus.DELIVERED,
    'cancelled': OrderStatus.CANCELED,
    'refunded': OrderStatus.REFUNDED,
    'failed': OrderStatus.PAYMENT_FAILED,
    // Facebook/Instagram statuses
    'created': OrderStatus.PENDING,
    'in_progress': OrderStatus.PROCESSING,
    'shipped': OrderStatus.SHIPPED,
    'delivered': OrderStatus.DELIVERED,
    'canceled': OrderStatus.CANCELED,
  };

  return statusMap[externalStatus.toLowerCase()] || OrderStatus.PENDING;
}

/**
 * Map StormCom OrderStatus to external (WooCommerce) status
 */
function mapOrderStatusToExternal(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    PENDING: 'pending',
    PAYMENT_FAILED: 'failed',
    PAID: 'processing',
    PROCESSING: 'processing',
    SHIPPED: 'completed',
    DELIVERED: 'completed',
    CANCELED: 'cancelled',
    REFUNDED: 'refunded',
  };

  return statusMap[status] || 'pending';
}

/**
 * Map external payment status to StormCom PaymentStatus
 */
function mapExternalPaymentStatus(externalStatus?: string): PaymentStatus {
  if (!externalStatus) return PaymentStatus.PENDING;

  const statusMap: Record<string, PaymentStatus> = {
    'pending': PaymentStatus.PENDING,
    'paid': PaymentStatus.PAID,
    'authorized': PaymentStatus.AUTHORIZED,
    'failed': PaymentStatus.FAILED,
    'refunded': PaymentStatus.REFUNDED,
    'disputed': PaymentStatus.DISPUTED,
  };

  return statusMap[externalStatus.toLowerCase()] || PaymentStatus.PENDING;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class WordPressIntegrationService {
  private static instance: WordPressIntegrationService;

  private constructor() {}

  public static getInstance(): WordPressIntegrationService {
    if (!WordPressIntegrationService.instance) {
      WordPressIntegrationService.instance = new WordPressIntegrationService();
    }
    return WordPressIntegrationService.instance;
  }

  // --------------------------------------------------------------------------
  // INTEGRATION MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Create or update a WordPress/WooCommerce integration
   */
  async createIntegration(
    storeId: string,
    websiteUrl: string,
    options: {
      syncProducts?: boolean;
      syncOrders?: boolean;
      syncInventory?: boolean;
      orderSyncDirection?: SyncDirection;
    } = {}
  ) {
    const apiKey = generateApiKey();
    const apiSecret = generateApiSecret();

    const integration = await prisma.websiteIntegration.upsert({
      where: { storeId },
      update: {
        websiteUrl,
        syncProducts: options.syncProducts ?? true,
        syncOrders: options.syncOrders ?? true,
        syncInventory: options.syncInventory ?? true,
        orderSyncDirection: options.orderSyncDirection ?? SyncDirection.TWO_WAY,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        storeId,
        type: IntegrationType.WOOCOMMERCE,
        websiteUrl,
        apiKey,
        apiSecret,
        syncProducts: options.syncProducts ?? true,
        syncOrders: options.syncOrders ?? true,
        syncInventory: options.syncInventory ?? true,
        orderSyncDirection: options.orderSyncDirection ?? SyncDirection.TWO_WAY,
        platform: 'wordpress',
        isActive: true,
      },
    });

    return {
      integration,
      apiKey: integration.apiKey, // Return the API key for initial setup
      apiSecret: integration.apiSecret,
    };
  }

  /**
   * Verify API key and return integration
   */
  async verifyApiKey(apiKey: string): Promise<WebsiteIntegrationWithRelations | null> {
    if (!apiKey) return null;

    const integration = await prisma.websiteIntegration.findFirst({
      where: {
        apiKey,
        isActive: true,
      },
      select: {
        id: true,
        storeId: true,
        type: true,
        websiteUrl: true,
        apiKey: true,
        isActive: true,
        syncProducts: true,
        syncOrders: true,
        syncInventory: true,
        orderSyncDirection: true,
        lastSyncAt: true,
      },
    });

    return integration;
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(
    body: string,
    signature: string | null
  ): Promise<WebsiteIntegrationWithRelations | null> {
    if (!signature) return null;

    // Find integration by signature format
    // In production, you'd parse the signature to get the integration ID
    // For now, we'll use a simplified approach
    const integrations = await prisma.websiteIntegration.findMany({
      where: { isActive: true },
    });

    for (const integration of integrations) {
      if (integration.apiSecret) {
        const expectedSignature = crypto
          .createHmac('sha256', integration.apiSecret)
          .update(body)
          .digest('hex');

        if (signature === expectedSignature || signature === `sha256=${expectedSignature}`) {
          return integration as WebsiteIntegrationWithRelations;
        }
      }
    }

    return null;
  }

  // --------------------------------------------------------------------------
  // ORDER SYNC: EXTERNAL → STORMCOM
  // --------------------------------------------------------------------------

  /**
   * Create order from external source (WooCommerce → StormCom)
   * Implements duplicate detection using external_id
   */
  async createOrderFromExternal(
    integrationId: string,
    storeId: string,
    orderData: ExternalOrderData
  ): Promise<SyncResult> {
    try {
      // Validate input
      const validatedData = externalOrderSchema.parse(orderData);

      // Check for duplicate order (by external_id)
      const existingMapping = await prisma.orderMapping.findUnique({
        where: {
          integrationId_externalOrderId: {
            integrationId,
            externalOrderId: validatedData.externalOrderId,
          },
        },
        include: { order: true },
      });

      if (existingMapping) {
        // Order already exists - log and return
        await this.logSync(integrationId, {
          action: SyncAction.SYNC,
          entityType: 'order',
          entityId: existingMapping.stormcomOrderId,
          externalId: validatedData.externalOrderId,
          status: SyncStatus.SKIPPED,
          errorMessage: 'Order already synced',
        });

        return {
          success: true,
          orderId: existingMapping.stormcomOrderId,
          externalOrderId: validatedData.externalOrderId,
          action: SyncAction.SYNC,
        };
      }

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Find or create customer
        let customerId: string | null = null;
        
        const existingCustomer = await tx.customer.findFirst({
          where: {
            storeId,
            email: validatedData.customer.email,
          },
        });

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const newCustomer = await tx.customer.create({
            data: {
              storeId,
              email: validatedData.customer.email,
              firstName: validatedData.customer.firstName,
              lastName: validatedData.customer.lastName,
              phone: validatedData.customer.phone,
            },
          });
          customerId = newCustomer.id;
        }

        // Map external product IDs to StormCom IDs
        const mappedItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];
        
        for (const item of validatedData.items) {
          // Try to find product mapping
          const productMapping = await tx.productMapping.findUnique({
            where: {
              integrationId_externalProductId: {
                integrationId,
                externalProductId: item.externalProductId,
              },
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  thumbnailUrl: true,
                },
              },
            },
          });

          mappedItems.push({
            productId: productMapping?.stormcomProductId || null,
            productName: productMapping?.product.name || item.name,
            variantName: null,
            sku: productMapping?.product.sku || item.sku || 'EXTERNAL',
            image: productMapping?.product.thumbnailUrl || item.image || null,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: item.price * item.quantity,
          });
        }

        // Create order
        const order = await tx.order.create({
          data: {
            storeId,
            customerId,
            orderNumber: generateOrderNumber(),
            status: mapExternalStatusToOrderStatus(validatedData.status || 'pending'),
            paymentStatus: mapExternalPaymentStatus(validatedData.paymentStatus),
            subtotal: validatedData.subtotal,
            taxAmount: validatedData.taxAmount || 0,
            shippingAmount: validatedData.shippingAmount || 0,
            discountAmount: validatedData.discountAmount || 0,
            totalAmount: validatedData.total,
            shippingAddress: validatedData.customer.address 
              ? JSON.stringify(validatedData.customer.address) 
              : null,
            billingAddress: validatedData.customer.address 
              ? JSON.stringify(validatedData.customer.address) 
              : null,
            shippingMethod: validatedData.shippingMethod,
            customerNote: validatedData.customerNote,
            adminNote: `Synced from ${validatedData.source || 'WordPress'} (External ID: ${validatedData.externalOrderId})`,
            items: {
              create: mappedItems,
            },
          },
          include: {
            items: true,
            customer: true,
          },
        });

        // Create order mapping
        await tx.orderMapping.create({
          data: {
            integrationId,
            stormcomOrderId: order.id,
            externalOrderId: validatedData.externalOrderId,
            syncDirection: 'TO_STORMCOM',
          },
        });

        // Deduct inventory for mapped products
        for (const item of validatedData.items) {
          const productMapping = await tx.productMapping.findUnique({
            where: {
              integrationId_externalProductId: {
                integrationId,
                externalProductId: item.externalProductId,
              },
            },
          });

          if (productMapping) {
            const product = await tx.product.findUnique({
              where: { id: productMapping.stormcomProductId },
              select: { inventoryQty: true, lowStockThreshold: true, trackInventory: true },
            });

            if (product && product.trackInventory) {
              const newQty = Math.max(0, product.inventoryQty - item.quantity);
              await tx.product.update({
                where: { id: productMapping.stormcomProductId },
                data: {
                  inventoryQty: newQty,
                  inventoryStatus: newQty === 0 
                    ? 'OUT_OF_STOCK' 
                    : newQty <= product.lowStockThreshold 
                      ? 'LOW_STOCK' 
                      : 'IN_STOCK',
                },
              });

              // Log inventory change
              await tx.inventoryLog.create({
                data: {
                  storeId,
                  productId: productMapping.stormcomProductId,
                  previousQty: product.inventoryQty,
                  newQty,
                  changeQty: -item.quantity,
                  reason: 'Sale',
                  note: `External order ${validatedData.externalOrderId}`,
                },
              });
            }
          }
        }

        return order;
      });

      // Log successful sync
      await this.logSync(integrationId, {
        action: SyncAction.CREATE,
        entityType: 'order',
        entityId: result.id,
        externalId: validatedData.externalOrderId,
        status: SyncStatus.SUCCESS,
      });

      // Update last sync timestamp
      await prisma.websiteIntegration.update({
        where: { id: integrationId },
        data: { lastSyncAt: new Date() },
      });

      return {
        success: true,
        orderId: result.id,
        externalOrderId: validatedData.externalOrderId,
        action: SyncAction.CREATE,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logSync(integrationId, {
        action: SyncAction.CREATE,
        entityType: 'order',
        externalId: orderData.externalOrderId,
        status: SyncStatus.FAILED,
        errorMessage,
      });

      return {
        success: false,
        externalOrderId: orderData.externalOrderId,
        error: errorMessage,
        action: SyncAction.CREATE,
      };
    }
  }

  // --------------------------------------------------------------------------
  // ORDER STATUS SYNC (BIDIRECTIONAL)
  // --------------------------------------------------------------------------

  /**
   * Update order status from external source (WooCommerce → StormCom)
   */
  async updateOrderStatusFromExternal(
    integrationId: string,
    storeId: string,
    statusUpdate: OrderStatusUpdate
  ): Promise<SyncResult> {
    try {
      // Validate input
      const validatedData = orderStatusUpdateSchema.parse(statusUpdate);

      // Find the order mapping
      const mapping = await prisma.orderMapping.findUnique({
        where: {
          integrationId_externalOrderId: {
            integrationId,
            externalOrderId: validatedData.externalOrderId,
          },
        },
        include: {
          order: true,
        },
      });

      if (!mapping) {
        return {
          success: false,
          externalOrderId: validatedData.externalOrderId,
          error: 'Order not found',
          action: SyncAction.UPDATE,
        };
      }

      // Verify store ownership
      if (mapping.order.storeId !== storeId) {
        return {
          success: false,
          externalOrderId: validatedData.externalOrderId,
          error: 'Order does not belong to this store',
          action: SyncAction.UPDATE,
        };
      }

      // Map external status to OrderStatus
      const newStatus = mapExternalStatusToOrderStatus(validatedData.status);

      // Update order
      const updatedOrder = await prisma.order.update({
        where: { id: mapping.stormcomOrderId },
        data: {
          status: newStatus,
          trackingNumber: validatedData.trackingNumber || undefined,
          trackingUrl: validatedData.trackingUrl || undefined,
          adminNote: validatedData.note 
            ? `${mapping.order.adminNote || ''}\n[External Update] ${validatedData.note}`.trim()
            : undefined,
          fulfilledAt: newStatus === OrderStatus.DELIVERED ? new Date() : undefined,
          canceledAt: newStatus === OrderStatus.CANCELED ? new Date() : undefined,
        },
      });

      // Update mapping last synced timestamp
      await prisma.orderMapping.update({
        where: { id: mapping.id },
        data: { 
          lastSyncedAt: new Date(),
          syncDirection: 'TO_STORMCOM',
        },
      });

      // Handle refunds - restore inventory
      if (newStatus === OrderStatus.REFUNDED || newStatus === OrderStatus.CANCELED) {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: mapping.stormcomOrderId },
        });

        for (const item of orderItems) {
          if (item.productId) {
            const product = await prisma.product.findUnique({
              where: { id: item.productId },
              select: { inventoryQty: true, lowStockThreshold: true, trackInventory: true },
            });

            if (product && product.trackInventory) {
              const newQty = product.inventoryQty + item.quantity;
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  inventoryQty: newQty,
                  inventoryStatus: newQty === 0 
                    ? 'OUT_OF_STOCK' 
                    : newQty <= product.lowStockThreshold 
                      ? 'LOW_STOCK' 
                      : 'IN_STOCK',
                },
              });

              await prisma.inventoryLog.create({
                data: {
                  storeId,
                  productId: item.productId,
                  previousQty: product.inventoryQty,
                  newQty,
                  changeQty: item.quantity,
                  reason: newStatus === OrderStatus.REFUNDED ? 'Refund' : 'Cancellation',
                  note: `External order ${validatedData.externalOrderId}`,
                },
              });
            }
          }
        }
      }

      // Log sync
      await this.logSync(integrationId, {
        action: SyncAction.UPDATE,
        entityType: 'order',
        entityId: mapping.stormcomOrderId,
        externalId: validatedData.externalOrderId,
        status: SyncStatus.SUCCESS,
      });

      return {
        success: true,
        orderId: mapping.stormcomOrderId,
        externalOrderId: validatedData.externalOrderId,
        action: SyncAction.UPDATE,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logSync(integrationId, {
        action: SyncAction.UPDATE,
        entityType: 'order',
        externalId: statusUpdate.externalOrderId,
        status: SyncStatus.FAILED,
        errorMessage,
      });

      return {
        success: false,
        externalOrderId: statusUpdate.externalOrderId,
        error: errorMessage,
        action: SyncAction.UPDATE,
      };
    }
  }

  /**
   * Get orders that need to be synced to external system (StormCom → WooCommerce)
   * Returns orders from Facebook/Instagram or other channels that should appear in WooCommerce
   */
  async getOrdersForExternalSync(
    integrationId: string,
    storeId: string,
    options: {
      since?: Date;
      limit?: number;
      includeAlreadySynced?: boolean;
    } = {}
  ) {
    const { since, limit = 50, includeAlreadySynced = false } = options;

    // Get orders that haven't been synced yet OR have been updated since last sync
    const orders = await prisma.order.findMany({
      where: {
        storeId,
        deletedAt: null,
        ...(since && { createdAt: { gte: since } }),
        // Only include orders not already synced, unless requested
        ...(includeAlreadySynced ? {} : {
          mappings: {
            none: {
              integrationId,
            },
          },
        }),
      },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        mappings: {
          where: { integrationId },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Transform orders to external format
    return orders.map(order => ({
      stormcomOrderId: order.id,
      externalOrderId: order.mappings[0]?.externalOrderId || null,
      orderNumber: order.orderNumber,
      status: mapOrderStatusToExternal(order.status),
      customer: {
        email: order.customer?.email || '',
        firstName: order.customer?.firstName || '',
        lastName: order.customer?.lastName || '',
        phone: order.customer?.phone || '',
        address: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
      },
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        total: item.totalAmount,
      })),
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      shippingAmount: order.shippingAmount,
      discountAmount: order.discountAmount,
      total: order.totalAmount,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      customerNote: order.customerNote,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      alreadySynced: order.mappings.length > 0,
      lastSyncedAt: order.mappings[0]?.lastSyncedAt || null,
    }));
  }

  /**
   * Mark order as synced to external system
   */
  async markOrderAsSyncedToExternal(
    integrationId: string,
    stormcomOrderId: string,
    externalOrderId: string
  ): Promise<void> {
    await prisma.orderMapping.upsert({
      where: {
        integrationId_stormcomOrderId: {
          integrationId,
          stormcomOrderId,
        },
      },
      update: {
        externalOrderId,
        lastSyncedAt: new Date(),
        syncDirection: 'FROM_STORMCOM',
      },
      create: {
        integrationId,
        stormcomOrderId,
        externalOrderId,
        syncDirection: 'FROM_STORMCOM',
      },
    });

    await this.logSync(integrationId, {
      action: SyncAction.CREATE,
      entityType: 'order',
      entityId: stormcomOrderId,
      externalId: externalOrderId,
      status: SyncStatus.SUCCESS,
    });
  }

  // --------------------------------------------------------------------------
  // INVENTORY SYNC
  // --------------------------------------------------------------------------

  /**
   * Update inventory from external system
   */
  async updateInventoryFromExternal(
    integrationId: string,
    storeId: string,
    externalProductId: string,
    quantity: number
  ): Promise<SyncResult> {
    try {
      // Find product mapping
      const mapping = await prisma.productMapping.findUnique({
        where: {
          integrationId_externalProductId: {
            integrationId,
            externalProductId,
          },
        },
        include: {
          product: true,
        },
      });

      if (!mapping) {
        return {
          success: false,
          error: 'Product mapping not found',
          action: SyncAction.UPDATE,
        };
      }

      // Verify store ownership
      if (mapping.product.storeId !== storeId) {
        return {
          success: false,
          error: 'Product does not belong to this store',
          action: SyncAction.UPDATE,
        };
      }

      const previousQty = mapping.product.inventoryQty;
      const newQty = Math.max(0, quantity);

      // Update product inventory
      await prisma.product.update({
        where: { id: mapping.stormcomProductId },
        data: {
          inventoryQty: newQty,
          inventoryStatus: newQty === 0 
            ? 'OUT_OF_STOCK' 
            : newQty <= mapping.product.lowStockThreshold 
              ? 'LOW_STOCK' 
              : 'IN_STOCK',
        },
      });

      // Log inventory change
      await prisma.inventoryLog.create({
        data: {
          storeId,
          productId: mapping.stormcomProductId,
          previousQty,
          newQty,
          changeQty: newQty - previousQty,
          reason: 'External Sync',
          note: `Synced from external product ${externalProductId}`,
        },
      });

      await this.logSync(integrationId, {
        action: SyncAction.UPDATE,
        entityType: 'inventory',
        entityId: mapping.stormcomProductId,
        externalId: externalProductId,
        status: SyncStatus.SUCCESS,
      });

      return {
        success: true,
        action: SyncAction.UPDATE,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.logSync(integrationId, {
        action: SyncAction.UPDATE,
        entityType: 'inventory',
        externalId: externalProductId,
        status: SyncStatus.FAILED,
        errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        action: SyncAction.UPDATE,
      };
    }
  }

  /**
   * Get inventory for external sync
   */
  async getInventoryForExternalSync(
    integrationId: string,
    storeId: string
  ) {
    // Get all product mappings with current inventory
    const mappings = await prisma.productMapping.findMany({
      where: {
        integrationId,
        product: {
          storeId,
          deletedAt: null,
          trackInventory: true,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            inventoryQty: true,
            inventoryStatus: true,
          },
        },
      },
    });

    return mappings.map(mapping => ({
      stormcomProductId: mapping.stormcomProductId,
      externalProductId: mapping.externalProductId,
      name: mapping.product.name,
      sku: mapping.product.sku,
      quantity: mapping.product.inventoryQty,
      status: mapping.product.inventoryStatus,
    }));
  }

  // --------------------------------------------------------------------------
  // SYNC LOGGING
  // --------------------------------------------------------------------------

  /**
   * Log sync activity
   */
  private async logSync(
    integrationId: string,
    data: {
      action: SyncAction;
      entityType: string;
      entityId?: string;
      externalId?: string;
      status: SyncStatus;
      errorMessage?: string;
      requestData?: unknown;
      responseData?: unknown;
    }
  ): Promise<void> {
    await prisma.syncLog.create({
      data: {
        integrationId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        externalId: data.externalId,
        status: data.status,
        errorMessage: data.errorMessage,
        requestData: data.requestData ? JSON.stringify(data.requestData) : null,
        responseData: data.responseData ? JSON.stringify(data.responseData) : null,
      },
    });
  }

  /**
   * Get sync logs for an integration
   */
  async getSyncLogs(
    integrationId: string,
    options: {
      entityType?: string;
      status?: SyncStatus;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { entityType, status, limit = 50, offset = 0 } = options;

    const [logs, total] = await Promise.all([
      prisma.syncLog.findMany({
        where: {
          integrationId,
          ...(entityType && { entityType }),
          ...(status && { status }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.syncLog.count({
        where: {
          integrationId,
          ...(entityType && { entityType }),
          ...(status && { status }),
        },
      }),
    ]);

    return { logs, total };
  }
}

// Export singleton instance
export const wordpressIntegrationService = WordPressIntegrationService.getInstance();
