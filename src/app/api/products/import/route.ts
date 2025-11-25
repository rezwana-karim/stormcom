// src/app/api/products/import/route.ts
// CSV Bulk Import API for Products

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ProductService, CreateProductData } from '@/lib/services/product.service';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

// Validation schema for CSV row
const csvRowSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  price: z.string().transform((val) => parseFloat(val)),
  description: z.string().optional().default(''),
  shortDescription: z.string().optional().default(''),
  compareAtPrice: z.string().optional().transform((val) => val ? parseFloat(val) : null),
  costPrice: z.string().optional().transform((val) => val ? parseFloat(val) : null),
  inventoryQty: z.string().optional().transform((val) => val ? parseInt(val, 10) : 0),
  lowStockThreshold: z.string().optional().transform((val) => val ? parseInt(val, 10) : 5),
  categoryId: z.string().optional().default(''),
  brandId: z.string().optional().default(''),
  status: z.string().optional().transform((val) => {
    if (!val) return ProductStatus.DRAFT;
    const status = val.toUpperCase() as keyof typeof ProductStatus;
    return ProductStatus[status] || ProductStatus.DRAFT;
  }),
  isFeatured: z.string().optional().transform((val) => val?.toLowerCase() === 'true'),
  weight: z.string().optional().transform((val) => val ? parseFloat(val) : null),
  images: z.string().optional().transform((val) => {
    if (!val) return [];
    try {
      // Try parsing as JSON array first
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [val];
    } catch {
      // Otherwise split by comma/semicolon
      return val.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    }
  }),
});

interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{ row: number; sku: string; error: string }>;
}

// POST /api/products/import - Bulk import products from CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const storeId = formData.get('storeId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'CSV file is required' },
        { status: 400 }
      );
    }

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        { error: 'Only CSV files are allowed' },
        { status: 400 }
      );
    }

    // Parse CSV content
    const text = await file.text();
    let records: Record<string, string>[];
    
    try {
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse CSV file', details: String(parseError) },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // Limit to 1000 products per import for performance
    if (records.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 products per import' },
        { status: 400 }
      );
    }

    const productService = ProductService.getInstance();
    const result: ImportResult = {
      imported: 0,
      failed: 0,
      errors: [],
    };

    // Process records in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (record, batchIndex) => {
          const rowNum = i + batchIndex + 2; // +2 for 1-indexed row and header
          const sku = record.sku || 'unknown';
          
          try {
            // Validate and transform CSV row
            const validatedData = csvRowSchema.parse(record);
            
            // Map to CreateProductData
            const productData: CreateProductData = {
              name: validatedData.name,
              sku: validatedData.sku,
              price: validatedData.price,
              description: validatedData.description || undefined,
              shortDescription: validatedData.shortDescription || undefined,
              compareAtPrice: validatedData.compareAtPrice,
              costPrice: validatedData.costPrice,
              inventoryQty: validatedData.inventoryQty,
              lowStockThreshold: validatedData.lowStockThreshold,
              categoryId: validatedData.categoryId || undefined,
              brandId: validatedData.brandId || undefined,
              status: validatedData.status,
              isFeatured: validatedData.isFeatured,
              weight: validatedData.weight,
              images: validatedData.images,
              trackInventory: true,
            };

            await productService.createProduct(storeId, productData);
            result.imported++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              row: rowNum,
              sku,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        })
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/products/import error:', error);
    return NextResponse.json(
      { error: 'Failed to import products' },
      { status: 500 }
    );
  }
}
