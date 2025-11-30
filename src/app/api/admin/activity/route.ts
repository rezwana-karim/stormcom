/**
 * Admin Activity Logs API
 * 
 * Get system-wide activity logs (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/activity
 * Get activity logs using real audit log service
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') as 'CREATE' | 'UPDATE' | 'DELETE' | undefined;
    const entityType = searchParams.get('resource') || undefined;

    // Get audit logs directly from database with includes
    const whereClause: Record<string, string | undefined> = {};
    if (userId) whereClause.userId = userId;
    if (action) whereClause.action = action;
    if (entityType) whereClause.entityType = entityType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    // Transform to match expected format
    const activities = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name || log.user?.email || 'Unknown',
      action: log.action.toLowerCase(),
      resource: log.entityType,
      resourceId: log.entityId,
      details: `${log.action} ${log.entityType}`,
      ip: log.ipAddress || 'N/A',
      userAgent: log.userAgent || 'N/A',
      timestamp: log.createdAt,
      changes: log.changes,
      store: log.store?.name,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get activity logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}
