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

/**
 * Input for creating an order with items (API-style input)
 */
export interface CreateOrderInput {
  customerId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  billingAddress?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod: 'STRIPE' | 'BKASH' | 'CASH_ON_DELIVERY';
  paymentGateway?: 'STRIPE' | 'SSLCOMMERZ' | 'MANUAL';
  shippingMethod?: string;
  notes?: string;
}

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
   * Create order atomically with inventory decrement
   * Uses Prisma transaction to ensure data consistency
   * Supports idempotency key to prevent duplicate orders
   */
  async createOrderWithItems(
    input: CreateOrderInput,
    storeId: string,
    userId: string,
    idempotencyKey?: string
  ) {
    // Check idempotency key to prevent duplicates
    if (idempotencyKey) {
      const existing = await prisma.order.findFirst({
        where: { storeId, idempotencyKey },
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true } },
              variant: { select: { name: true, sku: true } }
            }
          }
        }
      });
      if (existing) {
        console.log(`Duplicate order prevented: ${idempotencyKey}`);
        return existing;
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Validate items and check stock
      const { InventoryService } = await import('./inventory.service');
      const inventoryService = InventoryService.getInstance();
      
      for (const item of input.items) {
        const target = item.variantId
          ? await tx.productVariant.findUnique({ 
              where: { id: item.variantId },
              select: { id: true, name: true, inventoryQty: true }
            })
          : await tx.product.findUnique({ 
              where: { id: item.productId },
              select: { id: true, name: true, inventoryQty: true }
            });

        if (!target) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if ((target.inventoryQty || 0) < item.quantity) {
          throw new Error(`Insufficient stock for ${target.name || 'product'}: ${target.inventoryQty} available, ${item.quantity} requested`);
        }
      }

      // 2. Generate order number (ORD-YYYYMMDD-XXXX format)
      const orderNumber = await this.generateOrderNumberWithDate(storeId, tx);

      // 3. Calculate totals
      const subtotal = input.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shippingCost = 0; // TODO: Calculate from ShippingMethod
      const tax = 0; // TODO: Calculate based on location
      const totalAmount = subtotal + shippingCost + tax;

      // 4. Fetch product details for order items
      const productIds = input.items.map(item => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true, thumbnailUrl: true }
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      // Fetch variant details if any
      const variantIds = input.items.filter(item => item.variantId).map(item => item.variantId!);
      let variantMap = new Map<string, { id: string; name: string; sku: string }>();
      if (variantIds.length > 0) {
        const variants = await tx.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, name: true, sku: true }
        });
        variantMap = new Map(variants.map(v => [v.id, v]));
      }

      // Map payment method to enum
      const paymentMethodMap: Record<string, 'CREDIT_CARD' | 'MOBILE_BANKING' | 'CASH_ON_DELIVERY'> = {
        'STRIPE': 'CREDIT_CARD',
        'BKASH': 'MOBILE_BANKING',
        'CASH_ON_DELIVERY': 'CASH_ON_DELIVERY'
      };

      // Map payment gateway to enum
      const paymentGatewayMap: Record<string, 'STRIPE' | 'SSLCOMMERZ' | 'MANUAL'> = {
        'STRIPE': 'STRIPE',
        'BKASH': 'SSLCOMMERZ',
        'CASH_ON_DELIVERY': 'MANUAL'
      };

      // 5. Create order
      const order = await tx.order.create({
        data: {
          storeId,
          orderNumber,
          customerId: input.customerId,
          customerEmail: input.customerEmail,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          shippingAddress: input.shippingAddress,
          billingAddress: input.billingAddress || input.shippingAddress,
          subtotal,
          shippingAmount: shippingCost,
          taxAmount: tax,
          totalAmount,
          paymentMethod: paymentMethodMap[input.paymentMethod] || null,
          paymentGateway: paymentGatewayMap[input.paymentMethod] || null,
          paymentStatus: input.paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PENDING',
          status: 'PENDING',
          shippingMethod: input.shippingMethod,
          customerNote: input.notes,
          idempotencyKey,
          items: {
            create: input.items.map(item => {
              const product = productMap.get(item.productId);
              const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
              return {
                productId: item.productId,
                variantId: item.variantId,
                productName: product?.name || '',
                variantName: variant?.name,
                sku: variant?.sku || product?.sku || '',
                image: product?.thumbnailUrl,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity,
                taxAmount: 0,
                discountAmount: 0,
                totalAmount: item.price * item.quantity
              };
            })
          }
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true } },
              variant: { select: { name: true, sku: true } }
            }
          }
        }
      });

      // 6. Decrement inventory atomically using InventoryService
      const itemsForInventory = input.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      }));
      
      await inventoryService.deductStock(
        storeId,
        itemsForInventory,
        order.id,
        userId
      );

      // 7. Send order notification (async, don't block)
      this.sendOrderNotification(order).catch(err =>
        console.error('Failed to send order notification:', err)
      );

      return order;
    });
  }

  /**
   * Generate sequential order number per store
   * Format: ORD-YYYYMMDD-XXXX (e.g., ORD-20251125-0001)
   */
  private async generateOrderNumberWithDate(
    storeId: string,
    tx: Prisma.TransactionClient
  ): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const prefix = `ORD-${today}`;

    // Get last order number for today
    const lastOrder = await tx.order.findFirst({
      where: {
        storeId,
        orderNumber: { startsWith: prefix }
      },
      orderBy: { orderNumber: 'desc' }
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `${prefix}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Process refund with Stripe integration
   * Restores inventory and marks order as refunded
   */
  async processRefund(
    orderId: string,
    storeId: string,
    amount: number,
    reason: string,
    userId: string
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, storeId, deletedAt: null },
      include: { items: true }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.paymentStatus !== 'PAID') {
      throw new Error('Cannot refund unpaid order');
    }

    // Refund via payment gateway
    let stripeRefundId: string | undefined;
    if (order.paymentGateway === 'STRIPE' && order.stripePaymentIntentId) {
      try {
        const stripe = (await import('stripe')).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2025-08-27.basil'
        });

        const refund = await stripeClient.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          amount: Math.round(amount * 100), // Convert to cents
          reason: 'requested_by_customer',
          metadata: { orderId, reason }
        });
        stripeRefundId = refund.id;
      } catch (error) {
        console.error('Stripe refund failed:', error);
        throw new Error('Failed to process Stripe refund');
      }
    }

    // Update order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED',
        refundedAmount: amount,
        refundReason: reason,
        stripeRefundId
      }
    });

    // Restore inventory
    const { InventoryService } = await import('./inventory.service');
    const inventoryService = InventoryService.getInstance();
    
    const items = order.items
      .filter(item => item.productId !== null)
      .map(item => ({
        productId: item.productId!,
        variantId: item.variantId || undefined,
        quantity: item.quantity
      }));

    if (items.length > 0) {
      await inventoryService.restoreStock(
        storeId,
        items,
        orderId,
        'Refund',
        userId
      );
    }

    return { success: true, stripeRefundId };
  }

  /**
   * Send order notification email to customer
   */
  private async sendOrderNotification(order: {
    orderNumber: string;
    customerEmail?: string | null;
    totalAmount: number;
  }) {
    if (!order.customerEmail) return;

    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'orders@stormcom.app',
        to: order.customerEmail,
        subject: `Order Confirmation - ${order.orderNumber}`,
        html: `
          <h1>Thank you for your order!</h1>
          <p>Order Number: <strong>${order.orderNumber}</strong></p>
          <p>Total: $${order.totalAmount.toFixed(2)}</p>
          <p>We'll send you a shipping confirmation when your order ships.</p>
        `
      });
    } catch (error) {
      console.error('Failed to send order notification email:', error);
      // Don't throw - email failure shouldn't fail the order
    }
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
        discountCode: validatedData.discountCode,
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
        updateData.deliveredAt = new Date();
      } else if (newStatus === OrderStatus.CANCELED) {
        updateData.canceledAt = new Date();
      }
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: true,
        customer: true,
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
        adminNote: reason || 'Order canceled',
      },
    });

    // Restore inventory for each item
    const { InventoryService } = await import('./inventory.service');
    const inventoryService = InventoryService.getInstance();

    const items = order.items
      .filter(item => item.productId !== null)
      .map(item => ({
        productId: item.productId!,
        quantity: item.quantity
      }));

    if (items.length > 0) {
      await inventoryService.restoreStock(
        storeId,
        items,
        orderId,
        'Cancellation'
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

    // Restore inventory for each item
    const { InventoryService } = await import('./inventory.service');
    const inventoryService = InventoryService.getInstance();

    const items = order.items
      .filter(item => item.productId !== null)
      .map(item => ({
        productId: item.productId!,
        quantity: item.quantity
      }));

    if (items.length > 0) {
      await inventoryService.restoreStock(
        storeId,
        items,
        orderId,
        'Refund'
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

    // Parse JSON addresses safely
    const parseAddress = (addr: string | null): Record<string, unknown> | null => {
      if (!addr) return null;
      try {
        return JSON.parse(addr) as Record<string, unknown>;
      } catch {
        return null;
      }
    };

    // Format invoice data
    return {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      store: order.store,
      customer: order.customer,
      billingAddress: parseAddress(order.billingAddress),
      shippingAddress: parseAddress(order.shippingAddress),
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
