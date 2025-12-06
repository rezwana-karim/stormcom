// src/lib/services/order.service.ts
// Order Service - Handles order management operations

import { prisma } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

export type OrderListParams = {
  storeId: string;
  page?: number;
  perPage?: number;
  status?: OrderStatus;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'totalAmount' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
};

export type OrderUpdateStatusParams = {
  orderId: string;
  storeId: string;
  newStatus?: OrderStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  adminNote?: string;
};

/**
 * Order with full details including customer, items, and store
 * Used by getOrderById, cancelOrder, and refundOrder methods
 */
export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    customer: true;
    items: {
      include: {
        product: {
          select: {
            id: true;
            name: true;
            slug: true;
            thumbnailUrl: true;
            price: true;
            sku: true;
          };
        };
        variant: {
          select: {
            id: true;
            name: true;
            sku: true;
            price: true;
          };
        };
      };
    };
    store: {
      select: {
        id: true;
        name: true;
        slug: true;
        email: true;
      };
    };
  };
}>;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const addressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string(),
  country: z.string().default('BD'),
});

export const createOrderSchema = z.object({
  storeId: z.string().cuid(),
  customerId: z.string().cuid().optional().nullable(),
  orderNumber: z.string().min(1),
  status: z.nativeEnum(OrderStatus).default(OrderStatus.PENDING),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_BANKING', 'BANK_TRANSFER', 'CASH_ON_DELIVERY']).optional().nullable(),
  paymentGateway: z.enum(['STRIPE', 'SSLCOMMERZ', 'MANUAL']).optional().nullable(),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).default(0),
  shippingAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  discountCode: z.string().optional().nullable(),
  shippingMethod: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  trackingUrl: z.string().optional().nullable(),
  shippingAddress: addressSchema.optional().nullable(),
  billingAddress: addressSchema.optional().nullable(),
  customerNote: z.string().optional().nullable(),
  adminNote: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      variantId: z.string().cuid().optional().nullable(),
      productName: z.string().min(1),
      variantName: z.string().optional().nullable(),
      sku: z.string().min(1),
      image: z.string().optional().nullable(),
      price: z.number().min(0),
      quantity: z.number().int().positive(),
      subtotal: z.number().min(0),
      taxAmount: z.number().min(0).default(0),
      discountAmount: z.number().min(0).default(0),
      totalAmount: z.number().min(0),
    })
  ).min(1),
});

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class OrderService {
  private static instance: OrderService;

  private constructor() {}

  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  /**
   * Validate order status transitions
   * Allows most transitions except backwards progression or invalid jumps
   */
  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    // Allow staying in same status (for tracking updates)
    if (currentStatus === newStatus) {
      return true;
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED, OrderStatus.PROCESSING, OrderStatus.CANCELED],
      PAYMENT_FAILED: [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.CANCELED],
      PAID: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.CANCELED, OrderStatus.REFUNDED],
      PROCESSING: [OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELED, OrderStatus.REFUNDED],
      SHIPPED: [OrderStatus.DELIVERED, OrderStatus.CANCELED, OrderStatus.REFUNDED],
      DELIVERED: [OrderStatus.REFUNDED],
      CANCELED: [OrderStatus.PENDING, OrderStatus.REFUNDED], // Allow reactivation
      REFUNDED: [], // Terminal state
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * List orders with pagination and filters
   */
  async listOrders(params: OrderListParams) {
    const {
      storeId,
      page = 1,
      perPage = 20,
      status,
      search,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const limit = Math.min(Math.max(1, perPage), 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.OrderWhereInput = {
      storeId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customer: { firstName: { contains: search } } },
        { customer: { lastName: { contains: search } } },
        { customer: { email: { contains: search } } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    // Execute queries in parallel
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  thumbnailUrl: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        perPage: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string, storeId: string) {
    return prisma.order.findFirst({
      where: {
        id: orderId,
        storeId,
        deletedAt: null,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnailUrl: true,
                price: true,
                sku: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
              },
            },
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Create a new order
   */
  async createOrder(data: z.infer<typeof createOrderSchema>) {
    const validatedData = createOrderSchema.parse(data);

    const order = await prisma.order.create({
      data: {
        storeId: validatedData.storeId,
        customerId: validatedData.customerId,
        orderNumber: validatedData.orderNumber,
        status: validatedData.status,
        paymentStatus: validatedData.paymentStatus,
        paymentMethod: validatedData.paymentMethod,
        paymentGateway: validatedData.paymentGateway,
        subtotal: validatedData.subtotal,
        taxAmount: validatedData.taxAmount,
        shippingAmount: validatedData.shippingAmount,
        discountAmount: validatedData.discountAmount,
        totalAmount: validatedData.totalAmount,
        // SECURITY: Normalize discount code to uppercase for consistent comparison
        discountCode: validatedData.discountCode?.trim().toUpperCase() ?? null,
        shippingMethod: validatedData.shippingMethod,
        trackingNumber: validatedData.trackingNumber,
        trackingUrl: validatedData.trackingUrl,
        shippingAddress: validatedData.shippingAddress ? JSON.stringify(validatedData.shippingAddress) : null,
        billingAddress: validatedData.billingAddress ? JSON.stringify(validatedData.billingAddress) : null,
        customerNote: validatedData.customerNote,
        adminNote: validatedData.adminNote,
        ipAddress: validatedData.ipAddress,
        items: {
          create: validatedData.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            sku: item.sku,
            image: item.image,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            taxAmount: item.taxAmount,
            discountAmount: item.discountAmount,
            totalAmount: item.totalAmount,
          })),
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    return order;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(params: OrderUpdateStatusParams) {
    const { orderId, storeId, newStatus, trackingNumber, trackingUrl, adminNote } = params;

    // Get current order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        storeId,
        deletedAt: null,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition if newStatus is provided
    if (newStatus && !this.isValidStatusTransition(order.status, newStatus)) {
      throw new Error(
        `Invalid status transition from ${order.status} to ${newStatus}`
      );
    }

    // Build update data
    const updateData: Prisma.OrderUpdateInput = {
      updatedAt: new Date(),
    };

    // Update status if provided
    if (newStatus) {
      updateData.status = newStatus;
    }

    // Add tracking info if provided
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }
    if (trackingUrl !== undefined) {
      updateData.trackingUrl = trackingUrl;
    }
    if (adminNote !== undefined) {
      updateData.adminNote = adminNote;
    }

    // Update order-specific timestamps and statuses (only if status is changing)
    if (newStatus && newStatus !== order.status) {
      if (newStatus === OrderStatus.DELIVERED) {
        updateData.fulfilledAt = new Date();
      } else if (newStatus === OrderStatus.CANCELED) {
        updateData.canceledAt = new Date();
      }
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnailUrl: true,
                price: true,
                sku: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
              },
            },
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  /**
   * Delete order (soft delete)
   */
  async deleteOrder(orderId: string, storeId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        storeId,
        deletedAt: null,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Only allow deletion of pending or canceled orders
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CANCELED) {
      throw new Error(
        `Cannot delete order in ${order.status} status. Only PENDING or CANCELED orders can be deleted.`
      );
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        deletedAt: new Date(),
        status: OrderStatus.CANCELED,
      },
    });
  }

  /**
   * Cancel order and restore inventory
   */
  async cancelOrder(orderId: string, storeId: string, reason?: string): Promise<OrderWithDetails | null> {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        storeId,
        deletedAt: null,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Only allow cancellation of certain statuses
    const cancellableStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.PAID];
    if (!cancellableStatuses.includes(order.status as OrderStatus)) {
      throw new Error(`Cannot cancel order in ${order.status} status`);
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELED,
        canceledAt: new Date(),
        cancelReason: reason || 'Order canceled',
        adminNote: reason || 'Order canceled',
      },
    });

    // Restore inventory for each item using InventoryService
    const { InventoryService } = await import('./inventory.service');
    const inventoryService = InventoryService.getInstance();

    const items = order.items
      .filter(item => item.productId !== null)
      .map(item => ({
        productId: item.productId!,
        variantId: item.variantId ?? undefined,
        quantity: item.quantity
      }));

    if (items.length > 0) {
      await inventoryService.restoreStockForCancellation(
        storeId,
        items,
        orderId
      );
    }

    return this.getOrderById(orderId, storeId);
  }

  /**
   * Refund order and restore inventory
   */
  async refundOrder(
    orderId: string,
    storeId: string,
    refundAmount?: number,
    reason?: string
  ): Promise<OrderWithDetails | null> {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        storeId,
        deletedAt: null,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Only allow refund of completed or shipped orders
    const refundableStatuses: OrderStatus[] = [OrderStatus.DELIVERED, OrderStatus.SHIPPED];
    if (!refundableStatuses.includes(order.status as OrderStatus)) {
      throw new Error(`Cannot refund order in ${order.status} status`);
    }

    const actualRefundAmount = refundAmount || order.totalAmount;

    // Update order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.REFUNDED,
        paymentStatus: PaymentStatus.REFUNDED,
        adminNote: reason || `Refunded ${actualRefundAmount}`,
      },
    });

    // Restore inventory for each item using InventoryService
    const { InventoryService } = await import('./inventory.service');
    const inventoryService = InventoryService.getInstance();

    const items = order.items
      .filter(item => item.productId !== null)
      .map(item => ({
        productId: item.productId!,
        variantId: item.variantId ?? undefined,
        quantity: item.quantity
      }));

    if (items.length > 0) {
      await inventoryService.restoreStockForReturn(
        storeId,
        items,
        orderId
      );
    }

    // TODO: Process actual refund with payment gateway
    // This would integrate with Stripe, PayPal, etc.

    return this.getOrderById(orderId, storeId);
  }

  /**
   * Get invoice data for PDF generation
   */
  async getInvoiceData(orderId: string, storeId?: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        ...(storeId && { storeId }),
        deletedAt: null,
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    // Format invoice data
    return {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      store: order.store,
      customer: order.customer,
      billingAddress: order.billingAddress as unknown as Record<string, unknown>,
      shippingAddress: order.shippingAddress as unknown as Record<string, unknown>,
      items: order.items.map(item => ({
        productName: item.product?.name || item.productName || 'Unknown Product',
        variantName: item.variant?.name || item.variantName || null,
        sku: item.variant?.sku || item.product?.sku || item.sku || 'N/A',
        quantity: item.quantity,
        unitPrice: item.price,
        lineTotal: item.totalAmount,
      })),
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      shippingAmount: order.shippingAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
    };
  }
}
