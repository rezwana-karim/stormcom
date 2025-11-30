/**
 * Admin Stores API
 * 
 * Manage all stores in the system (Super Admin only).
 * 
 * NOTE: Direct store creation is DISABLED.
 * Stores can only be created by approving store requests at:
 * POST /api/admin/store-requests/[id]/approve
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
 * 
 * NOTE: This endpoint is for INTERNAL USE ONLY.
 * Stores should be created by approving store requests at:
 * POST /api/admin/store-requests/[id]/approve
 * 
 * Direct store creation is disabled. Use the store request approval workflow.
 */
export async function POST(request: NextRequest) {
  // Direct store creation is disabled.
  // Stores can only be created by approving store requests.
  return NextResponse.json(
    { 
      error: 'Direct store creation is disabled',
      message: 'Stores can only be created by approving store requests. Please use the Store Requests page to approve pending requests.',
      redirectUrl: '/admin/stores/requests'
    },
    { status: 403 }
  );
}
