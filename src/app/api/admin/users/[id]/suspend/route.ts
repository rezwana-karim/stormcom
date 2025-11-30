/**
 * Admin User Suspend API
 * 
 * Suspend an active user account.
 * Super Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const suspendSchema = z.object({
  reason: z.string().min(1, 'Suspension reason is required').max(500),
});

/**
 * POST /api/admin/users/[id]/suspend
 * Suspend a user
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

    // Prevent self-suspension
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot suspend your own account' },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = suspendSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { reason } = validation.data;

    // Find the user to suspend
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        accountStatus: true,
        isSuperAdmin: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot suspend a Super Admin account' },
        { status: 400 }
      );
    }

    if (targetUser.accountStatus === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'User is already suspended' },
        { status: 400 }
      );
    }

    // Update user status to SUSPENDED
    const suspendedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        accountStatus: 'SUSPENDED',
        statusChangedAt: new Date(),
        statusChangedBy: session.user.id,
        rejectionReason: reason, // Store suspension reason
      },
      select: {
        id: true,
        name: true,
        email: true,
        accountStatus: true,
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: params.id,
        type: 'ACCOUNT_SUSPENDED',
        title: 'Account Suspended',
        message: `Your account has been suspended. Reason: ${reason}. Please contact support for more information.`,
        actionUrl: '/support',
        actionLabel: 'Contact Support',
      },
    });

    // Log platform activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: params.id,
        action: 'USER_SUSPENDED',
        entityType: 'User',
        entityId: params.id,
        description: `Suspended user account for ${targetUser.name || targetUser.email}`,
        metadata: JSON.stringify({ reason }),
      },
    });

    return NextResponse.json({
      user: suspendedUser,
      message: 'User suspended successfully',
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    return NextResponse.json(
      { error: 'Failed to suspend user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]/suspend
 * Unsuspend (reactivate) a user
 */
export async function DELETE(
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

    // Find the user
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

    if (targetUser.accountStatus !== 'SUSPENDED') {
      return NextResponse.json(
        { error: 'User is not suspended' },
        { status: 400 }
      );
    }

    // Reactivate user
    const reactivatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        accountStatus: 'APPROVED',
        statusChangedAt: new Date(),
        statusChangedBy: session.user.id,
        rejectionReason: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        accountStatus: true,
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: params.id,
        type: 'ACCOUNT_APPROVED',
        title: 'Account Reactivated',
        message: 'Your account has been reactivated. Welcome back!',
        actionUrl: '/dashboard',
        actionLabel: 'Go to Dashboard',
      },
    });

    // Log platform activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: params.id,
        action: 'USER_UNSUSPENDED',
        entityType: 'User',
        entityId: params.id,
        description: `Reactivated user account for ${targetUser.name || targetUser.email}`,
      },
    });

    return NextResponse.json({
      user: reactivatedUser,
      message: 'User reactivated successfully',
    });
  } catch (error) {
    console.error('Unsuspend user error:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate user' },
      { status: 500 }
    );
  }
}
