/**
 * Store Requests API
 * 
 * Allows approved users to request a store creation.
 * Requests are reviewed by Super Admin before stores are created.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createStoreRequestSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters').max(100),
  storeSlug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  storeDescription: z.string().max(500).optional(),
  businessName: z.string().max(200).optional(),
  businessCategory: z.string().max(100).optional(),
  businessAddress: z.string().max(300).optional(),
  businessPhone: z.string().max(20).optional(),
  businessEmail: z.string().email('Invalid email address').optional(),
});

/**
 * GET /api/store-requests
 * Get current user's store requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeRequests = await prisma.storeRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        createdStore: {
          select: { id: true, name: true, slug: true },
        },
        reviewer: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ data: storeRequests });
  } catch (error) {
    console.error('Get store requests error:', error);
    return NextResponse.json(
      { error: 'Failed to get store requests' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/store-requests
 * Create a new store request (approved users only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is approved
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        accountStatus: true,
        businessName: true,
        businessCategory: true,
        phoneNumber: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.accountStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Your account must be approved before requesting a store' },
        { status: 403 }
      );
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.storeRequest.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending store request' },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = createStoreRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate slug if not provided
    const slug = data.storeSlug || data.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check if slug is available
    const existingStore = await prisma.store.findUnique({
      where: { slug },
    });

    const existingSlugRequest = await prisma.storeRequest.findFirst({
      where: { storeSlug: slug, status: 'PENDING' },
    });

    if (existingStore || existingSlugRequest) {
      return NextResponse.json(
        { error: 'Store slug is already taken or pending. Please choose a different name.' },
        { status: 400 }
      );
    }

    // Create store request
    const storeRequest = await prisma.storeRequest.create({
      data: {
        userId: session.user.id,
        storeName: data.storeName,
        storeSlug: slug,
        storeDescription: data.storeDescription,
        businessName: data.businessName || user.businessName,
        businessCategory: data.businessCategory || user.businessCategory,
        businessAddress: data.businessAddress,
        businessPhone: data.businessPhone || user.phoneNumber,
        businessEmail: data.businessEmail || user.email,
        status: 'PENDING',
      },
    });

    // Log platform activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        action: 'STORE_REQUEST_CREATED',
        entityType: 'StoreRequest',
        entityId: storeRequest.id,
        description: `Requested store "${data.storeName}"`,
      },
    });

    // Create notification for all super admins
    const superAdmins = await prisma.user.findMany({
      where: { isSuperAdmin: true },
      select: { id: true },
    });

    if (superAdmins.length > 0) {
      await prisma.notification.createMany({
        data: superAdmins.map(admin => ({
          userId: admin.id,
          type: 'STORE_REQUEST_PENDING',
          title: 'New Store Request',
          message: `${user.name || user.email} has requested to create store "${data.storeName}"`,
          actionUrl: '/admin/stores/requests',
          actionLabel: 'Review Request',
        })),
      });
    }

    return NextResponse.json({
      data: storeRequest,
      message: 'Store request submitted successfully. You will be notified once it is reviewed.',
    }, { status: 201 });
  } catch (error) {
    console.error('Create store request error:', error);
    return NextResponse.json(
      { error: 'Failed to create store request' },
      { status: 500 }
    );
  }
}
