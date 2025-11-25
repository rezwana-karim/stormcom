// src/app/api/orders/[id]/route.ts
// Order Detail API Routes - Get, Update Status

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/lib/services/order.service';
import { OrderStatus } from '@prisma/client';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/orders/[id] - Get order by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    const orderService = OrderService.getInstance();
    const order = await orderService.getOrderById(params.id, storeId);

    if (!order) {
      console.error(`Order not found: orderId=${params.id}, storeId=${storeId}`);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify customer has access to this order
    if (order.customerId !== session.user.id) {
      console.error(`Customer access denied: orderId=${params.id}, customerId=${order.customerId}, userId=${session.user.id}`);
      return NextResponse.json(
        { error: 'Access denied to this order' },
        { status: 403 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('GET /api/orders/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const body = await request.json();
    
    if (!body.storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // newStatus is optional for tracking-only updates
    if (!body.newStatus && !body.trackingNumber && !body.trackingUrl) {
      return NextResponse.json(
        { error: 'Either newStatus, trackingNumber, or trackingUrl must be provided' },
        { status: 400 }
      );
    }

    const orderService = OrderService.getInstance();
    const order = await orderService.updateOrderStatus({
      orderId: params.id,
      storeId: body.storeId,
      newStatus: body.newStatus as OrderStatus,
      trackingNumber: body.trackingNumber,
      trackingUrl: body.trackingUrl,
      adminNote: body.adminNote,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('PATCH /api/orders/[id] error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Delete order (soft delete)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    const orderService = OrderService.getInstance();
    await orderService.deleteOrder(params.id, storeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/orders/[id] error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
