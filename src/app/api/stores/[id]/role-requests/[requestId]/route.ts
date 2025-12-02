/**
 * Store Role Request Detail API
 * 
 * GET    /api/stores/[id]/role-requests/[requestId] - Get request details
 * PATCH  /api/stores/[id]/role-requests/[requestId] - Update request
 * DELETE /api/stores/[id]/role-requests/[requestId] - Cancel request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { validatePermissions } from '@/lib/custom-role-permissions';

// Validation schema for updating role request
const updateRoleRequestSchema = z.object({
  roleName: z.string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z0-9\s\-_]+$/)
    .optional(),
  roleDescription: z.string().max(500).optional(),
  permissions: z.array(z.string()).min(1).optional(),
  justification: z.string().max(1000).optional(),
});

interface RouteContext {
  params: Promise<{ id: string; requestId: string }>;
}

/**
 * GET /api/stores/[id]/role-requests/[requestId]
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
    
    const { id: storeId, requestId } = await context.params;
    
    // Check user has access
    const hasAccess = await checkStoreAccess(session.user.id, storeId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const roleRequest = await prisma.customRoleRequest.findFirst({
      where: { id: requestId, storeId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
        store: {
          select: { id: true, name: true, slug: true },
        },
        customRole: true,
      },
    });
    
    if (!roleRequest) {
      return NextResponse.json(
        { error: 'Role request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      request: {
        ...roleRequest,
        permissions: JSON.parse(roleRequest.permissions),
        modifiedPermissions: roleRequest.modifiedPermissions 
          ? JSON.parse(roleRequest.modifiedPermissions) 
          : null,
      },
    });
    
  } catch (error) {
    console.error('Get role request error:', error);
    return NextResponse.json(
      { error: 'Failed to get role request' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/stores/[id]/role-requests/[requestId]
 * 
 * Update a role request (only if status is PENDING or INFO_REQUESTED)
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
    
    const { id: storeId, requestId } = await context.params;
    
    // Check user has admin access
    const hasAdminAccess = await checkStoreAdminAccess(session.user.id, storeId);
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Store Admin access required' },
        { status: 403 }
      );
    }
    
    // Get existing request
    const existingRequest = await prisma.customRoleRequest.findFirst({
      where: { id: requestId, storeId },
    });
    
    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Role request not found' },
        { status: 404 }
      );
    }
    
    // Can only update if PENDING or INFO_REQUESTED
    if (!['PENDING', 'INFO_REQUESTED'].includes(existingRequest.status)) {
      return NextResponse.json(
        { error: 'Cannot update request in current status' },
        { status: 400 }
      );
    }
    
    // Parse and validate
    const body = await request.json();
    const validation = updateRoleRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Validate permissions if provided
    if (data.permissions) {
      const permissionValidation = validatePermissions(data.permissions);
      if (!permissionValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid permissions', details: permissionValidation.errors },
          { status: 400 }
        );
      }
    }
    
    // Check for duplicate role name if changed
    if (data.roleName && data.roleName !== existingRequest.roleName) {
      const existingRole = await prisma.customRole.findUnique({
        where: {
          storeId_name: { storeId, name: data.roleName },
        },
      });
      
      if (existingRole) {
        return NextResponse.json(
          { error: 'A custom role with this name already exists' },
          { status: 400 }
        );
      }
    }
    
    // Update request
    const updatedRequest = await prisma.customRoleRequest.update({
      where: { id: requestId },
      data: {
        ...(data.roleName && { roleName: data.roleName }),
        ...(data.roleDescription !== undefined && { roleDescription: data.roleDescription }),
        ...(data.permissions && { permissions: JSON.stringify(data.permissions) }),
        ...(data.justification !== undefined && { justification: data.justification }),
        // Reset to PENDING if was INFO_REQUESTED
        ...(existingRequest.status === 'INFO_REQUESTED' && { status: 'PENDING' }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    
    return NextResponse.json({
      request: {
        ...updatedRequest,
        permissions: JSON.parse(updatedRequest.permissions),
      },
      message: 'Role request updated successfully',
    });
    
  } catch (error) {
    console.error('Update role request error:', error);
    return NextResponse.json(
      { error: 'Failed to update role request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stores/[id]/role-requests/[requestId]
 * 
 * Cancel a role request (only if status is PENDING or INFO_REQUESTED)
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
    
    const { id: storeId, requestId } = await context.params;
    
    // Check user has admin access
    const hasAdminAccess = await checkStoreAdminAccess(session.user.id, storeId);
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Store Admin access required' },
        { status: 403 }
      );
    }
    
    // Get existing request
    const existingRequest = await prisma.customRoleRequest.findFirst({
      where: { id: requestId, storeId },
    });
    
    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Role request not found' },
        { status: 404 }
      );
    }
    
    // Can only cancel if PENDING or INFO_REQUESTED
    if (!['PENDING', 'INFO_REQUESTED'].includes(existingRequest.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel request in current status' },
        { status: 400 }
      );
    }
    
    // Update status to CANCELLED
    await prisma.customRoleRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });
    
    // Log activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        storeId,
        action: 'ROLE_REQUEST_CANCELLED',
        entityType: 'CustomRoleRequest',
        entityId: requestId,
        description: `Cancelled custom role request "${existingRequest.roleName}"`,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Role request cancelled',
    });
    
  } catch (error) {
    console.error('Cancel role request error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel role request' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Check store access
 */
async function checkStoreAccess(userId: string, storeId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      storeStaff: {
        where: { storeId, isActive: true },
        select: { id: true },
      },
      memberships: {
        where: {
          organization: { store: { id: storeId } },
        },
        select: { id: true },
      },
    },
  });
  
  if (!user) return false;
  return user.isSuperAdmin || user.storeStaff.length > 0 || user.memberships.length > 0;
}

/**
 * Helper: Check store admin access
 */
async function checkStoreAdminAccess(userId: string, storeId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      storeStaff: {
        where: { storeId, isActive: true, role: 'STORE_ADMIN' },
        select: { id: true },
      },
      memberships: {
        where: {
          organization: { store: { id: storeId } },
          role: { in: ['OWNER', 'ADMIN'] },
        },
        select: { id: true },
      },
    },
  });
  
  if (!user) return false;
  return user.isSuperAdmin || user.storeStaff.length > 0 || user.memberships.length > 0;
}
