/**
 * Store Custom Roles API
 * 
 * GET /api/stores/[id]/custom-roles - List approved custom roles for a store
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Check if user has access to a store via membership or staff
 */
async function checkStoreAccess(userId: string, storeId: string): Promise<boolean> {
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      OR: [
        // User is a member of the organization that owns the store
        { 
          organization: {
            memberships: {
              some: { userId }
            }
          }
        },
        // User is staff at this store
        { 
          staff: { 
            some: { 
              userId,
              isActive: true,
            } 
          } 
        },
      ],
    },
    select: { id: true },
  });
  
  return !!store;
}

/**
 * Check if user is store owner (OWNER role in org membership)
 */
async function isStoreOwner(userId: string, storeId: string): Promise<boolean> {
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      organization: {
        memberships: {
          some: {
            userId,
            role: 'OWNER',
          }
        }
      }
    },
    select: { id: true },
  });
  
  return !!store;
}

/**
 * GET /api/stores/[id]/custom-roles
 * List approved custom roles for a store
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
    
    const { id: storeId } = await context.params;
    
    // Verify user has access to this store
    const hasAccess = await checkStoreAccess(session.user.id, storeId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Store not found or access denied' },
        { status: 404 }
      );
    }
    
    // Check if user is owner
    const isOwner = await isStoreOwner(session.user.id, storeId);
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    
    // Build where clause
    const where: Record<string, unknown> = { storeId };
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get custom roles
    const customRoles = await prisma.customRole.findMany({
      where,
      include: {
        request: {
          select: {
            id: true,
            permissions: true,
            justification: true,
            reviewedAt: true,
          },
        },
        _count: {
          select: { staffAssignments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Format response
    const formattedRoles = customRoles.map((role: {
      id: string;
      name: string;
      description: string | null;
      permissions: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      request: { id: string; permissions: string; justification: string | null; reviewedAt: Date | null; } | null;
      _count: { staffAssignments: number };
    }) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isActive: role.isActive,
      staffCount: role._count.staffAssignments,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      request: role.request ? {
        id: role.request.id,
        requestedPermissions: role.request.permissions,
        justification: role.request.justification,
        reviewedAt: role.request.reviewedAt,
      } : null,
    }));
    
    return NextResponse.json({
      customRoles: formattedRoles,
      count: formattedRoles.length,
      storeId,
      isOwner,
    });
    
  } catch (error) {
    console.error('Get custom roles error:', error);
    return NextResponse.json(
      { error: 'Failed to get custom roles' },
      { status: 500 }
    );
  }
}
