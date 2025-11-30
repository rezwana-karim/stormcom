// src/app/api/products/import/route.ts
// Product CSV Bulk Import API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { verifyStoreAccess } from '@/lib/get-current-user';
import { ProductService } from '@/lib/services/product.service';
import { z, ZodIssue } from 'zod';
import Papa from 'papaparse';

// Zod schema for CSV record validation
const csvRecordSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num < 0) throw new Error('Invalid price');
    return num;
  }),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  inventoryQty: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined || val === '') return 0;
    const num = typeof val === 'string' ? parseInt(val) : val;
    return isNaN(num) ? 0 : Math.max(0, num);
  }),
  status: z.string().optional(),
  images: z.string().optional(),
}).passthrough(); // Allow additional columns

// POST /api/products/import - Bulk import products from CSV
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const storeId = formData.get('storeId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this store (multi-tenant security)
    const hasStoreAccess = await verifyStoreAccess(storeId);
    if (!hasStoreAccess) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to import products to this store.' },
        { status: 403 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV files are supported.' },
        { status: 400 }
      );
    }

    // Read and parse CSV using papaparse (handles edge cases like multiline quoted fields, different line endings, escaped characters)
    const text = await file.text();
    const parseResult = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
    });

    // Check for parsing errors
    if (parseResult.errors && parseResult.errors.length > 0) {
      const criticalErrors = parseResult.errors.filter(e => e.type === 'Quotes' || e.type === 'FieldMismatch');
      if (criticalErrors.length > 0) {
        return NextResponse.json({
          error: 'CSV parsing failed',
          details: criticalErrors.map(e => ({ row: e.row, message: e.message })),
        }, { status: 400 });
      }
    }

    const records = parseResult.data;

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty or has no data rows' },
        { status: 400 }
      );
    }

    // Validate required columns
    const requiredColumns = ['name', 'sku', 'price'];
    const firstRecord = records[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRecord));
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate and transform records using Zod schema
    const validatedRecords: Array<{
      name: string;
      sku: string;
      price: number | string;
      description?: string;
      categoryId?: string;
      brandId?: string;
      inventoryQty?: number | string;
      status?: string;
      images?: string;
    }> = [];
    const validationErrors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < records.length; i++) {
      const result = csvRecordSchema.safeParse(records[i]);
      if (result.success) {
        validatedRecords.push(result.data);
      } else {
        // Use proper ZodIssue type from Zod for type-safe error handling
        const errorMessages = result.error.issues.map((issue: ZodIssue) => issue.message).join(', ');
        validationErrors.push({
          row: i + 1,
          error: errorMessages,
        });
      }
    }

    // If all records failed validation, return early
    if (validatedRecords.length === 0) {
      return NextResponse.json({
        success: false,
        imported: 0,
        total: records.length,
        errors: validationErrors,
      });
    }

    // Import validated products
    const productService = ProductService.getInstance();
    const result = await productService.bulkImport(storeId, validatedRecords);

    // Combine validation errors with import errors
    const allErrors = [...validationErrors, ...result.errors];

    return NextResponse.json({
      success: result.imported > 0,
      imported: result.imported,
      total: records.length,
      errors: allErrors,
    });
  } catch (error) {
    console.error('POST /api/products/import error:', error);
    return NextResponse.json(
      { error: 'Failed to import products' },
      { status: 500 }
    );
  }
}
