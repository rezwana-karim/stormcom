// src/app/api/stores/route.ts
// Stores API Endpoints - Multi-tenant store management

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { StoreService, CreateStoreSchema } from '@/lib/services/store.service';
import { z } from 'zod';

// GET /api/stores - List stores with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryInput = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
      search: searchParams.get('search') || undefined,
      subscriptionPlan: searchParams.get('subscriptionPlan') || undefined,
      subscriptionStatus: searchParams.get('subscriptionStatus') || undefined,
      sortBy: (searchParams.get('sortBy') || 'createdAt') as 'name' | 'createdAt' | 'updatedAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    // Validate query parameters
    if (queryInput.page < 1) {
      return NextResponse.json(
        { error: 'Page number must be greater than 0' },
        { status: 400 }
      );
    }

    if (queryInput.limit < 1) {
      return NextResponse.json(
        { error: 'Limit must be greater than 0' },
        { status: 400 }
      );
    }

    const storeService = StoreService.getInstance();
    const result = await storeService.list(
      {
        ...queryInput,
        subscriptionPlan: queryInput.subscriptionPlan as any,
        subscriptionStatus: queryInput.subscriptionStatus as any,
      },
      session.user.id,
      undefined, // TODO: Add role from session
      undefined  // TODO: Add storeId from session
    );

    return NextResponse.json({
      data: result.stores,
      meta: result.pagination,
    });
  } catch (error) {
    console.error('GET /api/stores error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list stores',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/stores - Create a new store
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = CreateStoreSchema.parse(body);

    const storeService = StoreService.getInstance();
    
    // Check slug availability
    const isSlugAvailable = await storeService.validateSlug(validatedData.slug);
    if (!isSlugAvailable) {
      return NextResponse.json(
        { error: `Store with slug '${validatedData.slug}' already exists` },
        { status: 409 }
      );
    }

    const store = await storeService.create(validatedData, session.user.id);

    return NextResponse.json(
      {
        data: {
          id: store.id,
          name: store.name,
          slug: store.slug,
          email: store.email,
          createdAt: store.createdAt,
        },
        message: 'Store created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/stores error:', error);

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
        error: 'Failed to create store',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
