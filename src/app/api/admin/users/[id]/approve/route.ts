/**
 * Admin User Approval API
 * 
 * Approve a pending user account.
 * Super Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendApprovalEmail } from '@/lib/email-service';

/**
 * POST /api/admin/users/[id]/approve
 * Approve a pending user
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

    // Find the user to approve
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

    // Update user status to APPROVED
    const approvedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        accountStatus: 'APPROVED',
        statusChangedAt: new Date(),
        statusChangedBy: session.user.id,
        approvedAt: new Date(),
        approvedBy: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        accountStatus: true,
        approvedAt: true,
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: params.id,
        type: 'ACCOUNT_APPROVED',
        title: 'Account Approved!',
        message: 'Your account has been approved. You can now request a store to be created for your business.',
        actionUrl: '/dashboard',
        actionLabel: 'Go to Dashboard',
      },
    });

    // Log platform activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: params.id,
        action: 'USER_APPROVED',
        entityType: 'User',
        entityId: params.id,
        description: `Approved user account for ${targetUser.name || targetUser.email}`,
      },
    });

    // Send approval email (async, don't block response)
    if (targetUser.email) {
      sendApprovalEmail(
        targetUser.email,
        targetUser.name || 'User'
      ).catch((err) => console.error('Failed to send approval email:', err));
    }

    return NextResponse.json({
      user: approvedUser,
      message: 'User approved successfully',
    });
  } catch (error) {
    console.error('Approve user error:', error);
    return NextResponse.json(
      { error: 'Failed to approve user' },
      { status: 500 }
    );
  }
}
