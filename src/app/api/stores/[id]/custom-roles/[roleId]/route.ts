/**
 * Individual Custom Role API
 * 
 * GET /api/stores/[id]/custom-roles/[roleId] - Get single role details
 * PATCH /api/stores/[id]/custom-roles/[roleId] - Update custom role
 * DELETE /api/stores/[id]/custom-roles/[roleId] - Delete custom role
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { validatePermissions } from '@/lib/custom-role-permissions';
import { CustomRoleAction } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string; roleId: string }>;
}

/**
 * Check if user is store owner
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
 * GET /api/stores/[id]/custom-roles/[roleId]
 * Get single custom role details
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
    
    const { id: storeId, roleId } = await context.params;
    
    // Get role with details
    const role = await prisma.customRole.findFirst({
      where: {
        id: roleId,
        storeId,
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        lastModifiedBy: {
          select: { id: true, name: true },
        },
        staffAssignments: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        activities: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            actor: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }
    
    let permissions: string[] = [];
    try {
      permissions = JSON.parse(role.permissions);
    } catch {
      permissions = [];
    }
    
    return NextResponse.json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions,
        isActive: role.isActive,
        createdBy: role.createdByUser,
        lastModifiedBy: role.lastModifiedBy,
        lastModifiedAt: role.lastModifiedAt,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        staff: role.staffAssignments.map(s => ({
          id: s.id,
          user: s.user,
          assignedAt: s.createdAt,
        })),
        activities: role.activities.map(a => ({
          id: a.id,
          action: a.action,
          actor: a.actor,
          details: a.details ? JSON.parse(a.details) : null,
          createdAt: a.createdAt,
        })),
      },
    });
    
  } catch (error) {
    console.error('Get custom role error:', error);
    return NextResponse.json(
      { error: 'Failed to get custom role' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/stores/[id]/custom-roles/[roleId]
 * Update custom role
 */
