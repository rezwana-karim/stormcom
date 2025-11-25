// src/app/api/inventory/bulk/route.ts
// Bulk Inventory Update API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  InventoryService, 
  InventoryAdjustmentReason,
  BulkAdjustmentItem 
} from '@/lib/services/inventory.service';
import { z } from 'zod';

// Schema for bulk adjustment validation
const bulkAdjustmentItemSchema = z.object({
  productId: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number().int(),
  reason: z.nativeEnum(InventoryAdjustmentReason),
  note: z.string().optional(),
}).refine(
  (data) => data.productId || data.sku,
  { message: 'Either productId or sku is required' }
);

const bulkAdjustmentSchema = z.object({
  storeId: z.string(),
  adjustments: z.array(bulkAdjustmentItemSchema).min(1).max(1000),
});

// POST /api/inventory/bulk - Bulk adjust inventory (CSV import support)
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
    const validatedData = bulkAdjustmentSchema.parse(body);

    const inventoryService = InventoryService.getInstance();
    const result = await inventoryService.bulkAdjust(
      validatedData.storeId,
      validatedData.adjustments as BulkAdjustmentItem[],
      session.user.id
    );

    return NextResponse.json({
      data: result,
      message: `Processed ${result.total} items: ${result.succeeded} succeeded, ${result.failed} failed`,
    });
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

    return NextResponse.json(
      {
        error: 'Failed to process bulk adjustment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/inventory/bulk - Get reason codes enum for bulk import
export async function GET() {
  return NextResponse.json({
    reasonCodes: Object.values(InventoryAdjustmentReason),
    maxItems: 1000,
    format: {
      description: 'Each adjustment item should have productId or sku, quantity (positive for add, negative for remove), reason code, and optional note',
      example: {
        productId: 'cuid123',
        sku: 'SKU-001',
        quantity: 10,
        reason: 'restock',
        note: 'Monthly restock',
      },
    },
  });
}
