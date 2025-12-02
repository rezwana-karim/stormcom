/**
 * Store Staff Management API
 * 
 * GET /api/stores/[id]/staff - List store staff
 * POST /api/stores/[id]/staff - Invite new staff member
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ROLE_PERMISSIONS } from '@/lib/permissions';
import { sendStaffInvitationEmail } from '@/lib/email-service';
import { PREDEFINED_STORE_ROLES } from '@/lib/constants';

const inviteStaffSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['STORE_ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'CUSTOMER_SERVICE', 'CONTENT_MANAGER', 'MARKETING_MANAGER', 'DELIVERY_BOY']).optional(),
  customRoleId: z.string().cuid().optional(),
}).refine(
  data => data.role || data.customRoleId,
  { message: 'Either role or customRoleId must be provided' }
).refine(
  data => !(data.role && data.customRoleId),
  { message: 'Cannot specify both role and customRoleId' }
);

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Check if user has access to a store
 */
async function checkStoreAccess(userId: string, storeId: string): Promise<{ hasAccess: boolean; isOwner: boolean; isAdmin: boolean }> {
  // Check if user is owner through org membership
  const ownerMembership = await prisma.membership.findFirst({
    where: {
      userId,
      role: 'OWNER',
      organization: {
        store: { id: storeId }
      }
    },
  });
  
  if (ownerMembership) {
    return { hasAccess: true, isOwner: true, isAdmin: true };
  }
  
  // Check if user is staff
  const staffMember = await prisma.storeStaff.findFirst({
    where: {
      userId,
      storeId,
      isActive: true,
    },
  });
  
  if (staffMember) {
    const isAdmin = staffMember.role === 'STORE_ADMIN';
    return { hasAccess: true, isOwner: false, isAdmin };
  }
  
  // Check org membership
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      organization: {
        store: { id: storeId }
      }
    },
  });
  
  if (membership) {
    return { hasAccess: true, isOwner: false, isAdmin: membership.role === 'ADMIN' };
  }
  
  return { hasAccess: false, isOwner: false, isAdmin: false };
}

