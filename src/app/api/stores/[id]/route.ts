// src/app/api/stores/[id]/route.ts
// Store detail API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkPermission } from '@/lib/auth-helpers';
import { withRateLimit } from '@/middleware/rate-limit';
import { StoreService, UpdateStoreSchema } from '@/lib/services/store.service';
import { z } from 'zod';

// GET /api/stores/[id] - Get store by ID
export const GET = withRateLimit(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const storeService = StoreService.getInstance();
    const store = await storeService.getById(id);

    return NextResponse.json({ data: store });
  } catch (error) {
    console.error('GET /api/stores/[id] error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch store',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: error instanceof Error && error.message === 'Store not found' ? 404 : 500 }
    );
  }
});

// PUT /api/stores/[id] - Update store
export const PUT = withRateLimit(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    const hasPermission = await checkPermission('stores:update');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied. You do not have permission to update stores.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateStoreSchema.parse(body);

    const storeService = StoreService.getInstance();
    const store = await storeService.update(id, validatedData);

    return NextResponse.json({
      data: store,
      message: 'Store updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/stores/[id] error:', error);

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
        error: 'Failed to update store',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

// DELETE /api/stores/[id] - Delete store (soft delete)
export const DELETE = withRateLimit(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    const hasPermission = await checkPermission('stores:delete');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied. You do not have permission to delete stores.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const storeService = StoreService.getInstance();
    await storeService.delete(id);

    return NextResponse.json({
      message: 'Store deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/stores/[id] error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete store',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
