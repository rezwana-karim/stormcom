/**
 * Store Custom Roles API
 * 
 * GET /api/stores/[id]/custom-roles - List custom roles with usage stats
 * POST /api/stores/[id]/custom-roles - Create new custom role (with limit check)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { validatePermissions } from '@/lib/custom-role-permissions';
import { CustomRoleAction } from '@prisma/client';

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
 * Get custom role usage for a store
 */
async function getStoreRoleUsage(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { customRoleLimit: true },
  });
  
  const roleCount = await prisma.customRole.count({
    where: { storeId },
  });
  
  return {
    current: roleCount,
    limit: store?.customRoleLimit ?? 5,
    remaining: Math.max(0, (store?.customRoleLimit ?? 5) - roleCount),
  };
}

/**
 * Log custom role activity
 */
async function logCustomRoleActivity(params: {
  action: CustomRoleAction;
  actorId: string;
  storeId: string;
  customRoleId?: string;
  roleName: string;
  details?: Record<string, unknown>;
  previousValue?: string;
  newValue?: string;
}) {
  await prisma.customRoleActivity.create({
    data: {
      action: params.action,
      actorId: params.actorId,
      storeId: params.storeId,
      customRoleId: params.customRoleId,
      roleName: params.roleName,
      details: params.details ? JSON.stringify(params.details) : null,
      previousValue: params.previousValue,
      newValue: params.newValue,
    },
  });
}

/**
 * GET /api/stores/[id]/custom-roles
 * List custom roles for a store with usage statistics
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

    // Get custom roles with staff count
    const customRoles = await prisma.customRole.findMany({
      where,
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        lastModifiedBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: { staffAssignments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Get usage stats
    const usage = await getStoreRoleUsage(storeId);
    
    // Format response
    const formattedRoles = customRoles.map((role) => {
      let permissions: string[] = [];
      try {
        permissions = JSON.parse(role.permissions);
      } catch {
        permissions = [];
      }
      
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions,
        isActive: role.isActive,
        staffCount: role._count.staffAssignments,
        createdBy: role.createdByUser,
        lastModifiedBy: role.lastModifiedBy,
        lastModifiedAt: role.lastModifiedAt,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      };
    });
    
    return NextResponse.json({
      roles: formattedRoles,
      count: formattedRoles.length,
      usage,
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

/**
 * POST /api/stores/[id]/custom-roles
 * Create new custom role (direct creation by store owner)
 */
export async function POST(
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
    
    // Only store owner can create custom roles
    const isOwner = await isStoreOwner(session.user.id, storeId);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only store owners can create custom roles' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const { name, description, permissions } = body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json(
        { error: 'At least one permission is required' },
        { status: 400 }
      );
    }
    
    // Validate permissions
    const validation = validatePermissions(permissions);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid permissions',
          details: validation.errors,
          invalidPermissions: validation.invalidPermissions,
        },
        { status: 400 }
      );
    }
    
    // Check role limit
    const usage = await getStoreRoleUsage(storeId);
    if (usage.remaining <= 0) {
      return NextResponse.json(
        { 
          error: 'Custom role limit reached',
          message: `Your store has reached the maximum of ${usage.limit} custom roles. Please delete an existing role or contact support to increase your limit.`,
          usage,
        },
        { status: 403 }
      );
    }
    
    // Check for duplicate role name
    const existingRole = await prisma.customRole.findUnique({
      where: {
        storeId_name: {
          storeId,
          name: name.trim(),
        },
      },
    });
    
    if (existingRole) {
      return NextResponse.json(
        { error: `A role named "${name.trim()}" already exists in this store` },
        { status: 409 }
      );
    }
    
    // Create the role
    const role = await prisma.customRole.create({
      data: {
        storeId,
        name: name.trim(),
        description: description?.trim() || null,
        permissions: JSON.stringify(permissions),
        createdById: session.user.id,
        isActive: true,
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { staffAssignments: true },
        },
      },
    });
    
    // Log activity
    await logCustomRoleActivity({
      action: CustomRoleAction.ROLE_CREATED,
      actorId: session.user.id,
      storeId,
      customRoleId: role.id,
      roleName: role.name,
      details: { permissions },
      newValue: JSON.stringify({ name: role.name, permissions }),
    });
    
    // Get updated usage
    const updatedUsage = await getStoreRoleUsage(storeId);
    
    return NextResponse.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions,
        isActive: role.isActive,
        staffCount: role._count.staffAssignments,
        createdBy: role.createdByUser,
        createdAt: role.createdAt,
      },
      usage: updatedUsage,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create custom role error:', error);
    return NextResponse.json(
      { error: 'Failed to create custom role' },
      { status: 500 }
    );
  }
}
