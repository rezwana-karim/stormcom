/**
 * Admin System Stats API
 * 
 * Get system-wide statistics (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/admin/stats
 * Get system statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

    // Mock stats data - In production, aggregate from database
    const stats = {
      period,
      users: {
        total: 15847,
        active: 12356,
        new: period === '7d' ? 234 : period === '30d' ? 1023 : 4567,
        growth: period === '7d' ? 5.2 : period === '30d' ? 12.8 : 28.4,
      },
      stores: {
        total: 3421,
        active: 2987,
        new: period === '7d' ? 45 : period === '30d' ? 187 : 834,
        growth: period === '7d' ? 3.1 : period === '30d' ? 8.9 : 18.2,
      },
      orders: {
        total: 45789,
        completed: 42156,
        pending: 2345,
        canceled: 1288,
        growth: period === '7d' ? 7.5 : period === '30d' ? 15.3 : 32.1,
      },
      products: {
        total: 125678,
        published: 112456,
        draft: 10234,
        outOfStock: 2988,
        growth: period === '7d' ? 4.2 : period === '30d' ? 15.2 : 31.8,
      },
      revenue: {
        total: 2345678.90,
        monthly: period === '7d' ? 156789.45 : period === '30d' ? 567890.12 : 1234567.89,
        subscriptions: 567890.12,
        transactions: 1777788.78,
        growth: period === '7d' ? 9.2 : period === '30d' ? 18.6 : 41.3,
      },
      performance: {
        responseTime: 245, // ms
        uptime: 99.97, // %
        apiCalls: 8945623,
        errorRate: 0.12, // %
      },
      storage: {
        used: 45.6,
        total: 100,
        percentage: 45.6,
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
