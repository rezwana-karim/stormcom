/**
 * Approve Store Request API
 * 
 * Super Admin endpoint to approve a store request and create the store.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { sendStoreCreatedEmail } from '@/lib/email-service';

const approveSchema = z.object({
  subscriptionPlan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).default('FREE'),
  customSlug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  adminNote: z.string().max(500).optional(),
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
            accountStatus: true,
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
    const body = await request.json().catch(() => ({}));
    const validation = approveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const slug = data.customSlug || storeRequest.storeSlug || storeRequest.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Check if slug is available
    const existingStore = await prisma.store.findUnique({
      where: { slug },
    });

    if (existingStore) {
      return NextResponse.json(
        { error: 'Store slug is already taken. Please provide a custom slug.' },
        { status: 400 }
      );
    }

    // Create organization and store in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: storeRequest.storeName,
          slug: slug,
        },
      });

      // Create membership (user as OWNER)
      await tx.membership.create({
        data: {
          userId: storeRequest.userId,
          organizationId: organization.id,
          role: 'OWNER',
        },
      });

      // Create store
      const store = await tx.store.create({
        data: {
          organizationId: organization.id,
          name: storeRequest.storeName,
          slug: slug,
          description: storeRequest.storeDescription,
          email: storeRequest.businessEmail || storeRequest.user.email || '',
          phone: storeRequest.businessPhone,
          address: storeRequest.businessAddress,
          subscriptionPlan: data.subscriptionPlan,
          subscriptionStatus: 'ACTIVE',
        },
      });

      // Add user as store admin
      await tx.storeStaff.create({
        data: {
          userId: storeRequest.userId,
          storeId: store.id,
          role: 'STORE_ADMIN',
          isActive: true,
        },
      });

      // Update store request
      await tx.storeRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          createdStoreId: store.id,
        },
      });

      return { organization, store };
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: storeRequest.userId,
        type: 'STORE_REQUEST_APPROVED',
        title: 'Store Request Approved! 🎉',
        message: `Your request for "${storeRequest.storeName}" has been approved! Your store is now ready.`,
        actionUrl: `/dashboard`,
        actionLabel: 'Go to Dashboard',
      },
    });

    // Log platform activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: storeRequest.userId,
        storeId: result.store.id,
        action: 'STORE_REQUEST_APPROVED',
        entityType: 'StoreRequest',
        entityId: id,
        description: `Approved store request for "${storeRequest.storeName}" by ${storeRequest.user.name || storeRequest.user.email}`,
      },
    });

    // Send store created email (async)
    if (storeRequest.user.email) {
      sendStoreCreatedEmail(
        storeRequest.user.email,
        storeRequest.user.name || 'User',
        storeRequest.storeName,
        slug
      ).catch((err) => console.error('Failed to send store created email:', err));
    }

    return NextResponse.json({
      store: {
        id: result.store.id,
        name: result.store.name,
        slug: result.store.slug,
        organizationId: result.organization.id,
      },
      message: 'Store request approved and store created successfully',
    });
  } catch (error) {
    console.error('Approve store request error:', error);
    return NextResponse.json(
      { error: 'Failed to approve store request' },
      { status: 500 }
    );
  }
}
