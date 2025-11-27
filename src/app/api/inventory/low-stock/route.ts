// src/app/api/inventory/low-stock/route.ts
// Low Stock Products API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InventoryService } from '@/lib/services/inventory.service';

// GET /api/inventory/low-stock - Get products with low stock
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

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    const inventoryService = InventoryService.getInstance();
    const lowStockItems = await inventoryService.getLowStockItems(storeId);

    return NextResponse.json({
      data: lowStockItems,
      count: lowStockItems.length,
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
