// src/app/api/orders/[orderId]/route.ts
// Order Details API - Get order information

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.orderId,
        // Security: Only allow viewing own orders or orders in user's store
        OR: [
          { customerId: session.user.id },
          {
            store: {
              organization: {
                memberships: {
                  some: { userId: session.user.id },
                },
              },
            },
          },
        ],
        deletedAt: null,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                thumbnailUrl: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Parse JSON addresses
    const shippingAddress = JSON.parse(order.shippingAddress as string);
    const billingAddress = JSON.parse(order.billingAddress as string);

    return NextResponse.json({
      ...order,
      shippingAddress,
      billingAddress,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      shippingAmount: Number(order.shippingAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        taxAmount: Number(item.taxAmount),
        discountAmount: Number(item.discountAmount),
        totalAmount: Number(item.totalAmount),
      })),
    });
  } catch (error) {
    console.error('GET /api/orders/[orderId] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
