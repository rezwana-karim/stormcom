/**
 * Admin Approve Role Request API
 * 
 * POST /api/admin/role-requests/[id]/approve - Approve a custom role request
 * 
 * When approved, this creates the CustomRole and notifies the user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { validatePermissions } from '@/lib/custom-role-permissions';
import { sendRoleApprovedEmail } from '@/lib/email-service';

const approveSchema = z.object({
  modifiedPermissions: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/role-requests/[id]/approve
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
    
    // Check if user is Super Admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true, name: true, email: true },
    });
    
    if (!currentUser?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }
    
    const { id } = await context.params;
    
    // Parse request body
    const body = await request.json();
    const validation = approveSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { modifiedPermissions, notes } = validation.data;
    
    // Get the role request
    const roleRequest = await prisma.customRoleRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        store: {
          select: { id: true, name: true },
        },
      },
    });
    
    if (!roleRequest) {
      return NextResponse.json(
        { error: 'Role request not found' },
        { status: 404 }
      );
    }
    
    // Check request is pending
    if (!['PENDING', 'INFO_REQUESTED'].includes(roleRequest.status)) {
      return NextResponse.json(
        { error: 'Request is not pending approval' },
        { status: 400 }
      );
    }
    
    // Determine final permissions
    const originalPermissions = JSON.parse(roleRequest.permissions) as string[];
    const finalPermissions = modifiedPermissions || originalPermissions;
    
    // Validate final permissions
    const permissionValidation = validatePermissions(finalPermissions);
    if (!permissionValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid permissions', details: permissionValidation.errors },
        { status: 400 }
      );
    }
    
    // Check for duplicate role name (shouldn't happen but double-check)
    const existingRole = await prisma.customRole.findUnique({
      where: {
        storeId_name: {
          storeId: roleRequest.storeId,
          name: roleRequest.roleName,
        },
      },
    });
    
    if (existingRole) {
      return NextResponse.json(
        { error: 'A role with this name already exists in the store' },
        { status: 400 }
      );
    }
    
    // Create custom role and update request in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the custom role
      const customRole = await tx.customRole.create({
        data: {
          storeId: roleRequest.storeId,
          name: roleRequest.roleName,
          description: roleRequest.roleDescription,
          permissions: JSON.stringify(finalPermissions),
          approvedById: session.user.id,
          approvedAt: new Date(),
          createdById: roleRequest.userId,
          isActive: true,
        },
      });
      
      // Update the request
      const updatedRequest = await tx.customRoleRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          adminNotes: notes,
          modifiedPermissions: modifiedPermissions 
            ? JSON.stringify(modifiedPermissions) 
            : null,
          customRoleId: customRole.id,
        },
      });
      
      return { customRole, updatedRequest };
    });
    
    // Determine notification type based on modifications
    const wasModified = modifiedPermissions && 
      JSON.stringify(modifiedPermissions.sort()) !== JSON.stringify(originalPermissions.sort());
    
    // Notify the user
    await prisma.notification.create({
      data: {
        userId: roleRequest.userId,
        type: wasModified ? 'ROLE_REQUEST_MODIFIED' : 'ROLE_REQUEST_APPROVED',
        title: wasModified 
          ? 'Custom Role Approved with Modifications' 
          : 'Custom Role Request Approved',
        message: wasModified
          ? `Your custom role "${roleRequest.roleName}" has been approved with some modifications to the permissions. You can now assign this role to staff members.`
          : `Your custom role "${roleRequest.roleName}" has been approved! You can now assign this role to staff members.`,
        actionUrl: `/dashboard/stores/${roleRequest.storeId}/staff`,
        actionLabel: 'Manage Staff',
        data: JSON.stringify({
          customRoleId: result.customRole.id,
          roleName: roleRequest.roleName,
          storeId: roleRequest.storeId,
          wasModified,
        }),
      },
    });
    
    // Log platform activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: roleRequest.userId,
        storeId: roleRequest.storeId,
        action: 'ROLE_REQUEST_APPROVED',
        entityType: 'CustomRole',
        entityId: result.customRole.id,
        description: `Approved custom role "${roleRequest.roleName}" for "${roleRequest.store.name}"${wasModified ? ' (with modifications)' : ''}`,
        metadata: JSON.stringify({
          requestId: id,
          wasModified,
          finalPermissions,
        }),
      },
    });
    
    // Send email notification (non-blocking)
    if (roleRequest.user.email) {
      sendRoleApprovedEmail(
        roleRequest.user.email,
        roleRequest.user.name || 'Store Owner',
        roleRequest.store.name,
        roleRequest.roleName
      ).catch(err => console.error('Failed to send role approved email:', err));
    }
    
    return NextResponse.json({
      success: true,
      message: wasModified 
        ? 'Role request approved with modifications' 
        : 'Role request approved',
      customRole: {
        id: result.customRole.id,
        name: result.customRole.name,
        permissions: finalPermissions,
        storeId: result.customRole.storeId,
      },
      request: {
        id: result.updatedRequest.id,
        status: result.updatedRequest.status,
      },
    });
    
  } catch (error) {
    console.error('Approve role request error:', error);
    return NextResponse.json(
      { error: 'Failed to approve role request' },
      { status: 500 }
    );
  }
}
