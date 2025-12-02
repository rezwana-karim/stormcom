/**
 * Admin Reject Role Request API
 * 
 * POST /api/admin/role-requests/[id]/reject - Reject a custom role request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { sendRoleRejectedEmail } from '@/lib/email-service';

const rejectSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(1000),
  notes: z.string().max(1000).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/role-requests/[id]/reject
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
    const validation = rejectSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { reason, notes } = validation.data;
    
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
        { error: 'Request is not pending' },
        { status: 400 }
      );
    }
    
    // Update request status
    const updatedRequest = await prisma.customRoleRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: reason,
        adminNotes: notes,
      },
    });
    
    // Notify the user
    await prisma.notification.create({
      data: {
        userId: roleRequest.userId,
        type: 'ROLE_REQUEST_REJECTED',
        title: 'Custom Role Request Rejected',
        message: `Your custom role request "${roleRequest.roleName}" has been rejected. Reason: ${reason}`,
        actionUrl: `/dashboard/stores/${roleRequest.storeId}/roles`,
        actionLabel: 'View Details',
        data: JSON.stringify({
          requestId: id,
          roleName: roleRequest.roleName,
          reason,
        }),
      },
    });
    
    // Log platform activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: roleRequest.userId,
        storeId: roleRequest.storeId,
        action: 'ROLE_REQUEST_REJECTED',
        entityType: 'CustomRoleRequest',
        entityId: id,
        description: `Rejected custom role request "${roleRequest.roleName}" for "${roleRequest.store.name}"`,
        metadata: JSON.stringify({ reason }),
      },
    });
    
    // Send email notification (non-blocking)
    if (roleRequest.user.email) {
      sendRoleRejectedEmail(
        roleRequest.user.email,
        roleRequest.user.name || 'Store Owner',
        roleRequest.store.name,
        roleRequest.roleName,
        reason
      ).catch(err => console.error('Failed to send role rejected email:', err));
    }
    
    return NextResponse.json({
      success: true,
      message: 'Role request rejected',
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
      },
    });
    
  } catch (error) {
    console.error('Reject role request error:', error);
    return NextResponse.json(
      { error: 'Failed to reject role request' },
      { status: 500 }
    );
  }
}
