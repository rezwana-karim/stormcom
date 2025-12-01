/**
 * Super Admin - Store Custom Role Details and Limit Management
 * 
 * GET /api/admin/custom-roles/stores/[storeId] - Get store role details
 * PATCH /api/admin/custom-roles/stores/[storeId] - Update store role limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CustomRoleAction } from '@prisma/client';

interface RouteContext {
  params: Promise<{ storeId: string }>;
}

/**
 * Log custom role activity
 */
async function logCustomRoleActivity(params: {
  action: CustomRoleAction;
  actorId: string;
  storeId: string;
  customRoleId?: string;
  roleName: string;
  details?: Record<string, unknown>;
  previousValue?: string;
  newValue?: string;
}) {
  await prisma.customRoleActivity.create({
    data: {
      action: params.action,
      actorId: params.actorId,
      storeId: params.storeId,
      customRoleId: params.customRoleId,
      roleName: params.roleName,
      details: params.details ? JSON.stringify(params.details) : null,
      previousValue: params.previousValue,
      newValue: params.newValue,
    },
  });
}

/**
 * GET /api/admin/custom-roles/stores/[storeId]
 * Get detailed custom role information for a specific store
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
    
    // Check if user is Super Admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });
    
    if (!user?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super Admin access required' },
        { status: 403 }
      );
    }
    
    const { storeId } = await context.params;
    
    // Get store with all details
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        customRoleLimit: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            memberships: {
              where: { role: 'OWNER' },
              select: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
              take: 1,
            },
          },
        },
        customRoles: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdByUser: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { staffAssignments: true },
            },
          },
        },
        _count: {
          select: { staff: true },
        },
      },
    });
    
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Get recent activity for this store
    const activityLog = await prisma.customRoleActivity.findMany({
      where: { storeId },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    
    // Get platform settings for max limit
    const platformSettings = await prisma.platformSettings.findUnique({
      where: { id: 'global' },
      select: { maxCustomRoleLimit: true },
    });
    
    const owner = store.organization.memberships[0]?.user;
    
    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        email: store.email,
        phone: store.phone,
        customRoleLimit: store.customRoleLimit,
        maxAllowedLimit: platformSettings?.maxCustomRoleLimit || 20,
        subscriptionPlan: store.subscriptionPlan,
        subscriptionStatus: store.subscriptionStatus,
        staffCount: store._count.staff,
        createdAt: store.createdAt,
        owner: owner ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
        } : null,
        organization: {
          id: store.organization.id,
          name: store.organization.name,
        },
      },
      customRoles: store.customRoles.map(role => {
        let permissions: string[] = [];
        try {
          permissions = JSON.parse(role.permissions);
        } catch {
          permissions = [];
        }
        
        return {
          id: role.id,
          name: role.name,
          description: role.description,
          permissions,
          isActive: role.isActive,
          staffCount: role._count.staffAssignments,
          createdBy: role.createdByUser,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        };
      }),
      roleStats: {
        total: store.customRoles.length,
        active: store.customRoles.filter(r => r.isActive).length,
        inactive: store.customRoles.filter(r => !r.isActive).length,
        limit: store.customRoleLimit,
        remaining: Math.max(0, store.customRoleLimit - store.customRoles.length),
      },
      activityLog: activityLog.map(activity => ({
        id: activity.id,
        action: activity.action,
        roleName: activity.roleName,
        actor: activity.actor,
        details: activity.details ? JSON.parse(activity.details) : null,
        previousValue: activity.previousValue,
        newValue: activity.newValue,
        createdAt: activity.createdAt,
      })),
    });
    
  } catch (error) {
    console.error('Get store custom roles error:', error);
    return NextResponse.json(
      { error: 'Failed to get store details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/custom-roles/stores/[storeId]
 * Update store's custom role limit
 */
export async function PATCH(
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
    
    // Check if user is Super Admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });
    
    if (!user?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super Admin access required' },
        { status: 403 }
      );
    }
    
    const { storeId } = await context.params;
    
    // Get store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        customRoleLimit: true,
        _count: {
          select: { customRoles: true },
        },
      },
    });
    
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { limit, reason } = body;
    
    if (typeof limit !== 'number' || limit < 0) {
      return NextResponse.json(
        { error: 'Invalid limit value' },
        { status: 400 }
      );
    }
    
    // Check against platform maximum
    const platformSettings = await prisma.platformSettings.findUnique({
      where: { id: 'global' },
      select: { maxCustomRoleLimit: true },
    });
    
    const maxAllowed = platformSettings?.maxCustomRoleLimit || 20;
    
    if (limit > maxAllowed) {
      return NextResponse.json(
        { 
          error: 'Limit exceeds platform maximum',
          message: `The maximum allowed custom role limit is ${maxAllowed}.`,
          maxAllowed,
        },
        { status: 400 }
      );
    }
    
    // Check if new limit is below current usage
    if (limit < store._count.customRoles) {
      return NextResponse.json(
        { 
          error: 'Limit below current usage',
          message: `Cannot set limit to ${limit}. Store currently has ${store._count.customRoles} custom roles. Please delete some roles first.`,
          currentUsage: store._count.customRoles,
        },
        { status: 400 }
      );
    }
    
    const previousLimit = store.customRoleLimit;
    
    // Update limit
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { customRoleLimit: limit },
      select: {
        id: true,
        name: true,
        customRoleLimit: true,
      },
    });
    
    // Log activity
    await logCustomRoleActivity({
      action: CustomRoleAction.LIMIT_CHANGED,
      actorId: session.user.id,
      storeId,
      roleName: 'N/A',
      details: {
        previousLimit,
        newLimit: limit,
        reason: reason || null,
        changedBy: 'Super Admin',
      },
      previousValue: String(previousLimit),
      newValue: String(limit),
    });
    
    return NextResponse.json({
      success: true,
      store: {
        id: updatedStore.id,
        name: updatedStore.name,
        previousLimit,
        newLimit: updatedStore.customRoleLimit,
      },
      message: 'Custom role limit updated successfully',
    });
    
  } catch (error) {
    console.error('Update store role limit error:', error);
    return NextResponse.json(
      { error: 'Failed to update limit' },
      { status: 500 }
    );
  }
}
