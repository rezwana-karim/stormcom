/**
 * Admin User Rejection API
 * 
 * Reject a pending user account.
 * Super Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { sendRejectionEmail } from '@/lib/email-service';

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

/**
 * POST /api/admin/users/[id]/reject
 * Reject a pending user
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Validate request body
    const body = await request.json();
    const validation = rejectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { reason } = validation.data;

    // Find the user to reject
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        accountStatus: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.accountStatus !== 'PENDING') {
      return NextResponse.json(
        { error: `User is not pending approval (current status: ${targetUser.accountStatus})` },
        { status: 400 }
      );
    }

    // Update user status to REJECTED
    const rejectedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        accountStatus: 'REJECTED',
        statusChangedAt: new Date(),
        statusChangedBy: session.user.id,
        rejectionReason: reason,
      },
      select: {
        id: true,
        name: true,
        email: true,
        accountStatus: true,
        rejectionReason: true,
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: params.id,
        type: 'ACCOUNT_REJECTED',
        title: 'Account Application Not Approved',
        message: `Your account application was not approved. Reason: ${reason}`,
        actionUrl: '/support',
        actionLabel: 'Contact Support',
      },
    });

    // Log platform activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: params.id,
        action: 'USER_REJECTED',
        entityType: 'User',
        entityId: params.id,
        description: `Rejected user account for ${targetUser.name || targetUser.email}`,
        metadata: JSON.stringify({ reason }),
      },
    });

    // Send rejection email (async, don't block response)
    if (targetUser.email) {
      sendRejectionEmail(
        targetUser.email,
        targetUser.name || 'User',
        reason
      ).catch((err) => console.error('Failed to send rejection email:', err));
    }

    return NextResponse.json({
      user: rejectedUser,
      message: 'User rejected successfully',
    });
  } catch (error) {
    console.error('Reject user error:', error);
    return NextResponse.json(
      { error: 'Failed to reject user' },
      { status: 500 }
    );
  }
}
