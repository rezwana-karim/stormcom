// src/app/api/inventory/history/route.ts
// Inventory History API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InventoryService } from '@/lib/services/inventory.service';

// GET /api/inventory/history - Get inventory change history for a product
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
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    );

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

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    const inventoryService = InventoryService.getInstance();
    const history = await inventoryService.getInventoryHistory(storeId, productId, limit);

    return NextResponse.json({
      data: history,
      count: history.length,
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
