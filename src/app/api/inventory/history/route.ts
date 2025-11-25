// src/app/api/inventory/history/route.ts
// Inventory History API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InventoryService } from '@/lib/services/inventory.service';

// GET /api/inventory/history - Get inventory change history
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
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = Math.min(
      parseInt(searchParams.get('perPage') || '50', 10),
      100
    );
    const reason = searchParams.get('reason') || undefined;

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    const inventoryService = InventoryService.getInstance();

    // If productId is provided, get history for specific product
    if (productId) {
      const history = await inventoryService.getInventoryHistory(
        storeId,
        productId,
        perPage
      );

      return NextResponse.json({
        data: history,
        meta: {
          productId,
          count: history.length,
        },
      });
    }

    // Otherwise, get store-wide history with pagination
    const { logs, total } = await inventoryService.getStoreInventoryHistory(
      storeId,
      { page, perPage, reason }
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
