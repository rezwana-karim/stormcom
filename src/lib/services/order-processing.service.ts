// src/lib/services/order-processing.service.ts
// Advanced Order Processing Service with Transaction Support, Idempotency, and Inventory Integration
// Implements Phase 1: Order Processing API requirements

import { prisma } from '@/lib/prisma';
import { InventoryService } from './inventory.service';
import { Prisma, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface CreateOrderInput {
  customerId?: string; // Optional for guest checkout
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  billingAddress?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number; // Snapshot price at purchase time
  }>;
  paymentMethod: 'STRIPE' | 'BKASH' | 'CASH_ON_DELIVERY';
  shippingMethod?: string;
  notes?: string;
}

export interface OrderItemWithProductDetails {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// ============================================================================
// ORDER PROCESSING SERVICE
// ============================================================================

export class OrderProcessingService {
  private static instance: OrderProcessingService;

  private constructor() {}

  public static getInstance(): OrderProcessingService {
    if (!OrderProcessingService.instance) {
      OrderProcessingService.instance = new OrderProcessingService();
    }
    return OrderProcessingService.instance;
  }

  /**
   * Create order atomically with inventory decrement
   * Uses Prisma transaction to ensure data consistency
   */
  async createOrder(
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
              variant: { select: { name: true, sku: true } },
            },
          },
        },
      });
      if (existing) {
        console.log(`Duplicate order prevented: ${idempotencyKey}`);
        return existing;
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Validate items and check stock
      const enrichedItems: OrderItemWithProductDetails[] = [];
      
      for (const item of input.items) {
        if (item.variantId) {
          // Fetch variant with product info
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            include: { product: { select: { name: true, sku: true, storeId: true } } },
          });

          if (!variant) {
            throw new Error(`Variant not found: ${item.variantId}`);
          }

          // Verify store ownership
          if (variant.product.storeId !== storeId) {
            throw new Error(`Product ${item.productId} does not belong to store ${storeId}`);
          }

          // Check stock
          if (variant.inventoryQty < item.quantity) {
            throw new Error(
              `Insufficient stock for ${variant.product.name} - ${variant.name}: ${variant.inventoryQty} available, ${item.quantity} requested`
            );
          }

          // Enrich item with variant details
          enrichedItems.push({
            productId: item.productId,
            variantId: item.variantId,
            productName: variant.product.name,
            variantName: variant.name,
            sku: variant.sku,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          });
        } else {
          // Fetch product
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { id: true, name: true, sku: true, inventoryQty: true, storeId: true },
          });

          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }

          // Verify store ownership
          if (product.storeId !== storeId) {
            throw new Error(`Product ${item.productId} does not belong to store ${storeId}`);
          }

          // Check stock
          if (product.inventoryQty < item.quantity) {
            throw new Error(
              `Insufficient stock for ${product.name}: ${product.inventoryQty} available, ${item.quantity} requested`
            );
          }

          // Enrich item with product details
          enrichedItems.push({
            productId: item.productId,
            variantId: undefined,
            productName: product.name,
            variantName: undefined,
            sku: product.sku,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          });
        }
      }

      // 2. Generate order number
      const orderNumber = await this.generateOrderNumber(storeId, tx);

      // 3. Calculate totals
      const subtotal = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const shippingCost = 0; // TODO: Calculate from ShippingMethod
      const tax = 0; // TODO: Calculate based on location
      const totalAmount = subtotal + shippingCost + tax;

      // 4. Map payment method to enum
      const paymentMethodEnum = this.mapPaymentMethod(input.paymentMethod);

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
          paymentMethod: paymentMethodEnum,
          paymentStatus: PaymentStatus.PENDING,
          status: OrderStatus.PENDING,
          shippingMethod: input.shippingMethod,
          notes: input.notes,
          idempotencyKey,
          items: {
            create: enrichedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
              taxAmount: 0,
              discountAmount: 0,
              totalAmount: item.subtotal,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true } },
              variant: { select: { name: true, sku: true } },
            },
          },
        },
      });

      // 6. Decrement inventory atomically using InventoryService
      // NOTE: InventoryService.deductStockForOrder uses its own transaction.
      // This follows the specification pattern from the issue. While nested transactions
      // are not ideal, this allows InventoryService to be used independently.
      // If order creation fails, the outer transaction rolls back. If inventory deduction
      // fails, it throws an error that rolls back the outer transaction.
      const inventoryService = InventoryService.getInstance();
      const inventoryItems = input.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      await inventoryService.deductStockForOrder(storeId, inventoryItems, order.id, userId);

      // 7. Send order notification (async, don't block)
      this.sendOrderNotification(order, storeId).catch((err) =>
        console.error('Failed to send order notification:', err)
      );

      return order;
    });
  }

  /**
   * Generate sequential order number per store
   * Format: ORD-20251204-0001
   */
  private async generateOrderNumber(
    storeId: string,
    tx: Prisma.TransactionClient
  ): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const prefix = `ORD-${today}`;

    // Get last order number for today
    const lastOrder = await tx.order.findFirst({
      where: {
        storeId,
        orderNumber: { startsWith: prefix },
      },
      orderBy: { orderNumber: 'desc' },
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
   * Update order status
   */
  async updateStatus(
    orderId: string,
    storeId: string,
    status: OrderStatus,
    userId: string,
    trackingNumber?: string
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: { items: true },
    });

    if (!order) throw new Error('Order not found');

    // If canceling, restore inventory
    if (status === OrderStatus.CANCELED && order.status !== OrderStatus.CANCELED) {
      await this.restoreInventory(orderId, storeId, userId);
    }

    // Build update data
    const updateData: Prisma.OrderUpdateInput = {
      status,
      ...(trackingNumber && { trackingNumber }),
      ...(status === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
    };

    return await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });
  }

  /**
   * Restore inventory when order is canceled
   */
  private async restoreInventory(orderId: string, storeId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return;

    const inventoryService = InventoryService.getInstance();
    const items = order.items
      .filter((item) => item.productId !== null)
      .map((item) => ({
        productId: item.productId!,
        variantId: item.variantId || undefined,
        quantity: item.quantity,
      }));

    if (items.length > 0) {
      await inventoryService.restoreStockForCancellation(storeId, items, order.id, userId);
    }
  }

  /**
   * Process refund (integrates with payment gateway)
   */
  async processRefund(
    orderId: string,
    storeId: string,
    amount: number,
    reason: string,
    userId: string
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: { items: true },
    });

    if (!order) throw new Error('Order not found');

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new Error('Cannot refund unpaid order');
    }

    // Refund via payment gateway
    if (order.paymentMethod === PaymentMethod.CREDIT_CARD && order.stripePaymentIntentId) {
      // Import stripe dynamically to avoid issues if not installed
      try {
        const stripe = (await import('stripe')).default;
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        
        if (!stripeSecretKey) {
          console.warn('STRIPE_SECRET_KEY not configured, skipping Stripe refund');
        } else {
          const stripeClient = new stripe(stripeSecretKey, {
            apiVersion: '2025-11-17.clover',
          });

          await stripeClient.refunds.create({
            payment_intent: order.stripePaymentIntentId,
            amount: Math.round(amount * 100), // Convert to cents
            reason: 'requested_by_customer',
            metadata: { orderId, reason },
          });
        }
      } catch (error) {
        console.error('Stripe refund failed:', error);
        throw new Error('Failed to process refund with payment gateway');
      }
    }

    // Update order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.REFUNDED,
        paymentStatus: PaymentStatus.REFUNDED,
        refundedAmount: amount,
        refundReason: reason,
      },
    });

    // Restore inventory
    await this.restoreInventory(orderId, storeId, userId);

    return { success: true };
  }

  /**
   * Send order notification email
   */
  private async sendOrderNotification(
    order: { orderNumber: string; customerEmail: string | null; totalAmount: number },
    _storeId: string
  ) {
    if (!order.customerEmail) {
      console.warn('Order notification skipped: no customer email');
      return;
    }
    
    try {
      const { Resend } = await import('resend');
      const resendApiKey = process.env.RESEND_API_KEY;
      
      if (!resendApiKey || resendApiKey === 're_dummy_key_for_build') {
        console.log(`[DEV MODE] Order notification skipped (no RESEND_API_KEY): Order ${order.orderNumber}`);
        return;
      }

      const resend = new Resend(resendApiKey);
      const emailFrom = process.env.EMAIL_FROM || 'orders@stormcom.app';

      await resend.emails.send({
        from: emailFrom,
        to: order.customerEmail,
        subject: `Order Confirmation - ${order.orderNumber}`,
        html: `
          <h1>Thank you for your order!</h1>
          <p>Order Number: <strong>${order.orderNumber}</strong></p>
          <p>Total: $${order.totalAmount.toFixed(2)}</p>
          <p>We'll send you a shipping confirmation when your order ships.</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send order notification:', error);
      // Don't throw - email failure shouldn't block order creation
    }
  }

  /**
   * Map payment method string to Prisma enum
   */
  private mapPaymentMethod(method: string): PaymentMethod {
    const mapping: Record<string, PaymentMethod> = {
      STRIPE: PaymentMethod.CREDIT_CARD,
      BKASH: PaymentMethod.MOBILE_BANKING,
      CASH_ON_DELIVERY: PaymentMethod.CASH_ON_DELIVERY,
    };
    return mapping[method] || PaymentMethod.CASH_ON_DELIVERY;
  }
}
