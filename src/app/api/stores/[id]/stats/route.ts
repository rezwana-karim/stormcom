import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/stores/[id]/stats
 * Get store statistics
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const storeId = params.id;

    // Verify user has access to this store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!store || store.organization.memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get product stats  
    const [totalProducts, activeProducts, lowStockProducts, outOfStockProducts] = await Promise.all([
      prisma.product.count({ where: { storeId } }),
      prisma.product.count({ where: { storeId } }),
      prisma.product.count({ where: { storeId } }),  // TODO: Add stock tracking
      prisma.product.count({ where: { storeId } }),  // TODO: Add stock tracking
    ]);

    // Get order stats
    const orders = await prisma.order.findMany({
      where: { storeId },
      select: {
        status: true,
        totalAmount: true,
      },
    });

    const orderStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      processing: orders.filter(o => o.status === 'PROCESSING').length,
      completed: orders.filter(o => o.status === 'SHIPPED' || o.status === 'DELIVERED').length,
      revenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };

    // Get customer stats (unique customers who placed orders)
    const uniqueCustomers = await prisma.order.groupBy({
      by: ['customerId'],
      where: { 
        storeId,
        customerId: { not: null },
      },
      _min: {
        createdAt: true,
      },
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const customerStats = {
      total: uniqueCustomers.length,
      active: uniqueCustomers.filter(c => c._min.createdAt && new Date(c._min.createdAt) > thirtyDaysAgo).length,
      new: uniqueCustomers.filter(c => c._min.createdAt && new Date(c._min.createdAt) > thirtyDaysAgo).length,
    };

    // Calculate performance metrics
    const avgOrderValue = orderStats.total > 0 ? orderStats.revenue / orderStats.total : 0;
    const conversionRate = customerStats.total > 0 && totalProducts > 0
      ? (orderStats.total / (customerStats.total * totalProducts)) * 100
      : 0;

    const stats = {
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
      orders: orderStats,
      customers: customerStats,
      performance: {
        avgOrderValue,
        conversionRate: Math.min(conversionRate, 100), // Cap at 100%
        customerSatisfaction: 4.5, // TODO: Implement real reviews/ratings
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching store stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
