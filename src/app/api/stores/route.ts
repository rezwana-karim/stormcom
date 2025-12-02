// src/app/api/stores/route.ts
// Stores API Endpoints - Multi-tenant store management

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkPermission, getUserContext } from '@/lib/auth-helpers';
import { withRateLimit } from '@/middleware/rate-limit';
import { StoreService, CreateStoreSchema } from '@/lib/services/store.service';
import { requireOrganizationId } from '@/lib/get-current-user';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { z } from 'zod';

// GET /api/stores - List stores with pagination and filtering
export const GET = withRateLimit(async (request: NextRequest) => {
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

    // Get user context for role-based filtering
    const userContext = await getUserContext();
    
    // Determine effective role for store filtering
    let effectiveRole: string | undefined;
    let userStoreId: string | undefined;
    let userOrganizationId: string | undefined;
    
    if (userContext) {
      if (userContext.isSuperAdmin) {
        effectiveRole = 'SUPER_ADMIN';
      } else if (userContext.storeRole) {
        effectiveRole = userContext.storeRole;
        userStoreId = userContext.storeId;
      } else if (userContext.organizationRole) {
        effectiveRole = userContext.organizationRole;
        userOrganizationId = userContext.organizationId;
        userStoreId = userContext.storeId;
      }
    }

    const storeService = StoreService.getInstance();
    const result = await storeService.list(
      {
        ...queryInput,
        subscriptionPlan: queryInput.subscriptionPlan as SubscriptionPlan | undefined,
        subscriptionStatus: queryInput.subscriptionStatus as SubscriptionStatus | undefined,
      },
      session.user.id,
      effectiveRole,
      userStoreId,
      userOrganizationId
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
});

// POST /api/stores - Create a new store
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    const hasPermission = await checkPermission('stores:create');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied. You do not have permission to create stores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = CreateStoreSchema.parse(body);

    // Get organizationId from session if not provided in request
    let organizationId = validatedData.organizationId;
    const isSuperAdmin = (session.user as { isSuperAdmin?: boolean }).isSuperAdmin || false;
    
    if (!organizationId) {
      // Super admins can create stores without existing organization
      // Organization will be auto-created by the service
      if (!isSuperAdmin) {
        try {
          organizationId = await requireOrganizationId();
        } catch {
          return NextResponse.json(
            { error: 'Organization required. Please create or join an organization first.' },
            { status: 400 }
          );
        }
      }
    }

    const storeService = StoreService.getInstance();
    
    // Check slug availability
    const isSlugAvailable = await storeService.validateSlug(validatedData.slug);
    if (!isSlugAvailable) {
      return NextResponse.json(
        { error: `Store with slug '${validatedData.slug}' already exists` },
        { status: 409 }
      );
    }

    const store = await storeService.create(
      { ...validatedData, organizationId },
      session.user.id
    );

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
});
