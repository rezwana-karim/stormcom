/**
 * Reject Store Request API
 * 
 * Super Admin endpoint to reject a store request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason (at least 10 characters)').max(500),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Super Admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true, name: true },
    });

    if (!currentUser?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get the store request
    const storeRequest = await prisma.storeRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!storeRequest) {
      return NextResponse.json({ error: 'Store request not found' }, { status: 404 });
    }

    if (storeRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Request has already been ${storeRequest.status.toLowerCase()}` },
        { status: 400 }
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

    // Update store request
    const updatedRequest = await prisma.storeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: storeRequest.userId,
        type: 'STORE_REQUEST_REJECTED',
        title: 'Store Request Not Approved',
        message: `Your request for "${storeRequest.storeName}" was not approved. Reason: ${reason}`,
        actionUrl: '/dashboard/store-request',
        actionLabel: 'Submit New Request',
      },
    });

    // Log platform activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: storeRequest.userId,
        action: 'STORE_REQUEST_REJECTED',
        entityType: 'StoreRequest',
        entityId: id,
        description: `Rejected store request for "${storeRequest.storeName}" by ${storeRequest.user.name || storeRequest.user.email}. Reason: ${reason}`,
      },
    });

    return NextResponse.json({
      data: updatedRequest,
      message: 'Store request rejected',
    });
  } catch (error) {
    console.error('Reject store request error:', error);
    return NextResponse.json(
      { error: 'Failed to reject store request' },
      { status: 500 }
    );
  }
}
