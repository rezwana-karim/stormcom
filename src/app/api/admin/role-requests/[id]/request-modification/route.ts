/**
 * Admin Request Modification API
 * 
 * POST /api/admin/role-requests/[id]/request-modification - Request changes to a role request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { isPermissionAllowed } from '@/lib/custom-role-permissions';
import { sendRoleModificationRequestedEmail } from '@/lib/email-service';

const requestModificationSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  suggestedPermissions: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/role-requests/[id]/request-modification
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
      select: { isSuperAdmin: true },
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
    const validation = requestModificationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { message, suggestedPermissions, notes } = validation.data;
    
    // Validate suggested permissions if provided
    if (suggestedPermissions && suggestedPermissions.length > 0) {
      const invalidPermissions = suggestedPermissions.filter(p => !isPermissionAllowed(p));
      
      if (invalidPermissions.length > 0) {
        return NextResponse.json(
          { 
            error: 'Invalid permissions in suggestion',
            invalidPermissions,
          },
          { status: 400 }
        );
      }
    }
    
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
        { error: 'Request is not in a modifiable state' },
        { status: 400 }
      );
    }
    
    // Update request status
    const updateData: Record<string, unknown> = {
      status: 'INFO_REQUESTED',
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      adminNotes: notes,
    };
    
    // Store suggested permissions as metadata
    if (suggestedPermissions) {
      updateData.adminNotes = JSON.stringify({
        message,
        suggestedPermissions,
        additionalNotes: notes,
      });
    }
    
    const updatedRequest = await prisma.customRoleRequest.update({
      where: { id },
      data: updateData,
    });
    
    // Notify the user
    await prisma.notification.create({
      data: {
        userId: roleRequest.userId,
        type: 'ROLE_REQUEST_MODIFIED',
        title: 'Changes Requested for Custom Role',
        message: `Changes have been requested for your custom role "${roleRequest.roleName}". ${message.substring(0, 100)}...`,
        actionUrl: `/dashboard/stores/${roleRequest.storeId}/roles/requests/${id}`,
        actionLabel: 'Review & Update',
        data: JSON.stringify({
          requestId: id,
          roleName: roleRequest.roleName,
          message,
          suggestedPermissions,
        }),
      },
    });
    
    // Log platform activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: roleRequest.userId,
        storeId: roleRequest.storeId,
        action: 'ROLE_REQUEST_MODIFICATION_REQUESTED',
        entityType: 'CustomRoleRequest',
        entityId: id,
        description: `Requested modifications to role request "${roleRequest.roleName}" for "${roleRequest.store.name}"`,
        metadata: JSON.stringify({ 
          message: message.substring(0, 200),
          hasSuggestedPermissions: !!suggestedPermissions,
        }),
      },
    });
    
    // Send email notification (non-blocking)
    if (roleRequest.user.email) {
      sendRoleModificationRequestedEmail(
        roleRequest.user.email,
        roleRequest.user.name || 'Store Owner',
        roleRequest.store.name,
        roleRequest.roleName,
        message
      ).catch(err => console.error('Failed to send modification requested email:', err));
    }
    
    return NextResponse.json({
      success: true,
      message: 'Modification request sent',
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
      },
    });
    
  } catch (error) {
    console.error('Request modification error:', error);
    return NextResponse.json(
      { error: 'Failed to request modification' },
      { status: 500 }
    );
  }
}
