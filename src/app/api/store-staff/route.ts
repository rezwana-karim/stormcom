// src/app/api/store-staff/route.ts
// Store Staff API Routes - Manage store-level role assignments

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { requirePermission, checkAnyPermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';

const CreateStoreStaffSchema = z.object({
  userId: z.string().cuid('Invalid user ID format'),
  storeId: z.string().cuid('Invalid store ID format'),
  role: z.nativeEnum(Role),
});

// GET /api/store-staff - List store staff
export async function GET(request: NextRequest) {
  try {
    // Require store:read or staff:read permission
    const hasPermission = await checkAnyPermission(['store:read', 'staff:read']);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to view store staff.' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this store
    const userMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: {
          store: {
            id: storeId,
          },
        },
      },
    });

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Access denied. You do not have access to this store.' },
        { status: 403 }
      );
    }

    const staff = await prisma.storeStaff.findMany({
      where: { storeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('GET /api/store-staff error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store staff' },
      { status: 500 }
    );
  }
}

// POST /api/store-staff - Assign user to store with role
export async function POST(request: NextRequest) {
  try {
    // Require staff:create permission (STORE_ADMIN, OWNER, ADMIN, SUPER_ADMIN)
    await requirePermission('staff:create');

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = CreateStoreStaffSchema.parse(body);

    // Verify the creator has access to this store
    const creatorMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: {
          store: {
            id: validatedData.storeId,
          },
        },
      },
    });

    if (!creatorMembership) {
      return NextResponse.json(
        { error: 'Access denied. You do not have access to this store.' },
        { status: 403 }
      );
    }

    // Check if assignment already exists
    const existing = await prisma.storeStaff.findUnique({
      where: {
        userId_storeId: {
          userId: validatedData.userId,
          storeId: validatedData.storeId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User is already assigned to this store' },
        { status: 409 }
      );
    }

    // Create staff assignment
    const storeStaff = await prisma.storeStaff.create({
      data: {
        userId: validatedData.userId,
        storeId: validatedData.storeId,
        role: validatedData.role,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(storeStaff, { status: 201 });
  } catch (error) {
    console.error('POST /api/store-staff error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create store staff assignment' },
      { status: 500 }
    );
  }
}
