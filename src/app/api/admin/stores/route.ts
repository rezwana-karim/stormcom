/**
 * Admin Stores API
 * 
 * Manage all stores in the system (Super Admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createStoreSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(2, 'Store name must be at least 2 characters').max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500).optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(2).default('US'),
  subscriptionPlan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).default('FREE'),
});

/**
 * GET /api/admin/stores
 * List all stores with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Super Admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    if (!currentUser?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (status) {
      whereClause.subscriptionStatus = status;
    }

    // Get total count
    const total = await prisma.store.count({ where: whereClause });

    // Get stores with related data
    const stores = await prisma.store.findMany({
      where: whereClause,
      include: {
        organization: {
          include: {
            memberships: {
              where: { role: 'OWNER' },
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
              take: 1,
            },
          },
        },
        staff: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: {
            products: true,
            orders: true,
            customers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Format response
    const formattedStores = stores.map(store => {
      const owner = store.organization.memberships[0]?.user || null;
      return {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo,
        email: store.email,
        phone: store.phone,
        owner: owner
          ? { id: owner.id, name: owner.name, email: owner.email }
          : null,
        subscriptionPlan: store.subscriptionPlan,
        subscriptionStatus: store.subscriptionStatus,
        productsCount: store._count.products,
        ordersCount: store._count.orders,
        customersCount: store._count.customers,
        staffCount: store.staff.length,
        createdAt: store.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      data: formattedStores,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List stores error:', error);
    return NextResponse.json(
      { error: 'Failed to list stores' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/stores
 * Create a new store for a user (Super Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Super Admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    if (!currentUser?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = createStoreSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if user exists and is approved
    const targetUser = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        id: true,
        name: true,
        email: true,
        accountStatus: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.accountStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'User must be approved before creating a store' },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existingStore = await prisma.store.findUnique({
      where: { slug: data.slug },
    });

    if (existingStore) {
      return NextResponse.json(
        { error: 'Store slug already exists' },
        { status: 400 }
      );
    }

    // Create organization and store in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
        },
      });

      // Create membership (user as OWNER)
      await tx.membership.create({
        data: {
          userId: data.userId,
          organizationId: organization.id,
          role: 'OWNER',
        },
      });

      // Create store
      const store = await tx.store.create({
        data: {
          organizationId: organization.id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          subscriptionPlan: data.subscriptionPlan,
          subscriptionStatus: 'ACTIVE',
        },
      });

      // Add user as store admin
      await tx.storeStaff.create({
        data: {
          userId: data.userId,
          storeId: store.id,
          role: 'STORE_ADMIN',
          isActive: true,
        },
      });

      return { organization, store };
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: 'STORE_CREATED',
        title: 'Your Store is Ready!',
        message: `Your store "${data.name}" has been created. You can now start adding products and managing your business.`,
        actionUrl: `/dashboard`,
        actionLabel: 'Go to Dashboard',
      },
    });

    // Log platform activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: data.userId,
        storeId: result.store.id,
        action: 'STORE_CREATED',
        entityType: 'Store',
        entityId: result.store.id,
        description: `Created store "${data.name}" for ${targetUser.name || targetUser.email}`,
      },
    });

    return NextResponse.json({
      store: {
        id: result.store.id,
        name: result.store.name,
        slug: result.store.slug,
        organizationId: result.organization.id,
      },
      message: 'Store created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create store error:', error);
    return NextResponse.json(
      { error: 'Failed to create store' },
      { status: 500 }
    );
  }
}