export async function PATCH(
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
    
    const { id: storeId, roleId } = await context.params;
    
    // Only store owner can update roles
    const isOwner = await isStoreOwner(session.user.id, storeId);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only store owners can update custom roles' },
        { status: 403 }
      );
    }
    
    // Get existing role
    const existingRole = await prisma.customRole.findFirst({
      where: {
        id: roleId,
        storeId,
      },
    });
    
    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { name, description, permissions, isActive } = body;
    
    const updateData: Record<string, unknown> = {
      lastModifiedById: session.user.id,
      lastModifiedAt: new Date(),
    };
    
    // Track changes for activity log
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    let actionType: CustomRoleAction = CustomRoleAction.ROLE_UPDATED;
    
    // Update name if provided
    if (name !== undefined && name !== existingRole.name) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Role name cannot be empty' },
          { status: 400 }
        );
      }
      
      // Check for duplicate
      const duplicate = await prisma.customRole.findFirst({
        where: {
          storeId,
          name: name.trim(),
          id: { not: roleId },
        },
      });
      
      if (duplicate) {
        return NextResponse.json(
          { error: `A role named "${name.trim()}" already exists` },
          { status: 409 }
        );
      }
      
      changes.name = { old: existingRole.name, new: name.trim() };
      updateData.name = name.trim();
    }
    
    // Update description if provided
    if (description !== undefined && description !== existingRole.description) {
      changes.description = { old: existingRole.description, new: description };
      updateData.description = description?.trim() || null;
    }
    
    // Update permissions if provided
    if (permissions !== undefined) {
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
      
      const oldPermissions = JSON.parse(existingRole.permissions);
      if (JSON.stringify(oldPermissions.sort()) !== JSON.stringify(permissions.sort())) {
        changes.permissions = { old: oldPermissions, new: permissions };
        updateData.permissions = JSON.stringify(permissions);
        actionType = CustomRoleAction.PERMISSIONS_CHANGED;
      }
    }
    
    // Update isActive if provided
    if (isActive !== undefined && isActive !== existingRole.isActive) {
      changes.isActive = { old: existingRole.isActive, new: isActive };
      updateData.isActive = isActive;
      actionType = isActive ? CustomRoleAction.ROLE_REACTIVATED : CustomRoleAction.ROLE_DEACTIVATED;
    }
    
    // No changes
    if (Object.keys(changes).length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes detected',
        role: existingRole,
      });
    }
    
    // Update role
    const updatedRole = await prisma.customRole.update({
      where: { id: roleId },
      data: updateData,
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
    });
    
    // Log activity
    await logCustomRoleActivity({
      action: actionType,
      actorId: session.user.id,
      storeId,
      customRoleId: updatedRole.id,
      roleName: updatedRole.name,
      details: changes,
      previousValue: JSON.stringify({ name: existingRole.name, permissions: JSON.parse(existingRole.permissions) }),
      newValue: JSON.stringify({ name: updatedRole.name, permissions: JSON.parse(updatedRole.permissions) }),
    });
    
    return NextResponse.json({
      success: true,
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        permissions: JSON.parse(updatedRole.permissions),
        isActive: updatedRole.isActive,
        staffCount: updatedRole._count.staffAssignments,
        createdBy: updatedRole.createdByUser,
        lastModifiedBy: updatedRole.lastModifiedBy,
        lastModifiedAt: updatedRole.lastModifiedAt,
        createdAt: updatedRole.createdAt,
        updatedAt: updatedRole.updatedAt,
      },
    });
    
  } catch (error) {
    console.error('Update custom role error:', error);
    return NextResponse.json(
      { error: 'Failed to update custom role' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stores/[id]/custom-roles/[roleId]
 * Delete custom role
 */
export async function DELETE(
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
    
    const { id: storeId, roleId } = await context.params;
    
    // Only store owner can delete roles
    const isOwner = await isStoreOwner(session.user.id, storeId);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only store owners can delete custom roles' },
        { status: 403 }
      );
    }
    
    // Get role
    const role = await prisma.customRole.findFirst({
      where: {
        id: roleId,
        storeId,
      },
      include: {
        _count: {
          select: { staffAssignments: true },
        },
      },
    });
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }
    
    // Check if role is in use
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    
    if (role._count.staffAssignments > 0 && !force) {
      return NextResponse.json(
        { 
          error: 'Role is currently assigned to staff members',
          staffCount: role._count.staffAssignments,
          message: 'Remove role from staff members first, or use ?force=true to unassign automatically',
        },
        { status: 400 }
      );
    }
    
    // If force, unassign from all staff first
    if (force && role._count.staffAssignments > 0) {
      await prisma.storeStaff.updateMany({
        where: {
          customRoleId: roleId,
        },
        data: {
          customRoleId: null,
        },
      });
      
      // Log unassignment
      await logCustomRoleActivity({
        action: CustomRoleAction.ROLE_UNASSIGNED,
        actorId: session.user.id,
        storeId,
        customRoleId: roleId,
        roleName: role.name,
        details: { 
          reason: 'Role deleted with force option',
          unassignedCount: role._count.staffAssignments,
        },
      });
    }
    
    // Store role name before deletion
    const roleName = role.name;
    const rolePermissions = JSON.parse(role.permissions);
    
    // Delete role
    await prisma.customRole.delete({
      where: { id: roleId },
    });
    
    // Log deletion
    await logCustomRoleActivity({
      action: CustomRoleAction.ROLE_DELETED,
      actorId: session.user.id,
      storeId,
      customRoleId: undefined, // Role is deleted
      roleName,
      details: { 
        permissions: rolePermissions,
        forceDeleted: force,
      },
      previousValue: JSON.stringify({ name: roleName, permissions: rolePermissions }),
    });
    
    return NextResponse.json({
      success: true,
      message: 'Custom role deleted successfully',
      deletedRole: {
        id: roleId,
        name: roleName,
      },
    });
    
  } catch (error) {
    console.error('Delete custom role error:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom role' },
      { status: 500 }
    );
  }
}
