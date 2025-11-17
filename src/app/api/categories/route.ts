// src/app/api/categories/route.ts
// Categories API Routes - List and Create

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CategoryService } from '@/lib/services/category.service';
import { z } from 'zod';

// GET /api/categories - List categories
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

    const categoryService = CategoryService.getInstance();
    const categories = await categoryService.getCategories(storeId, {
      isPublished: searchParams.get('isPublished') === 'true' ? true 
                  : searchParams.get('isPublished') === 'false' ? false 
                  : undefined,
      parentId: searchParams.get('parentId') || undefined,
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/categories - Create category
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

    const categoryService = CategoryService.getInstance();
    const category = await categoryService.createCategory(body.storeId, body);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('POST /api/categories error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
