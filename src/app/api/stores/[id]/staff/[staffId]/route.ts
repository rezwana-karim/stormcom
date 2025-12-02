/**
 * Store Staff Member Detail API
 * 
 * GET /api/stores/[id]/staff/[staffId] - Get staff member details
 * PATCH /api/stores/[id]/staff/[staffId] - Update staff member role
 * DELETE /api/stores/[id]/staff/[staffId] - Remove staff member
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ROLE_PERMISSIONS } from '@/lib/permissions';

const updateStaffSchema = z.object({
  role: z.enum(['STORE_ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'CUSTOMER_SERVICE', 'CONTENT_MANAGER', 'MARKETING_MANAGER', 'DELIVERY_BOY']).optional(),
  customRoleId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string; staffId: string }>;
}

/**
 * Check store access
 */
async function checkStoreAccess(userId: string, storeId: string): Promise<{ hasAccess: boolean; isOwner: boolean; isAdmin: boolean }> {
  const ownerMembership = await prisma.membership.findFirst({
    where: {
      userId,
      role: 'OWNER',
      organization: { store: { id: storeId } }
    },
  });
  
  if (ownerMembership) return { hasAccess: true, isOwner: true, isAdmin: true };
  
  const staffMember = await prisma.storeStaff.findFirst({
    where: { userId, storeId, isActive: true },
  });
  
  if (staffMember) {
    return { hasAccess: true, isOwner: false, isAdmin: staffMember.role === 'STORE_ADMIN' };
  }
  
  const membership = await prisma.membership.findFirst({
    where: { userId, organization: { store: { id: storeId } } },
  });
  
  if (membership) {
    return { hasAccess: true, isOwner: false, isAdmin: membership.role === 'ADMIN' };
  }
  
  return { hasAccess: false, isOwner: false, isAdmin: false };
}

/**
 * GET /api/stores/[id]/staff/[staffId]
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: storeId, staffId } = await context.params;
    
    const access = await checkStoreAccess(session.user.id, storeId);
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }
    
    const staff = await prisma.storeStaff.findFirst({
      where: { id: staffId, storeId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, createdAt: true },
        },
        customRole: {
          select: { id: true, name: true, description: true, permissions: true, isActive: true },
        },
      },
    });
    
    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }
    
    let permissions: string[] = [];
    let roleName = 'Unknown';
    
    if (staff.customRole) {
      try {
        permissions = JSON.parse(staff.customRole.permissions);
      } catch {
        permissions = [];
      }
      roleName = staff.customRole.name;
    } else if (staff.role) {
      permissions = ROLE_PERMISSIONS[staff.role] || [];
      roleName = staff.role;
    }
    
    return NextResponse.json({
      staff: {
        ...staff,
        roleName,
        permissions,
        isPending: staff.isActive && !staff.acceptedAt,
      },
    });
    
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json({ error: 'Failed to get staff member' }, { status: 500 });
  }
}

/**
 * PATCH /api/stores/[id]/staff/[staffId]
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: storeId, staffId } = await context.params;
    
    const access = await checkStoreAccess(session.user.id, storeId);
    if (!access.hasAccess || (!access.isOwner && !access.isAdmin)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const existingStaff = await prisma.storeStaff.findFirst({
      where: { id: staffId, storeId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    
    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const validation = updateStaffSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation error', details: validation.error.issues }, { status: 400 });
    }
    
    const { role, customRoleId, isActive } = validation.data;
    
    // If using custom role, verify it exists
    if (customRoleId) {
      const customRole = await prisma.customRole.findFirst({
        where: { id: customRoleId, storeId, isActive: true },
      });
      
      if (!customRole) {
        return NextResponse.json({ error: 'Custom role not found or inactive' }, { status: 404 });
      }
    }
    
    const updatedStaff = await prisma.storeStaff.update({
      where: { id: staffId },
      data: {
        ...(role !== undefined && { role, customRoleId: null }),
        ...(customRoleId !== undefined && { customRoleId, role: null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        customRole: { select: { id: true, name: true } },
      },
    });
    
    // Notify staff member of role change
    const roleName = customRoleId
      ? updatedStaff.customRole?.name
      : role?.replace('_', ' ');
    
    if (role !== undefined || customRoleId !== undefined) {
      await prisma.notification.create({
        data: {
          userId: existingStaff.user.id,
          type: 'STAFF_ROLE_CHANGED',
          title: 'Role Updated',
          message: `Your role has been updated to ${roleName || 'staff'}.`,
        },
      });
    }
    
    if (isActive === false) {
      await prisma.notification.create({
        data: {
          userId: existingStaff.user.id,
          type: 'STAFF_INVITED', // Using existing type
          title: 'Account Deactivated',
          message: 'Your staff account has been deactivated.',
        },
      });
    }
    
    // Log activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: existingStaff.user.id,
        storeId,
        action: 'STAFF_UPDATED',
        entityType: 'StoreStaff',
        entityId: staffId,
        description: `Updated staff member ${existingStaff.user.name || existingStaff.user.email}`,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Staff member updated',
      staff: updatedStaff,
    });
    
  } catch (error) {
    console.error('Update staff error:', error);
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}

/**
 * DELETE /api/stores/[id]/staff/[staffId]
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: storeId, staffId } = await context.params;
    
    const access = await checkStoreAccess(session.user.id, storeId);
    if (!access.hasAccess || (!access.isOwner && !access.isAdmin)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const existingStaff = await prisma.storeStaff.findFirst({
      where: { id: staffId, storeId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        store: { select: { name: true } },
      },
    });
    
    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }
    
    // Delete the staff record
    await prisma.storeStaff.delete({
      where: { id: staffId },
    });
    
    // Notify user
    await prisma.notification.create({
      data: {
        userId: existingStaff.user.id,
        type: 'STAFF_INVITED', // Using existing type
        title: 'Removed from Store',
        message: `You have been removed from "${existingStaff.store.name}".`,
      },
    });
    
    // Log activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: existingStaff.user.id,
        storeId,
        action: 'STAFF_REMOVED',
        entityType: 'StoreStaff',
        entityId: staffId,
        description: `Removed ${existingStaff.user.name || existingStaff.user.email} from "${existingStaff.store.name}"`,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Staff member removed',
    });
    
  } catch (error) {
    console.error('Remove staff error:', error);
    return NextResponse.json({ error: 'Failed to remove staff member' }, { status: 500 });
  }
}
