// src/app/api/orders/route.ts
// Orders API Routes - List orders

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkPermission } from '@/lib/auth-helpers';
import { OrderService } from '@/lib/services/order.service';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

// Validation schema for query parameters
const querySchema = z.object({
  storeId: z.string().cuid(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  search: z.string().max(200).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'totalAmount', 'orderNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/orders - List orders
export async function GET(request: NextRequest) {
  try {
    // Check permission for reading orders
    const hasPermission = await checkPermission('orders:read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to view orders.' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    // Convert date strings to Date objects
    const queryParams = {
      storeId: params.storeId,
      page: params.page,
      perPage: params.perPage,
      status: params.status,
      search: params.search,
      dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
      dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };

    // Fetch orders
    const orderService = OrderService.getInstance();
    const result = await orderService.listOrders(queryParams);

    // Transform orders to include customer name and email
    const transformedOrders = result.orders.map((order) => ({
      ...order,
      customerName: order.customer
        ? `${order.customer.firstName} ${order.customer.lastName}`.trim()
        : 'Guest',
      customerEmail: order.customer?.email || 'N/A',
    }));

    return NextResponse.json({
      orders: transformedOrders,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
