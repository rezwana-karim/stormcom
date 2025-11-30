// src/app/api/inventory/history/route.ts
// Inventory History API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InventoryService, InventoryAdjustmentReason } from '@/lib/services/inventory.service';

/**
 * GET /api/inventory/history - Get inventory change history for a product
 * 
 * Query parameters:
 * - storeId (required): Store ID
 * - productId (required): Product ID
 * - page (optional): Page number (default: 1)
 * - perPage (optional): Items per page (default: 20, max: 100)
 * - reason (optional): Filter by adjustment reason
 */
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

    // Verify store membership to prevent cross-tenant access
    if (storeId) {
      const { prisma } = await import('@/lib/prisma');
      const membership = await prisma.membership.findFirst({
        where: {
          userId: session.user.id,
          organization: {
            store: {
              id: storeId
            }
          }
        }
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have access to this store' },
          { status: 403 }
        );
      }
    }
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '20', 10), 100);
    const reason = searchParams.get('reason') as InventoryAdjustmentReason | null;

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    // Validate pagination
    if (page < 1) {
      return NextResponse.json(
        { error: 'Page must be >= 1' },
        { status: 400 }
      );
    }

    const inventoryService = InventoryService.getInstance();
    const { logs, total } = await inventoryService.getInventoryHistory(
      storeId,
      productId,
      { page, perPage, reason: reason || undefined }
    );

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      data: logs,
      meta: {
        page,
        perPage,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('GET /api/inventory/history error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch inventory history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
