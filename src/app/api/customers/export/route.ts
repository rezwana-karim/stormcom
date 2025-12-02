/**
 * Customers Export API Route
 * 
 * Exports customers as CSV file
 * 
 * @module app/api/customers/export/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkPermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  storeId: z.string().cuid(),
});

/**
 * GET /api/customers/export
 * 
 * Export customers as CSV
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const hasPermission = await checkPermission('customers:read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to export customers.' },
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
    const storeId = searchParams.get('storeId');

    const validationResult = QuerySchema.safeParse({ storeId });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Fetch customers for the store
    const customers = await prisma.customer.findMany({
      where: {
        storeId: validationResult.data.storeId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Email',
      'First Name',
      'Last Name',
      'Phone',
      'Total Orders',
      'Total Spent',
      'Last Order Date',
      'Accepts Marketing',
      'Created At',
    ];

    const csvRows = customers.map((customer) => {
      const lastOrderDate = customer.lastOrderAt
        ? new Date(customer.lastOrderAt).toISOString().split('T')[0]
        : '';

      return [
        customer.id,
        customer.email,
        customer.firstName,
        customer.lastName,
        customer.phone || '',
        customer.totalOrders.toString(),
        customer.totalSpent.toFixed(2),
        lastOrderDate,
        customer.acceptsMarketing ? 'Yes' : 'No',
        new Date(customer.createdAt).toISOString().split('T')[0],
      ];
    });

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting customers:', error);
    return NextResponse.json(
      { error: 'Failed to export customers' },
      { status: 500 }
    );
  }
}
