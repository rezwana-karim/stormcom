// src/app/api/store-staff/[id]/route.ts
// Store Staff Detail API Routes - Update, Delete

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { requirePermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { AuditLogService } from '@/lib/services/audit-log.service';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const UpdateStoreStaffSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/store-staff/[id] - Get staff assignment by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requirePermission('staff:read');

    const session = await getServerSession(authOptions);
    const params = await context.params;
    
    const storeStaff = await prisma.storeStaff.findUnique({
      where: { id: params.id },
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
            organizationId: true,
          },
        },
      },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: 'Store staff assignment not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this store's organization
    const userMembership = await prisma.membership.findFirst({
      where: {
        userId: session?.user?.id,
        organizationId: storeStaff.store.organizationId,
      },
    });

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Access denied. You do not have access to this store.' },
        { status: 403 }
      );
    }

    return NextResponse.json(storeStaff);
  } catch (error) {
    console.error('GET /api/store-staff/[id] error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch store staff' },
      { status: 500 }
    );
  }
}

// PATCH /api/store-staff/[id] - Update staff assignment
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requirePermission('staff:update');

    const session = await getServerSession(authOptions);
    const params = await context.params;
    const body = await request.json();
    const validatedData = UpdateStoreStaffSchema.parse(body);

    // Get old data for audit log
    const oldData = await prisma.storeStaff.findUnique({
      where: { id: params.id },
    });

    const storeStaff = await prisma.storeStaff.update({
      where: { id: params.id },
      data: validatedData,
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

    // Log the change
    if (session?.user?.id && oldData) {
      const auditService = AuditLogService.getInstance();
      const changes: Record<string, { old: string | boolean | null; new: string | boolean | null }> = {};
      if (oldData.role !== storeStaff.role) {
        changes.role = { old: oldData.role, new: storeStaff.role };
      }
      if (oldData.isActive !== storeStaff.isActive) {
        changes.isActive = { old: oldData.isActive, new: storeStaff.isActive };
      }
      
      await auditService.create(
        'UPDATE',
        'StoreStaff',
        storeStaff.id,
        {
          userId: session.user.id,
          storeId: storeStaff.storeId,
          changes,
          metadata: {
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
          },
        }
      );
    }

    return NextResponse.json(storeStaff);
  } catch (error) {
    console.error('PATCH /api/store-staff/[id] error:', error);
    
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
      { error: 'Failed to update store staff' },
      { status: 500 }
    );
  }
}

// DELETE /api/store-staff/[id] - Remove staff assignment
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requirePermission('staff:delete');

    const session = await getServerSession(authOptions);
    const params = await context.params;
    
    // Get staff data before deletion for audit log
    const staffData = await prisma.storeStaff.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
    
    await prisma.storeStaff.delete({
      where: { id: params.id },
    });

    // Log the deletion
    if (session?.user?.id && staffData) {
      const auditService = AuditLogService.getInstance();
      await auditService.create(
        'DELETE',
        'StoreStaff',
        params.id,
        {
          userId: session.user.id,
          storeId: staffData.storeId,
          changes: {
            deletedUser: {
              old: {
                userId: staffData.userId,
                role: staffData.role,
                userEmail: staffData.user.email,
                userName: staffData.user.name,
              },
              new: null,
            },
          },
          metadata: {
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
          },
        }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Store staff assignment removed successfully',
    });
  } catch (error) {
    console.error('DELETE /api/store-staff/[id] error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete store staff' },
      { status: 500 }
    );
  }
}
