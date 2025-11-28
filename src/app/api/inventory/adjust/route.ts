// src/app/api/inventory/adjust/route.ts
// Inventory Adjustment API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InventoryService, InventoryAdjustmentReason } from '@/lib/services/inventory.service';
import { z } from 'zod';

const adjustStockSchema = z.object({
  storeId: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().nonnegative(),
  type: z.enum(['ADD', 'REMOVE', 'SET']),
  reason: z.nativeEnum(InventoryAdjustmentReason),
  note: z.string().optional(),
  orderId: z.string().optional(),
});

// POST /api/inventory/adjust - Adjust product stock levels
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = adjustStockSchema.parse(body);

    const { storeId, ...adjustment } = validatedData;

    // Verify store membership to prevent cross-tenant access
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

    const inventoryService = InventoryService.getInstance();
    const updatedItem = await inventoryService.adjustStock(storeId, {
      ...adjustment,
      userId: session.user.id,
    });

    return NextResponse.json({
      data: updatedItem,
      message: 'Stock adjusted successfully',
    });
  } catch (error) {
    console.error('POST /api/inventory/adjust error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle insufficient stock error with 409 Conflict
    if (error instanceof Error && error.message.includes('Cannot remove')) {
      return NextResponse.json(
        {
          error: 'Insufficient stock',
          details: error.message,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to adjust stock',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
