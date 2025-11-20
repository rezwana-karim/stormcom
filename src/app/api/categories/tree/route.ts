// src/app/api/categories/tree/route.ts
// Category Tree API Route - Get hierarchical category structure

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CategoryService } from '@/lib/services/category.service';
import { getCurrentStoreId } from '@/lib/get-current-user';

// GET /api/categories/tree - Get category tree
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = await getCurrentStoreId();
    if (!storeId) {
      return NextResponse.json({ error: 'No store found for user' }, { status: 400 });
    }

    const categoryService = CategoryService.getInstance();
    const tree = await categoryService.getCategoryTree(storeId);

    return NextResponse.json({ tree });
  } catch (error) {
    console.error('GET /api/categories/tree error:', error);
    return NextResponse.json({ error: 'Failed to fetch category tree' }, { status: 500 });
  }
}
