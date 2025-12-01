/**
 * Super Admin Custom Roles Dashboard API
 * 
 * GET /api/admin/custom-roles/dashboard - Get overview statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/custom-roles/dashboard
 * Get custom roles dashboard overview for Super Admin
 */
export async function GET(request: NextRequest) {
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
    
    // Get summary statistics
    const [
      totalCustomRoles,
      activeRoles,
      totalStoresWithRoles,
      storesAtLimit,
    ] = await Promise.all([
      prisma.customRole.count(),
      prisma.customRole.count({ where: { isActive: true } }),
      prisma.store.count({
        where: {
          customRoles: {
            some: {},
          },
        },
      }),
      // Stores at or over limit
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM (
          SELECT s.id 
          FROM "Store" s 
          LEFT JOIN "custom_roles" cr ON cr."storeId" = s.id
          GROUP BY s.id, s."customRoleLimit"
          HAVING COUNT(cr.id) >= s."customRoleLimit"
        ) as over_limit
      `.then(result => Number(result[0]?.count || 0)),
    ]);
    
    // Get top stores by role count
    const topStores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        customRoleLimit: true,
        subscriptionPlan: true,
        _count: {
          select: { customRoles: true },
        },
      },
      orderBy: {
        customRoles: {
          _count: 'desc',
        },
      },
      take: 10,
    });
    
    // Get most commonly used permissions
    const allRoles = await prisma.customRole.findMany({
      select: { permissions: true },
    });
    
    const permissionCounts: Record<string, number> = {};
    for (const role of allRoles) {
      try {
        const perms = JSON.parse(role.permissions);
        for (const perm of perms) {
          permissionCounts[perm] = (permissionCounts[perm] || 0) + 1;
        }
      } catch {
        // Skip invalid JSON
      }
    }
    
    const topPermissions = Object.entries(permissionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([permission, usage]) => ({
        permission,
        usage,
        percentage: totalCustomRoles > 0 
          ? Math.round((usage / totalCustomRoles) * 100) 
          : 0,
      }));
    
    // Get recent activity
    const recentActivity = await prisma.customRoleActivity.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
        store: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
    
    return NextResponse.json({
      summary: {
        totalCustomRoles,
        activeRoles,
        inactiveRoles: totalCustomRoles - activeRoles,
        storesWithRoles: totalStoresWithRoles,
        storesAtLimit,
      },
      topStores: topStores.map(store => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        roleCount: store._count.customRoles,
        limit: store.customRoleLimit,
        plan: store.subscriptionPlan,
        isAtLimit: store._count.customRoles >= store.customRoleLimit,
      })),
      topPermissions,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.action,
        roleName: activity.roleName,
        actor: activity.actor,
        store: activity.store,
        createdAt: activity.createdAt,
      })),
    });
    
  } catch (error) {
    console.error('Get custom roles dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard data' },
      { status: 500 }
    );
  }
}
