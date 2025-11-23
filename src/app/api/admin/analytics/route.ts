/**
 * Admin Analytics API
 * 
 * Get detailed analytics data (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/admin/analytics
 * Get system-wide analytics
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
    const metric = searchParams.get('metric') || 'overview';
    const period = searchParams.get('period') || '30d';

    // Mock analytics data
    const analytics: Record<string, unknown> = {
      overview: {
        period,
        metrics: {
          totalRevenue: 458920.50,
          totalOrders: 8934,
          averageOrderValue: 51.38,
          conversionRate: 3.45,
          newCustomers: 234,
          returningCustomers: 658,
        },
        trends: {
          revenue: { current: 458920.50, previous: 376543.20, change: 21.9 },
          orders: { current: 8934, previous: 7821, change: 14.2 },
          customers: { current: 892, previous: 765, change: 16.6 },
        },
      },
      traffic: {
        totalVisits: 45890,
        uniqueVisitors: 23456,
        pageViews: 123450,
        bounceRate: 42.5,
        avgSessionDuration: 245, // seconds
        sources: {
          direct: 35.4,
          organic: 28.7,
          social: 18.9,
          referral: 12.3,
          email: 4.7,
        },
      },
      topProducts: [
        { id: 'prod1', name: 'Product A', sales: 234, revenue: 11700.00 },
        { id: 'prod2', name: 'Product B', sales: 198, revenue: 9900.00 },
        { id: 'prod3', name: 'Product C', sales: 167, revenue: 8350.00 },
      ],
      topStores: [
        { id: 'store1', name: 'Acme Store', orders: 1245, revenue: 45890.50 },
        { id: 'store2', name: 'Tech Gadgets', orders: 3456, revenue: 125430.00 },
        { id: 'store3', name: 'Fashion Hub', orders: 234, revenue: 12340.00 },
      ],
    };

    return NextResponse.json({ 
      analytics: metric === 'overview' ? analytics : analytics[metric] || analytics.overview 
    }, { status: 200 });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}
