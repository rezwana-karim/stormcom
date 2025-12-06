// src/app/api/webhooks/stripe/route.ts
// Stripe Webhook Handler with Signature Verification
// Processes payment events: checkout.session.completed, payment_intent.succeeded, charge.refunded

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable body parsing for webhook (need raw body for signature verification)
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const error = err as Error;
      console.error("Webhook signature verification failed:", error.message);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle specific event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 * Updates order status to PAID and payment attempt to SUCCESS
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.client_reference_id || session.metadata?.orderId;
  if (!orderId) {
    console.error("No orderId in session metadata");
    return;
  }

  const paymentIntentId = session.payment_intent as string;

  try {
    await prisma.$transaction(async (tx) => {
      // Update payment attempt
      await tx.paymentAttempt.updateMany({
        where: {
          orderId,
          externalId: paymentIntentId,
        },
        data: {
          status: "SUCCESS",
          processedAt: new Date(),
          metadata: JSON.stringify({
            sessionId: session.id,
            paymentStatus: session.payment_status,
          }),
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paymentStatus: "PAID",
          paidAt: new Date(),
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: "PAYMENT_COMPLETED",
          entityType: "Order",
          entityId: orderId,
          changes: JSON.stringify({ 
            paymentIntentId, 
            amount: session.amount_total 
          }),
        },
      });
    });

    console.log(`Payment completed for order ${orderId}`);
  } catch (error) {
    console.error(`Error handling checkout completed for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Handle payment_intent.succeeded event
 * Fallback handler for direct payment intents
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) return;

  try {
    await prisma.paymentAttempt.updateMany({
      where: {
        orderId,
        externalId: paymentIntent.id,
      },
      data: {
        status: "SUCCESS",
        processedAt: new Date(),
      },
    });

    console.log(`Payment intent succeeded for order ${orderId}`);
  } catch (error) {
    console.error(`Error handling payment succeeded for order ${orderId}:`, error);
  }
}

/**
 * Handle payment_intent.payment_failed event
 * Updates payment attempt with error details
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) return;

  const errorCode = paymentIntent.last_payment_error?.code || "unknown_error";
  const errorMessage = paymentIntent.last_payment_error?.message || "Payment failed";

  try {
    await prisma.$transaction(async (tx) => {
      // Update payment attempt
      await tx.paymentAttempt.updateMany({
        where: {
          orderId,
          externalId: paymentIntent.id,
        },
        data: {
          status: "FAILED",
          errorCode,
          errorMessage,
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAYMENT_FAILED",
          paymentStatus: "FAILED",
        },
      });
    });

    console.error(`Payment failed for order ${orderId}: ${errorMessage}`);
  } catch (error) {
    console.error(`Error handling payment failed for order ${orderId}:`, error);
  }
}

/**
 * Handle charge.refunded event
 * Updates refund status to COMPLETED
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  try {
    // Find refund record by payment intent
    const refund = await prisma.refund.findFirst({
      where: {
        paymentAttempt: {
          externalId: paymentIntentId,
        },
        status: "PENDING",
      },
    });

    if (refund) {
      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
        },
      });

      console.log(`Refund completed: ${refund.id}`);
    }
  } catch (error) {
    console.error(`Error handling charge refunded for payment ${paymentIntentId}:`, error);
  }
}
