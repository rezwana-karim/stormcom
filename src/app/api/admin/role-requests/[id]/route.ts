/**
 * Admin Role Request Detail API
 * 
 * GET /api/admin/role-requests/[id] - Get request details
 * 
 * Super Admin endpoint to view custom role request details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AVAILABLE_PERMISSIONS } from '@/lib/custom-role-permissions';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/role-requests/[id]
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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
    
    const { id } = await context.params;
    
    const roleRequest = await prisma.customRoleRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            businessName: true,
            createdAt: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            subscriptionPlan: true,
          },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
        customRole: {
          include: {
            _count: {
              select: { staffAssignments: true },
            },
          },
        },
      },
    });
    
    if (!roleRequest) {
      return NextResponse.json(
        { error: 'Role request not found' },
        { status: 404 }
      );
    }
    
    // Get previous requests from same user/store for context
    const previousRequests = await prisma.customRoleRequest.findMany({
      where: {
        storeId: roleRequest.storeId,
        id: { not: roleRequest.id },
      },
      select: {
        id: true,
        roleName: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    // Get existing custom roles in this store
    const existingRoles = await prisma.customRole.findMany({
      where: { storeId: roleRequest.storeId },
      select: {
        id: true,
        name: true,
        isActive: true,
        _count: {
          select: { staffAssignments: true },
        },
      },
    });
    
    return NextResponse.json({
      request: {
        ...roleRequest,
        permissions: JSON.parse(roleRequest.permissions),
        modifiedPermissions: roleRequest.modifiedPermissions 
          ? JSON.parse(roleRequest.modifiedPermissions) 
          : null,
      },
      previousRequests,
      existingRoles: existingRoles.map(r => ({
        ...r,
        staffCount: r._count.staffAssignments,
      })),
      availablePermissions: AVAILABLE_PERMISSIONS,
    });
    
  } catch (error) {
    console.error('Get role request detail error:', error);
    return NextResponse.json(
      { error: 'Failed to get role request details' },
      { status: 500 }
    );
  }
}
