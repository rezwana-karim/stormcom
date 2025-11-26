// src/app/api/inventory/bulk/route.ts
// Bulk Inventory Adjustment API Endpoint
// Supports JSON body or CSV file upload

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  InventoryService, 
  InventoryAdjustmentReason, 
  BulkAdjustmentItem 
} from '@/lib/services/inventory.service';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';

const MAX_BULK_ITEMS = 1000;

// Validation schema for bulk adjustment items
const bulkAdjustmentItemSchema = z.object({
  productId: z.string().optional(),
  variantId: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number().int().nonnegative(),
  type: z.enum(['ADD', 'REMOVE', 'SET']),
  reason: z.nativeEnum(InventoryAdjustmentReason),
  note: z.string().optional(),
}).refine(
  (data) => data.productId || data.sku,
  { message: 'Either productId or sku must be provided' }
);

const bulkAdjustmentSchema = z.object({
  storeId: z.string(),
  adjustments: z.array(bulkAdjustmentItemSchema).min(1).max(MAX_BULK_ITEMS),
});

// POST /api/inventory/bulk - Bulk adjust inventory levels
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    let storeId: string;
    let adjustments: BulkAdjustmentItem[];

    // Handle CSV file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const formStoreId = formData.get('storeId') as string | null;

      if (!file) {
        return NextResponse.json(
          { error: 'CSV file is required' },
          { status: 400 }
        );
      }

      if (!formStoreId) {
        return NextResponse.json(
          { error: 'storeId is required' },
          { status: 400 }
        );
      }

      storeId = formStoreId;

      // Parse CSV file
      const csvContent = await file.text();
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];

      if (records.length > MAX_BULK_ITEMS) {
        return NextResponse.json(
          { error: `CSV cannot contain more than ${MAX_BULK_ITEMS} rows` },
          { status: 400 }
        );
      }

      // Convert CSV records to adjustment items
      adjustments = records.map((record, index) => {
        const type = (record.type?.toUpperCase() || 'SET') as 'ADD' | 'REMOVE' | 'SET';
        const reason = (record.reason?.toLowerCase() || 'manual_adjustment') as InventoryAdjustmentReason;
        
        // Validate the type
        if (!['ADD', 'REMOVE', 'SET'].includes(type)) {
          throw new Error(`Invalid type "${record.type}" at row ${index + 2}. Must be ADD, REMOVE, or SET`);
        }

        // Validate the reason
        if (!Object.values(InventoryAdjustmentReason).includes(reason)) {
          throw new Error(`Invalid reason "${record.reason}" at row ${index + 2}. Valid reasons: ${Object.values(InventoryAdjustmentReason).join(', ')}`);
        }

        return {
          productId: record.productId || undefined,
          variantId: record.variantId || undefined,
          sku: record.sku || undefined,
          quantity: parseInt(record.quantity, 10) || 0,
          type,
          reason,
          note: record.note || undefined,
        };
      });
    } else {
      // Handle JSON body
      const body = await request.json();
      const validatedData = bulkAdjustmentSchema.parse(body);
      storeId = validatedData.storeId;
      adjustments = validatedData.adjustments;
    }

    // Execute bulk adjustment
    const inventoryService = InventoryService.getInstance();
    const result = await inventoryService.bulkAdjust(
      storeId,
      adjustments,
      session.user.id
    );

    const status = result.failed > 0 ? 207 : 200; // 207 Multi-Status if partial success

    return NextResponse.json({
      message: `Processed ${result.total} items: ${result.succeeded} succeeded, ${result.failed} failed`,
      ...result,
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

    return NextResponse.json(
      {
        error: 'Failed to process bulk inventory adjustment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
