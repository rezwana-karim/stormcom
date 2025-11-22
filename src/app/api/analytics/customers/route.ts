/**
 * GET /api/analytics/customers
 * 
 * Customer acquisition and retention metrics
 * 
 * @requires Authentication
 * @returns Customer analytics data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { z } from 'zod';

const customerQuerySchema = z.object({
  storeId: z.string().cuid(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format',
  }).optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format',
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Get storeId from query params
    const storeId = searchParams.get('storeId');
    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Default to last 30 days if not provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const queryData = {
      storeId,
      startDate: searchParams.get('startDate') || defaultStartDate.toISOString().split('T')[0],
      endDate: searchParams.get('endDate') || defaultEndDate.toISOString().split('T')[0],
    };

    const validatedQuery = customerQuerySchema.parse(queryData);

    const dateRange = {
      startDate: new Date(validatedQuery.startDate!),
      endDate: new Date(validatedQuery.endDate!),
    };

    // Add time to end date to include full day
    dateRange.endDate.setHours(23, 59, 59, 999);

    const analyticsService = AnalyticsService.getInstance();
    const customerMetrics = await analyticsService.getCustomerMetrics(
      storeId,
      dateRange
    );

    // Calculate additional insights
    const customerGrowthRate = customerMetrics.totalCustomers > 0 
      ? (customerMetrics.newCustomers / customerMetrics.totalCustomers) * 100 
      : 0;

    const returningCustomerRate = customerMetrics.totalCustomers > 0
      ? (customerMetrics.returningCustomers / customerMetrics.totalCustomers) * 100
      : 0;

    const newCustomerPercentage = (customerMetrics.newCustomers + customerMetrics.returningCustomers) > 0
      ? (customerMetrics.newCustomers / (customerMetrics.newCustomers + customerMetrics.returningCustomers)) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...customerMetrics,
        insights: {
          customerGrowthRate: Math.round(customerGrowthRate * 100) / 100,
          returningCustomerRate: Math.round(returningCustomerRate * 100) / 100,
          newCustomerPercentage: Math.round(newCustomerPercentage * 100) / 100,
        },
      },
      meta: {
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
        description: {
          totalCustomers: 'Total customers registered in the store',
          newCustomers: 'Customers acquired during the selected period',
          returningCustomers: 'Customers who made orders in this period and had previous orders',
          customerRetentionRate: 'Percentage of customers from previous period who returned',
          customerGrowthRate: 'Percentage of new customers relative to total customer base',
          returningCustomerRate: 'Percentage of returning customers relative to total customer base',
        },
      },
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

    console.error('[GET /api/analytics/customers] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer analytics' },
      { status: 500 }
    );
  }
}
