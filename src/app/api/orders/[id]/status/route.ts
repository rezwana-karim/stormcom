/**
 * PATCH /api/orders/[id]/status
 * 
 * Updates order status with state machine validation.
 * Optionally accepts tracking information and admin notes.
 * 
 * @requires Authentication (Store Admin)
 * @returns {OrderResponse} Updated order details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/lib/services/order.service';
import { OrderStatus } from '@prisma/client';

// Validation schema
const updateStatusSchema = z.object({
  storeId: z.string().cuid(),
  status: z.nativeEnum(OrderStatus),
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: z.string().url().max(500).optional(),
  adminNote: z.string().max(1000).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract params
    const { id: orderId } = await context.params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    // Multi-tenant isolation
    const { storeId } = validatedData;

    // Update order status
    const orderService = OrderService.getInstance();
    const updatedOrder = await orderService.updateOrderStatus({
      orderId,
      storeId,
      newStatus: validatedData.status,
      trackingNumber: validatedData.trackingNumber,
      trackingUrl: validatedData.trackingUrl,
      adminNote: validatedData.adminNote,
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('[PATCH /api/orders/[id]/status] Error:', error);

    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('Invalid status transition')) {
        return NextResponse.json(
          { error: error.message },
          { status: 422 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
