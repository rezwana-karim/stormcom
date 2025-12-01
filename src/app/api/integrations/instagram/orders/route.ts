/**
 * Instagram Orders API
 *
 * GET /api/integrations/instagram/orders - List Instagram orders
 * POST /api/integrations/instagram/orders/sync - Sync orders from Instagram
 *
 * @module api/integrations/instagram/orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * List Instagram orders synced to StormCom
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    // Verify user has access to this store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        organization: {
          memberships: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const connection = await prisma.instagramConnection.findUnique({
      where: { storeId },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Instagram not connected' }, { status: 404 });
    }

    const whereClause: Record<string, unknown> = {
      connectionId: connection.id,
    };

    if (status) {
      whereClause.instagramOrderStatus = status;
    }

    if (startDate || endDate) {
      whereClause.instagramCreatedAt = {};
      if (startDate) {
        (whereClause.instagramCreatedAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (whereClause.instagramCreatedAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const [instagramOrders, total] = await Promise.all([
      prisma.instagramOrder.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              paymentStatus: true,
              totalAmount: true,
            },
          },
        },
        orderBy: { instagramCreatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.instagramOrder.count({ where: whereClause }),
    ]);

    // Calculate summary stats
    const stats = await prisma.instagramOrder.aggregate({
      where: { connectionId: connection.id },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    return NextResponse.json({
      data: instagramOrders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalOrders: stats._count,
        totalRevenue: stats._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    console.error('Get Instagram orders error:', error);
    return NextResponse.json(
      { error: 'Failed to get Instagram orders' },
      { status: 500 }
    );
  }
}

/**
 * Create/sync an Instagram order (webhook simulation)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, instagramOrderData } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    // Verify user has access to this store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        organization: {
          memberships: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const connection = await prisma.instagramConnection.findUnique({
      where: { storeId },
    });

    if (!connection || connection.status !== 'CONNECTED') {
      return NextResponse.json(
        { error: 'Instagram not connected' },
        { status: 404 }
      );
    }

    // Check if order already exists
    const existingOrder = await prisma.instagramOrder.findUnique({
      where: { instagramOrderId: instagramOrderData.instagramOrderId },
    });

    if (existingOrder) {
      return NextResponse.json(
        { error: 'Order already synced' },
        { status: 409 }
      );
    }

    // Create StormCom order first
    const orderNumber = `IG-${Date.now().toString(36).toUpperCase()}`;

    const stormcomOrder = await prisma.order.create({
      data: {
        storeId,
        orderNumber,
        status: 'PENDING',
        paymentStatus: 'PAID', // Instagram orders are prepaid
        subtotal: instagramOrderData.subtotal || 0,
        shippingAmount: instagramOrderData.shippingAmount || 0,
        taxAmount: instagramOrderData.taxAmount || 0,
        totalAmount: instagramOrderData.totalAmount || 0,
        customerNote: `Instagram Order #${instagramOrderData.instagramOrderId}`,
        adminNote: `Synced from Instagram. Buyer: @${instagramOrderData.instagramBuyerUsername || 'unknown'}`,
      },
    });

    // Create Instagram order record
    const instagramOrder = await prisma.instagramOrder.create({
      data: {
        connectionId: connection.id,
        orderId: stormcomOrder.id,
        instagramOrderId: instagramOrderData.instagramOrderId,
        instagramOrderStatus: instagramOrderData.status || 'PENDING',
        instagramBuyerId: instagramOrderData.buyerId,
        instagramBuyerUsername: instagramOrderData.buyerUsername,
        sourceMediaId: instagramOrderData.sourceMediaId,
        sourceMediaType: instagramOrderData.sourceMediaType || 'SHOP',
        subtotal: instagramOrderData.subtotal || 0,
        shippingAmount: instagramOrderData.shippingAmount || 0,
        taxAmount: instagramOrderData.taxAmount || 0,
        totalAmount: instagramOrderData.totalAmount || 0,
        instagramCreatedAt: instagramOrderData.createdAt
          ? new Date(instagramOrderData.createdAt)
          : new Date(),
      },
      include: {
        order: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Instagram order synced successfully',
        data: instagramOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Sync Instagram order error:', error);
    return NextResponse.json(
      { error: 'Failed to sync Instagram order' },
      { status: 500 }
    );
  }
}
