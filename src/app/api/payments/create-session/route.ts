// src/app/api/payments/create-session/route.ts
// API Route to Create Stripe Checkout Session
// Validates user access and creates payment session for an order

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { paymentService } from "@/lib/services/payment.service";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSessionSchema = z.object({
  orderId: z.string().cuid(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = CreateSessionSchema.parse(body);

    // Verify order exists and get storeId
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: { storeId: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify user has access to the store
    const storeAccess = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: {
          store: {
            id: order.storeId,
          },
        },
      },
    });

    if (!storeAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if order is in a valid state for payment
    if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
      return NextResponse.json(
        { error: "Order is not in a valid state for payment" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const checkoutSession = await paymentService.createCheckoutSession({
      orderId,
      storeId: order.storeId,
      successUrl: `${baseUrl}/store/${order.storeId}/orders/${orderId}/success`,
      cancelUrl: `${baseUrl}/store/${order.storeId}/orders/${orderId}/cancel`,
    });

    return NextResponse.json(checkoutSession);
  } catch (error) {
    console.error("Create session error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}
