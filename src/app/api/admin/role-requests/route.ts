/**
 * Admin Role Requests API
 * 
 * GET /api/admin/role-requests - List all custom role requests
 * 
 * Super Admin endpoint to manage custom role requests across all stores.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/role-requests
 * 
 * List all custom role requests with filtering and pagination
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
    const status = searchParams.get('status');
    const storeId = searchParams.get('storeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const skip = (page - 1) * limit;
    
    // Build where clause
    const whereClause: Record<string, unknown> = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (storeId) {
      whereClause.storeId = storeId;
    }
    
    if (search) {
      whereClause.OR = [
        { roleName: { contains: search } },
        { roleDescription: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { store: { name: { contains: search } } },
      ];
    }
    
    // Get requests with pagination
    const [requests, total, counts] = await Promise.all([
      prisma.customRoleRequest.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          store: {
            select: { id: true, name: true, slug: true },
          },
          reviewer: {
            select: { id: true, name: true, email: true },
          },
          customRole: {
            select: { id: true, name: true, isActive: true },
          },
        },
        orderBy: [
          { status: 'asc' }, // PENDING first
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.customRoleRequest.count({ where: whereClause }),
      prisma.customRoleRequest.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);
    
    // Format status counts
    const statusCounts = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CANCELLED: 0,
      INFO_REQUESTED: 0,
    };
    counts.forEach(c => {
      statusCounts[c.status as keyof typeof statusCounts] = c._count;
    });
    
    return NextResponse.json({
      data: requests.map(r => ({
        ...r,
        permissions: JSON.parse(r.permissions),
        modifiedPermissions: r.modifiedPermissions ? JSON.parse(r.modifiedPermissions) : null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      counts: statusCounts,
    });
    
  } catch (error) {
    console.error('List role requests error:', error);
    return NextResponse.json(
      { error: 'Failed to list role requests' },
      { status: 500 }
    );
  }
}
