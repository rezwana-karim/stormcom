// src/app/api/brands/route.ts
// Brands API Routes - List and Create

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkPermission } from '@/lib/auth-helpers';
import { BrandService } from '@/lib/services/brand.service';
import { getCurrentStoreId } from '@/lib/get-current-user';
import { z } from 'zod';

// GET /api/brands - List brands
export async function GET(request: NextRequest) {
  try {
    // Check permission for reading brands
    const hasPermission = await checkPermission('brands:read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to view brands.' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = await getCurrentStoreId();
    if (!storeId) {
      return NextResponse.json({ error: 'No store found for user' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '20'), 100);

    const brandService = BrandService.getInstance();
    const result = await brandService.getBrands(
      storeId,
      {
        search: searchParams.get('search') || undefined,
        isPublished: searchParams.get('isPublished') === 'true' ? true 
                    : searchParams.get('isPublished') === 'false' ? false 
                    : undefined,
        sortBy: (searchParams.get('sortBy') as 'name' | 'createdAt' | 'updatedAt' | undefined) || 'name',
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc' | undefined) || 'asc',
      },
      page,
      perPage
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/brands error:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

// POST /api/brands - Create brand
export async function POST(request: NextRequest) {
  try {
    // Check permission for creating brands
    const hasPermission = await checkPermission('brands:create');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to create brands.' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = await getCurrentStoreId();
    if (!storeId) {
      return NextResponse.json({ error: 'No store found for user' }, { status: 400 });
    }

    const body = await request.json();
    const brandService = BrandService.getInstance();
    const brand = await brandService.createBrand(storeId, body);

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    console.error('POST /api/brands error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
