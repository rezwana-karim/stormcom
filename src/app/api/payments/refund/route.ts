// src/app/api/payments/refund/route.ts
// API Route to Process Refunds
// Validates user access and processes full or partial refunds

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { paymentService } from "@/lib/services/payment.service";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomBytes } from "crypto";

const RefundSchema = z.object({
  orderId: z.string().cuid(),
  amount: z.number().positive(),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, amount, reason } = RefundSchema.parse(body);

    // Verify order exists and get storeId
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: { storeId: true, status: true, totalAmount: true },
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

    // Check if order is in a valid state for refund
    if (order.status !== "PAID" && order.status !== "PROCESSING" && order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Order is not in a valid state for refund" },
        { status: 400 }
      );
    }

    // Validate refund amount
    if (amount > order.totalAmount) {
      return NextResponse.json(
        { error: "Refund amount exceeds order total" },
        { status: 400 }
      );
    }

    // Generate idempotency key
    const idempotencyKey = `refund_${orderId}_${randomBytes(8).toString("hex")}`;

    const refund = await paymentService.processRefund({
      orderId,
      amount,
      reason,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        externalId: refund.externalId,
        processedAt: refund.processedAt,
      },
    });
  } catch (error) {
    console.error("Refund error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to process refund" 
      },
      { status: 500 }
    );
  }
}