/**
 * GET /api/stores/[id]/staff
 * List store staff members
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id: storeId } = await context.params;
    
    // Verify user has access to this store
    const access = await checkStoreAccess(session.user.id, storeId);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: 'Store not found or access denied' },
        { status: 404 }
      );
    }
    
    // Get store info
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { 
        id: true, 
        name: true,
        organization: {
          select: {
            memberships: {
              where: { role: 'OWNER' },
              select: {
                user: {
                  select: { id: true, name: true, email: true, image: true }
                }
              },
              take: 1
            }
          }
        }
      },
    });
    
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const roleFilter = searchParams.get('role');
    
    // Build where clause
    const where: Record<string, unknown> = { storeId };
    
    if (status === 'active') {
      where.isActive = true;
      where.acceptedAt = { not: null };
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'pending') {
      where.isActive = true;
      where.acceptedAt = null;
    }
    
    if (roleFilter) {
      if (PREDEFINED_STORE_ROLES.includes(roleFilter as typeof PREDEFINED_STORE_ROLES[number])) {
        where.role = roleFilter;
      }
    }
    
    // Get staff members
    const staff = await prisma.storeStaff.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
        customRole: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true,
            isActive: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    
    // Format response with permissions
    const formattedStaff = staff.map(member => {
      let permissions: string[] = [];
      let roleName = 'Unknown';
      
      if (member.customRole) {
        try {
          permissions = JSON.parse(member.customRole.permissions);
        } catch {
          permissions = [];
        }
        roleName = member.customRole.name;
      } else if (member.role) {
        permissions = ROLE_PERMISSIONS[member.role] || [];
        roleName = member.role;
      }
      
      return {
        id: member.id,
        user: member.user,
        role: member.role,
        customRole: member.customRole ? {
          id: member.customRole.id,
          name: member.customRole.name,
          description: member.customRole.description,
          isActive: member.customRole.isActive,
        } : null,
        roleName,
        permissions,
        isActive: member.isActive,
        isPending: member.isActive && !member.acceptedAt,
        invitedAt: member.invitedAt,
        acceptedAt: member.acceptedAt,
        invitedBy: member.invitedBy,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      };
    });
    
    // Get counts
    const counts = {
      total: staff.length,
      active: staff.filter(s => s.isActive && s.acceptedAt).length,
      pending: staff.filter(s => s.isActive && !s.acceptedAt).length,
      inactive: staff.filter(s => !s.isActive).length,
    };
    
    // Get owner info
    const owner = store.organization.memberships[0]?.user || null;
    
    return NextResponse.json({
      staff: formattedStaff,
      counts,
      storeId,
      isOwner: access.isOwner,
      owner,
    });
    
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json(
      { error: 'Failed to get staff' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stores/[id]/staff
 * Invite a new staff member
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id: storeId } = await context.params;
    
    // Verify user is store owner or admin
    const access = await checkStoreAccess(session.user.id, storeId);
    if (!access.hasAccess || (!access.isOwner && !access.isAdmin)) {
      return NextResponse.json(
        { error: 'Store not found or insufficient permissions' },
        { status: 404 }
      );
    }
    
    // Get store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true },
    });
    
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const validation = inviteStaffSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { email, role, customRoleId } = validation.data;
    
    // Find the user by email
    const invitedUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, accountStatus: true },
    });
    
    if (!invitedUser) {
      return NextResponse.json(
        { error: 'User not found. They must have an account first.' },
        { status: 404 }
      );
    }
    
    // Check user's account status
    if (invitedUser.accountStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'User account is not approved' },
        { status: 400 }
      );
    }
    
    // Check if already a staff member
    const existingStaff = await prisma.storeStaff.findUnique({
      where: {
        userId_storeId: {
          userId: invitedUser.id,
          storeId,
        },
      },
    });
    
    if (existingStaff) {
      if (existingStaff.isActive) {
        return NextResponse.json(
          { error: 'User is already a staff member of this store' },
          { status: 400 }
        );
      } else {
        // Reactivate existing staff
        const updatedStaff = await prisma.storeStaff.update({
          where: { id: existingStaff.id },
          data: {
            isActive: true,
            role: role || null,
            customRoleId: customRoleId || null,
            invitedBy: session.user.id,
            invitedAt: new Date(),
            acceptedAt: null,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        });
        
        // Notify user
        await prisma.notification.create({
          data: {
            userId: invitedUser.id,
            type: 'STAFF_INVITED',
            title: 'Staff Invitation',
            message: `You have been re-invited to join "${store.name}" as staff.`,
            actionUrl: `/dashboard/stores/${storeId}/accept-invite`,
            actionLabel: 'Accept Invitation',
          },
        });
        
        return NextResponse.json({
          success: true,
          message: 'Staff member re-invited',
          staff: updatedStaff,
        });
      }
    }
    
    // If using custom role, verify it exists and belongs to this store
    if (customRoleId) {
      const customRole = await prisma.customRole.findFirst({
        where: {
          id: customRoleId,
          storeId,
          isActive: true,
        },
      });
      
      if (!customRole) {
        return NextResponse.json(
          { error: 'Custom role not found or inactive' },
          { status: 404 }
        );
      }
    }
    
    // Create staff invitation
    const newStaff = await prisma.storeStaff.create({
      data: {
        userId: invitedUser.id,
        storeId,
        role: role || null,
        customRoleId: customRoleId || null,
        invitedBy: session.user.id,
        invitedAt: new Date(),
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        customRole: {
          select: { id: true, name: true },
        },
      },
    });
    
    // Notify user
    const roleName = customRoleId 
      ? newStaff.customRole?.name 
      : role;
    
    await prisma.notification.create({
      data: {
        userId: invitedUser.id,
        type: 'STAFF_INVITED',
        title: 'Staff Invitation',
        message: `You have been invited to join "${store.name}" as ${roleName || 'staff'}.`,
        actionUrl: `/dashboard/stores/${storeId}/accept-invite`,
        actionLabel: 'Accept Invitation',
      },
    });
    
    // Log activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        targetUserId: invitedUser.id,
        storeId,
        action: 'STAFF_INVITED',
        entityType: 'StoreStaff',
        entityId: newStaff.id,
        description: `Invited ${invitedUser.name || invitedUser.email} as ${roleName || 'staff'} to "${store.name}"`,
      },
    });
    
    // Get inviter name for email
    const inviter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });
    
    // Send invitation email (non-blocking)
    sendStaffInvitationEmail(
      invitedUser.email!,
      invitedUser.name || 'Team Member',
      store.name,
      roleName || 'Staff',
      inviter?.name || inviter?.email || 'Store Manager'
    ).catch(err => console.error('Failed to send staff invitation email:', err));
    
    return NextResponse.json({
      success: true,
      message: 'Staff invitation sent',
      staff: {
        id: newStaff.id,
        user: newStaff.user,
        role: newStaff.role,
        customRole: newStaff.customRole,
        isPending: true,
        invitedAt: newStaff.invitedAt,
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('Invite staff error:', error);
    return NextResponse.json(
      { error: 'Failed to invite staff' },
      { status: 500 }
    );
  }
}
