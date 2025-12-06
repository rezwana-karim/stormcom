/**
 * Order Refund API Route
 * 
 * Handles order refunds with inventory restoration.
 * 
 * @module app/api/orders/[id]/refund/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/lib/services/order.service';
import { OrderProcessingService } from '@/lib/services/order-processing.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Refund order schema
 */
const RefundOrderSchema = z.object({
  storeId: z.string().cuid(),
  refundAmount: z.number().min(0).optional(),
  reason: z.string().optional(),
});

/**
 * POST /api/orders/[id]/refund
 * 
 * Refund an order and restore inventory
 * 
 * @returns 200 - Order refunded successfully
 * @returns 401 - Unauthorized
 * @returns 400 - Bad Request
 * @returns 404 - Order not found
 * @returns 500 - Internal Server Error
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const body = await request.json();

    const validationResult = RefundOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { storeId, refundAmount, reason } = validationResult.data;

    // Use OrderProcessingService for Stripe integration
    const orderProcessingService = OrderProcessingService.getInstance();
    const orderService = OrderService.getInstance();
    
    // Get order to determine refund amount
    const order = await orderService.getOrderById(params.id, storeId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const actualRefundAmount = refundAmount || order.totalAmount;
    
    // Process refund with Stripe integration
    await orderProcessingService.processRefund(
      params.id,
      storeId,
      actualRefundAmount,
      reason || 'Refund requested',
      session.user.id
    );
    
    // Get updated order
    const updatedOrder = await orderService.getOrderById(params.id, storeId);

    return NextResponse.json(
      {
        data: updatedOrder,
        message: 'Order refunded successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error refunding order:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('Cannot refund')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to refund order' },
      { status: 500 }
    );
  }
}
