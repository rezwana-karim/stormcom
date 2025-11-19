// src/app/api/analytics/sales/route.ts
// Sales Analytics Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AnalyticsService } from '@/lib/services/analytics.service';

// GET /api/analytics/sales - Get sales report
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Default to last 30 days if no dates provided
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from 
      ? new Date(from) 
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const analyticsService = AnalyticsService.getInstance();
    const salesData = await analyticsService.getSalesReport(storeId, {
      from: fromDate,
      to: toDate,
    });

    return NextResponse.json(salesData);
  } catch (error) {
    console.error('GET /api/analytics/sales error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales report' },
      { status: 500 }
    );
  }
}
