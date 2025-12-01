/**
 * Instagram Analytics API
 *
 * GET /api/integrations/instagram/analytics - Get Instagram shopping analytics
 *
 * @module api/integrations/instagram/analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get Instagram shopping analytics and conversion data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const period = searchParams.get('period') || '30'; // days
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

    // Calculate date range
    let dateFrom: Date;
    let dateTo: Date;

    if (startDate && endDate) {
      dateFrom = new Date(startDate);
      dateTo = new Date(endDate);
    } else {
      dateTo = new Date();
      dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - parseInt(period));
    }

    // Get analytics data
    const analytics = await prisma.instagramAnalytics.findMany({
      where: {
        connectionId: connection.id,
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate aggregate stats
    const aggregateStats = analytics.reduce(
      (acc, day) => ({
        totalProfileVisits: acc.totalProfileVisits + day.profileVisits,
        totalWebsiteClicks: acc.totalWebsiteClicks + day.websiteClicks,
        totalProductClicks: acc.totalProductClicks + day.productClicks,
        totalShoppingViews: acc.totalShoppingViews + day.shoppingContentViews,
        totalTagClicks: acc.totalTagClicks + day.shoppingTagClicks,
        totalCheckouts: acc.totalCheckouts + day.checkoutsInitiated,
        totalOrders: acc.totalOrders + day.ordersCompleted,
        totalRevenue: acc.totalRevenue + day.revenue,
      }),
      {
        totalProfileVisits: 0,
        totalWebsiteClicks: 0,
        totalProductClicks: 0,
        totalShoppingViews: 0,
        totalTagClicks: 0,
        totalCheckouts: 0,
        totalOrders: 0,
        totalRevenue: 0,
      }
    );

    // Calculate conversion rate
    const conversionRate =
      aggregateStats.totalShoppingViews > 0
        ? ((aggregateStats.totalOrders / aggregateStats.totalShoppingViews) * 100).toFixed(2)
        : '0.00';

    // Calculate average order value
    const avgOrderValue =
      aggregateStats.totalOrders > 0
        ? (aggregateStats.totalRevenue / aggregateStats.totalOrders).toFixed(2)
        : '0.00';

    // Get top performing products by Instagram engagement
    const topProducts = await prisma.instagramProductTag.findMany({
      where: {
        connectionId: connection.id,
        status: 'APPROVED',
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: [
        { purchases: 'desc' },
        { clicks: 'desc' },
      ],
      take: 5,
    });

    // Get recent orders from Instagram
    const recentOrders = await prisma.instagramOrder.findMany({
      where: {
        connectionId: connection.id,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { instagramCreatedAt: 'desc' },
      take: 5,
    });

    // Format daily data for charts
    const dailyData = analytics.map((day) => ({
      date: day.date.toISOString().split('T')[0],
      revenue: day.revenue,
      orders: day.ordersCompleted,
      productClicks: day.productClicks,
      conversionRate: day.conversionRate,
    }));

    return NextResponse.json({
      data: {
        period: {
          from: dateFrom.toISOString(),
          to: dateTo.toISOString(),
          days: parseInt(period),
        },
        summary: {
          ...aggregateStats,
          conversionRate: parseFloat(conversionRate),
          avgOrderValue: parseFloat(avgOrderValue),
        },
        dailyData,
        topProducts: topProducts.map((tag) => ({
          productId: tag.product.id,
          productName: tag.product.name,
          productPrice: tag.product.price,
          thumbnail: tag.product.thumbnailUrl,
          clicks: tag.clicks,
          views: tag.views,
          purchases: tag.purchases,
        })),
        recentOrders: recentOrders.map((io) => ({
          instagramOrderId: io.instagramOrderId,
          stormcomOrderId: io.order?.id,
          orderNumber: io.order?.orderNumber,
          status: io.order?.status,
          totalAmount: io.totalAmount,
          buyerUsername: io.instagramBuyerUsername,
          sourceType: io.sourceMediaType,
          createdAt: io.instagramCreatedAt,
        })),
        connection: {
          username: connection.instagramUsername,
          followers: connection.instagramFollowers,
          catalogSyncedAt: connection.catalogSyncedAt,
        },
      },
    });
  } catch (error) {
    console.error('Get Instagram analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get Instagram analytics' },
      { status: 500 }
    );
  }
}
