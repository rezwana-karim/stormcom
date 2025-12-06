// src/app/api/orders/route.ts
// Orders API Routes - List and Create orders

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkPermission } from '@/lib/auth-helpers';
import { OrderService } from '@/lib/services/order.service';
import { OrderProcessingService } from '@/lib/services/order-processing.service';
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

// Validation schema for order creation
const createOrderSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(10),
  shippingAddress: z.string().min(5),
  billingAddress: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        variantId: z.string().cuid().optional(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
      })
    )
    .min(1),
  paymentMethod: z.enum(['STRIPE', 'BKASH', 'CASH_ON_DELIVERY']),
  shippingMethod: z.string().optional(),
  notes: z.string().optional(),
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

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    // Check permission for creating orders
    const hasPermission = await checkPermission('orders:create');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to create orders.' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    const storeId = request.headers.get('x-store-id');
    const idempotencyKey = request.headers.get('idempotency-key');

    if (!storeId) {
      return NextResponse.json({ error: 'Store required (x-store-id header)' }, { status: 400 });
    }

    const body = await request.json();
    const data = createOrderSchema.parse(body);

    const service = OrderProcessingService.getInstance();
    const order = await service.createOrder(
      data,
      storeId,
      session?.user?.id || 'guest',
      idempotencyKey || undefined
    );

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/orders error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Insufficient stock')) {
      return NextResponse.json({ error: errorMessage }, { status: 409 });
    }
    if (errorMessage.includes('Product not found')) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
