/**
 * Customers API Route
 * 
 * Provides endpoints for customer management including
 * listing, creating, and searching customers.
 * 
 * @module app/api/customers/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkPermission } from '@/lib/auth-helpers';
import { CustomerService } from '@/lib/services/customer.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * Query parameters schema
 */
const QuerySchema = z.object({
  storeId: z.string().cuid(),
  search: z.string().optional(),
  acceptsMarketing: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  minTotalSpent: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxTotalSpent: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  minTotalOrders: z.string().regex(/^\d+$/).transform(Number).optional(),
  hasOrders: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  perPage: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['createdAt', 'totalSpent', 'totalOrders', 'lastOrderAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Create customer schema
 */
const CreateCustomerSchema = z.object({
  storeId: z.string().cuid(),
  userId: z.string().cuid().optional(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  acceptsMarketing: z.boolean().optional(),
});

/**
 * GET /api/customers
 * 
 * List customers with optional filtering and pagination
 * 
 * @returns 200 - Paginated customers list
 * @returns 401 - Unauthorized
 * @returns 400 - Bad Request
 * @returns 500 - Internal Server Error
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission for reading customers
    const hasPermission = await checkPermission('customers:read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to view customers.' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = QuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const filters = validationResult.data;

    const customerService = CustomerService.getInstance();
    const result = await customerService.list(filters);

    return NextResponse.json(
      {
        data: result.customers,
        meta: {
          total: result.total,
          page: result.page,
          perPage: result.perPage,
          totalPages: result.totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving customers:', error);

    if (error instanceof Error) {
      if (error.message.includes('page must be') || error.message.includes('perPage must be')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to retrieve customers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers
 * 
 * Create a new customer
 * 
 * @returns 201 - Customer created successfully
 * @returns 401 - Unauthorized
 * @returns 400 - Bad Request
 * @returns 500 - Internal Server Error
 */
export async function POST(request: NextRequest) {
  try {
    // Check permission for creating customers
    const hasPermission = await checkPermission('customers:create');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to create customers.' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const validationResult = CreateCustomerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const customerService = CustomerService.getInstance();
    const customer = await customerService.create(data);

    return NextResponse.json(
      {
        data: customer,
        message: 'Customer created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating customer:', error);

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
