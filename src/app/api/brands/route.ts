// src/app/api/brands/route.ts
// Brands API Routes - List and Create

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { BrandService } from '@/lib/services/brand.service';
import { z } from 'zod';

// GET /api/brands - List brands
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '20'), 100);

    const brandService = BrandService.getInstance();
    const result = await brandService.getBrands(storeId, {
      search: searchParams.get('search') || undefined,
      isPublished: searchParams.get('isPublished') === 'true' ? true 
                  : searchParams.get('isPublished') === 'false' ? false 
                  : undefined,
    }, page, perPage);

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/brands error:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

// POST /api/brands - Create brand
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    const brandService = BrandService.getInstance();
    const brand = await brandService.createBrand(body.storeId, body);

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
