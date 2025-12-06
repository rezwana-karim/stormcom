// src/lib/services/payment.service.ts
// Stripe Payment Integration Service
// Implements Phase 1: Stripe Payment Integration requirements

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface CreateCheckoutSessionParams {
  orderId: string;
  storeId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface ProcessRefundParams {
  orderId: string;
  amount: number;
  reason?: string;
  idempotencyKey: string;
}

// ============================================================================
// PAYMENT SERVICE
// ============================================================================

export class PaymentService {
  /**
   * Create Stripe Checkout Session for an order
   * Supports multi-currency and Stripe Connect for multi-tenant payments
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams) {
    const { orderId, storeId, successUrl, cancelUrl } = params;

    // Fetch order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId, storeId },
      include: {
        items: {
          include: {
            product: { select: { name: true, images: true } },
            variant: { select: { name: true } },
          },
        },
        store: { 
          select: { 
            name: true, 
            currency: true, 
            stripeAccountId: true 
          } 
        },
        customer: { select: { email: true } },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map((item) => {
      // Parse images safely
      let images: string[] = [];
      if (item.product?.images) {
        try {
          const parsed = JSON.parse(item.product.images);
          images = Array.isArray(parsed) ? parsed : [];
        } catch {
          images = [];
        }
      }

      return {
        price_data: {
          currency: (order.store.currency || "usd").toLowerCase(),
          product_data: {
            name: item.product?.name || item.productName,
            description: item.variant?.name,
            images: images.slice(0, 1), // First image only
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Create checkout session
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: orderId,
      customer_email: order.customerEmail || order.customer?.email || undefined,
      metadata: {
        orderId,
        storeId,
        orderNumber: order.orderNumber,
      },
    };

    // Add Stripe Connect account if configured
    const session = await stripe.checkout.sessions.create(
      sessionOptions,
      order.store.stripeAccountId ? {
        stripeAccount: order.store.stripeAccountId,
      } : undefined
    );

    // Create pending payment attempt
    await prisma.paymentAttempt.create({
      data: {
        orderId,
        storeId,
        provider: "STRIPE",
        amount: order.totalAmount,
        currency: order.store.currency || "USD",
        status: "PENDING",
        externalId: session.payment_intent as string,
        metadata: JSON.stringify({
          sessionId: session.id,
          sessionUrl: session.url,
        }),
      },
    });

    return {
      sessionId: session.id,
      sessionUrl: session.url,
    };
  }

  /**
   * Process refund for an order
   * Supports full and partial refunds with inventory restoration
   */
  async processRefund(params: ProcessRefundParams) {
    const { orderId, amount, reason, idempotencyKey } = params;

    // Fetch order and payment
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        paymentAttempts: {
          where: { status: "SUCCESS" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        refunds: true,
        store: { select: { stripeAccountId: true } },
      },
    });

    if (!order || order.paymentAttempts.length === 0) {
      throw new Error("No successful payment found for this order");
    }

    const paymentAttempt = order.paymentAttempts[0];
    const totalRefunded = order.refunds.reduce(
      (sum, r) => sum + (r.status === "COMPLETED" ? r.amount : 0), 
      0
    );
    const refundableBalance = order.totalAmount - totalRefunded;

    if (amount > refundableBalance) {
      throw new Error(`Cannot refund ${amount}. Available balance: ${refundableBalance}`);
    }

    if (!paymentAttempt.externalId) {
      throw new Error("Payment intent ID not found");
    }

    // Process refund with Stripe
    const refundOptions: Stripe.RefundCreateParams = {
      payment_intent: paymentAttempt.externalId,
      amount: Math.round(amount * 100), // Convert to cents
      reason: reason === "REQUESTED_BY_CUSTOMER" ? "requested_by_customer" : undefined,
      metadata: {
        orderId,
        orderNumber: order.orderNumber,
      },
    };

    const refund = await stripe.refunds.create(
      refundOptions,
      {
        idempotencyKey,
        ...(order.store.stripeAccountId && {
          stripeAccount: order.store.stripeAccountId,
        }),
      }
    );

    // Create refund record
    const refundRecord = await prisma.$transaction(async (tx) => {
      const record = await tx.refund.create({
        data: {
          orderId,
          storeId: order.storeId,
          paymentAttemptId: paymentAttempt.id,
          amount,
          status: refund.status === "succeeded" ? "COMPLETED" : "PENDING",
          externalId: refund.id,
          reason,
          processedAt: refund.status === "succeeded" ? new Date() : null,
        },
      });

      // Update order status if fully refunded
      if (amount === refundableBalance) {
        await tx.order.update({
          where: { id: orderId },
          data: { 
            status: "REFUNDED",
            refundedAmount: order.totalAmount,
          },
        });

        // Restore inventory
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { inventoryQty: { increment: item.quantity } },
            });
          }
        }
      } else {
        // Partial refund - update refunded amount
        await tx.order.update({
          where: { id: orderId },
          data: { 
            refundedAmount: totalRefunded + amount,
          },
        });
      }

      return record;
    });

    return refundRecord;
  }

  /**
   * Get payment intent details from Stripe
   */
  async getPaymentIntent(paymentIntentId: string, stripeAccountId?: string) {
    return stripe.paymentIntents.retrieve(
      paymentIntentId,
      stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
    );
  }
}

// Singleton export
export const paymentService = new PaymentService();
