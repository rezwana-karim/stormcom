/**
 * GDPR Data Deletion API
 * 
 * POST /api/gdpr/delete - Request account deletion (GDPR right to be forgotten)
 * 
 * @module api/gdpr/delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const deleteRequestSchema = z.object({
  userId: z.string().optional(),
  reason: z.string().optional(),
  confirmEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = deleteRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { userId, reason, confirmEmail } = validation.data;
    const targetUserId = userId || session.user.id;

    // Verify user has permission to delete account
    if (targetUserId !== session.user.id) {
      // In production, check if user is admin
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify email matches
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user || user.email !== confirmEmail) {
      return NextResponse.json(
        { error: 'Email confirmation does not match' },
        { status: 400 }
      );
    }

    // Log deletion request (in production, queue for processing)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_REQUEST',
        entityType: 'User',
        entityId: targetUserId,
        changes: JSON.stringify({
          reason,
          requestedAt: new Date().toISOString(),
        }),
      },
    });

    // In production: Queue account deletion (with grace period)
    // For now, return confirmation
    return NextResponse.json({
      message: 'Account deletion request submitted',
      data: {
        requestId: `del_${Date.now()}`,
        userId: targetUserId,
        status: 'pending',
        scheduledDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        cancellationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      },
    });
  } catch (error) {
    console.error('GDPR delete error:', error);
    return NextResponse.json(
      { error: 'Failed to process deletion request' },
      { status: 500 }
    );
  }
}
