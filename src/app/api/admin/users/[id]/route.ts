/**
 * Admin User Management API
 * 
 * Get, update, or delete specific user (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  accountStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'DELETED']).optional(),
  isSuperAdmin: z.boolean().optional(),
});

/**
 * GET /api/admin/users/[id]
 * Get user details
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        storeStaff: {
          where: { isActive: true },
          include: {
            store: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        memberships: {
          include: {
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: {
          select: {
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
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

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Prevent modifying own super admin status
    if (data.isSuperAdmin !== undefined && session.user.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own super admin status' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...data,
        statusChangedAt: data.accountStatus ? new Date() : undefined,
        statusChangedBy: data.accountStatus ? session.user.id : undefined,
      },
    });

    // Log activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: params.id,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: params.id,
        description: `Updated user ${updatedUser.name || updatedUser.email}`,
        metadata: JSON.stringify(data),
      },
    });

    return NextResponse.json({ user: updatedUser, message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
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

    // Prevent self-deletion
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get user info before deletion
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { name: true, email: true, isSuperAdmin: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting other super admins
    if (user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete a super admin account' },
        { status: 400 }
      );
    }

    // Soft delete - set status to DELETED
    await prisma.user.update({
      where: { id: params.id },
      data: {
        accountStatus: 'DELETED',
        statusChangedAt: new Date(),
        statusChangedBy: session.user.id,
      },
    });

    // Log activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: params.id,
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: params.id,
        description: `Deleted user ${user.name || user.email}`,
      },
    });

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
