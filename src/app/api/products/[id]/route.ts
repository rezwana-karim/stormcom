// src/app/api/products/[id]/route.ts
// Product Detail API Routes - Get, Update, Delete

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { verifyStoreAccess } from '@/lib/get-current-user';
import { ProductService } from '@/lib/services/product.service';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/products/[id] - Get product by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
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

    const productService = ProductService.getInstance();
    const product = await productService.getProductById(params.id, storeId);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('GET /api/products/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] - Update product
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const body = await request.json();
    
    // Get storeId from request body
    const storeId = body.storeId;
    
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
        { error: 'Access denied. You do not have permission to modify products in this store.' },
        { status: 403 }
      );
    }

    const productService = ProductService.getInstance();
    const product = await productService.updateProduct(
      params.id,
      storeId,
      body
    );

    return NextResponse.json(product);
  } catch (error) {
    console.error('PATCH /api/products/[id] error:', error);
    
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
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product (soft delete)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
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
        { error: 'Access denied. You do not have permission to delete products in this store.' },
        { status: 403 }
      );
    }

    const productService = ProductService.getInstance();
    
    // Soft delete (sets deletedAt timestamp)
    await productService.deleteProduct(params.id, storeId);

    return NextResponse.json({ 
      success: true,
      message: 'Product deleted successfully',
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Full product update (replaces all fields)
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const body = await request.json();
    
    // Get storeId from request body
    const storeId = body.storeId;
    
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
        { error: 'Access denied. You do not have permission to modify products in this store.' },
        { status: 403 }
      );
    }

    const productService = ProductService.getInstance();
    const product = await productService.updateProduct(
      params.id,
      storeId,
      body
    );

    return NextResponse.json(product);
  } catch (error) {
    console.error('PUT /api/products/[id] error:', error);
    
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
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}
