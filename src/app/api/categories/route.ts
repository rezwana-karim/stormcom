// src/app/api/categories/route.ts
// Categories API Routes - List and Create

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkPermission } from '@/lib/auth-helpers';
import { CategoryService } from '@/lib/services/category.service';
import { getCurrentStoreId } from '@/lib/get-current-user';
import { z } from 'zod';

// GET /api/categories - List categories
export async function GET(request: NextRequest) {
  try {
    // Check permission for reading categories
    const hasPermission = await checkPermission('categories:read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to view categories.' },
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
    const categoryService = CategoryService.getInstance();
    
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '50');
    
    const result = await categoryService.getCategories(
      storeId,
      {
        search: searchParams.get('search') || undefined,
        isPublished: searchParams.get('isPublished') === 'true' ? true 
                    : searchParams.get('isPublished') === 'false' ? false 
                    : undefined,
        parentId: searchParams.get('parentId') || undefined,
        sortBy: (searchParams.get('sortBy') as 'name' | 'sortOrder' | 'createdAt' | 'updatedAt' | undefined) || 'sortOrder',
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc' | undefined) || 'asc',
      },
      page,
      perPage
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/categories - Create category
export async function POST(request: NextRequest) {
  try {
    // Check permission for creating categories
    const hasPermission = await checkPermission('categories:create');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to create categories.' },
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
    const categoryService = CategoryService.getInstance();
    const category = await categoryService.createCategory(storeId, body);

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
