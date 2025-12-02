// src/app/api/products/route.ts
// Products API Routes - List and Create

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { verifyStoreAccess } from '@/lib/get-current-user';
import { checkPermission } from '@/lib/auth-helpers';
import { ProductService } from '@/lib/services/product.service';
import { z } from 'zod';

// GET /api/products - List products with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // Check permission for reading products
    const hasPermission = await checkPermission('products:read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to view products.' },
        { status: 403 }
      );
    }

    // Get user session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get storeId from query params (required for multi-tenant)
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this store
    const hasStoreAccess = await verifyStoreAccess(storeId);
    if (!hasStoreAccess) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to access this store.' },
        { status: 403 }
      );
    }

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '10'), 100);
    
    // Parse filter parameters
    const filters = {
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      brandId: searchParams.get('brandId') || undefined,
      status: searchParams.get('status') as 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true 
                 : searchParams.get('isFeatured') === 'false' ? false 
                 : undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      inventoryStatus: (searchParams.get('inventoryStatus') as 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED' | null) || undefined,
      sortBy: (searchParams.get('sortBy') as 'name' | 'price' | 'createdAt' | 'updatedAt' | null) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const productService = ProductService.getInstance();
    const result = await productService.getProducts(
      storeId,
      filters,
      page,
      perPage
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    // Check permission for creating products
    const hasPermission = await checkPermission('products:create');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to create products.' },
        { status: 403 }
      );
    }

    // Get user session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Get storeId from request body
    // Security: storeId is accepted from client but VERIFIED against user's organization membership
    // via verifyStoreAccess() to prevent tenant spoofing
    const storeId = body.storeId as string | undefined;
    
    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this store (prevents tenant spoofing)
    const hasStoreAccess = await verifyStoreAccess(storeId);
    if (!hasStoreAccess) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to create products in this store.' },
        { status: 403 }
      );
    }

    const productService = ProductService.getInstance();
    const product = await productService.createProduct(storeId, body);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('POST /api/products error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
