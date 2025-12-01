/**
 * Super Admin - List Stores with Custom Role Statistics
 * 
 * GET /api/admin/custom-roles/stores - List all stores with role stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/custom-roles/stores
 * List all stores with custom role statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is Super Admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });
    
    if (!user?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'roleCount';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { email: { contains: search } },
      ];
    }
    
    // Get total count
    const total = await prisma.store.count({ where });
    
    // Get stores with role counts
    const stores = await prisma.store.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        customRoleLimit: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true,
        organization: {
          select: {
            memberships: {
              where: { role: 'OWNER' },
              select: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
              take: 1,
            },
          },
        },
        _count: {
          select: { 
            customRoles: true,
            staff: true,
          },
        },
        customRoles: {
          where: { isActive: true },
          select: { id: true },
        },
      },
      skip,
      take: limit,
      orderBy: sortBy === 'roleCount' 
        ? { customRoles: { _count: order } }
        : sortBy === 'name'
        ? { name: order }
        : sortBy === 'limit'
        ? { customRoleLimit: order }
        : { createdAt: order },
    });
    
    // Format response
    const formattedStores = stores.map(store => {
      const owner = store.organization.memberships[0]?.user;
      const activeRoles = store.customRoles.length;
      const totalRoles = store._count.customRoles;
      
      return {
        id: store.id,
        name: store.name,
        slug: store.slug,
        email: store.email,
        owner: owner ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
        } : null,
        customRoles: {
          total: totalRoles,
          active: activeRoles,
          inactive: totalRoles - activeRoles,
        },
        limit: store.customRoleLimit,
        remaining: Math.max(0, store.customRoleLimit - totalRoles),
        isAtLimit: totalRoles >= store.customRoleLimit,
        staffCount: store._count.staff,
        subscriptionPlan: store.subscriptionPlan,
        subscriptionStatus: store.subscriptionStatus,
        createdAt: store.createdAt,
      };
    });
    
    return NextResponse.json({
      stores: formattedStores,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('List stores with custom roles error:', error);
    return NextResponse.json(
      { error: 'Failed to list stores' },
      { status: 500 }
    );
  }
}
