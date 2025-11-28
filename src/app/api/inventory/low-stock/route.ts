// src/app/api/inventory/low-stock/route.ts
// Low Stock Alerts API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InventoryService } from '@/lib/services/inventory.service';

/**
 * GET /api/inventory/low-stock - Get products with low stock
 * 
 * Query parameters:
 * - storeId (required): Store ID to filter by
 * - threshold (optional): Custom low stock threshold (default: uses product's threshold)
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
    const threshold = searchParams.get('threshold');

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    const inventoryService = InventoryService.getInstance();
    const items = await inventoryService.getLowStockItems(
      storeId,
      threshold ? parseInt(threshold, 10) : undefined
    );

    // Also get counts for dashboard
    const counts = await inventoryService.getLowStockCount(storeId);

    return NextResponse.json({
      data: items,
      meta: {
        total: items.length,
        lowStockCount: counts.lowStock,
        outOfStockCount: counts.outOfStock,
      },
    });
  } catch (error) {
    console.error('GET /api/inventory/low-stock error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch low stock items',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
