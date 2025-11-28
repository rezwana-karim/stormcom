// src/app/api/inventory/bulk/route.ts
// Bulk Inventory Adjustment API Endpoint
// Supports CSV import for up to 1000 products

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  InventoryService, 
  InventoryAdjustmentReason,
  BulkAdjustmentItem 
} from '@/lib/services/inventory.service';
import { z } from 'zod';

const bulkAdjustmentItemSchema = z.object({
  productId: z.string().optional(),
  sku: z.string().optional(),
  variantSku: z.string().optional(),
  quantity: z.number().int().nonnegative(),
  type: z.enum(['ADD', 'REMOVE', 'SET']),
  reason: z.nativeEnum(InventoryAdjustmentReason),
  note: z.string().optional(),
}).refine(
  (data) => data.productId || data.sku,
  { message: 'Either productId or sku is required' }
);

const bulkAdjustSchema = z.object({
  storeId: z.string(),
  items: z.array(bulkAdjustmentItemSchema).min(1).max(1000),
});

/**
 * POST /api/inventory/bulk - Bulk adjust inventory levels
 * Supports up to 1000 items per request
 * 
 * Request body:
 * {
 *   "storeId": "store-id",
 *   "items": [
 *     {
 *       "productId": "product-id", // or "sku": "SKU-001"
 *       "quantity": 100,
 *       "type": "SET", // or "ADD" or "REMOVE"
 *       "reason": "restock",
 *       "note": "Monthly restock"
 *     }
 *   ]
 * }
 */
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
    const validatedData = bulkAdjustSchema.parse(body);

    const { storeId, items } = validatedData;

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
    const result = await inventoryService.bulkAdjust(
      storeId,
      items as BulkAdjustmentItem[],
      session.user.id
    );

    // Return appropriate status based on results
    const status = result.failed === 0 ? 200 : result.succeeded === 0 ? 400 : 207;

    return NextResponse.json({
      data: result,
      message: `Processed ${result.succeeded} of ${result.total} items successfully`,
    }, { status });
  } catch (error) {
    console.error('POST /api/inventory/bulk error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('limited to 1000')) {
      return NextResponse.json(
        {
          error: 'Too many items',
          details: error.message,
        },
        { status: 413 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to process bulk adjustment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
