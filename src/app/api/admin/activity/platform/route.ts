/**
 * Admin Platform Activity API
 * 
 * View platform-wide activity feed specifically for user/store management (Super Admin only).
 * This tracks user approvals, store creations, suspensions, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/activity/platform
 * List platform activities with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Super Admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    if (!currentUser?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const actorId = searchParams.get('actorId');
    const storeId = searchParams.get('storeId');
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    if (action) whereClause.action = action;
    if (entityType) whereClause.entityType = entityType;
    if (actorId) whereClause.actorId = actorId;
    if (storeId) whereClause.storeId = storeId;

    // Get total count
    const total = await prisma.platformActivity.count({ where: whereClause });

    // Get activities with related data
    const activities = await prisma.platformActivity.findMany({
      where: whereClause,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        targetUser: {
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
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Format response
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      description: activity.description,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
      actor: activity.actor,
      targetUser: activity.targetUser,
      store: activity.store,
      createdAt: activity.createdAt.toISOString(),
    }));

    return NextResponse.json({
      data: formattedActivities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get platform activities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform activities' },
      { status: 500 }
    );
  }
}
