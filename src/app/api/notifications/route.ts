/**
 * GET /api/notifications
 * 
 * List user notifications (orders, updates, alerts)
 * 
 * @requires Authentication
 * @returns Paginated list of notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  type: z.string().nullish(),
  unreadOnly: z.string().nullish().transform(val => val === 'true'),
});

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const validation = QuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type'),
      unreadOnly: searchParams.get('unreadOnly'),
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { page, limit, type, unreadOnly } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Record<string, unknown> = { userId };
    if (type) whereClause.type = type;
    if (unreadOnly) whereClause.read = false;

    // Get notifications count
    const [total, unreadCount] = await Promise.all([
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Format response with safe JSON parsing
    const formattedNotifications = notifications.map(n => {
      let parsedData = null;
      if (n.data) {
        try {
          parsedData = JSON.parse(n.data);
        } catch (e) {
          console.error('Failed to parse notification data:', e);
          parsedData = null;
        }
      }
      return {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: parsedData,
        read: n.read,
        readAt: n.readAt?.toISOString() || null,
        actionUrl: n.actionUrl,
        actionLabel: n.actionLabel,
        createdAt: n.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('[GET /api/notifications] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ids, markAllRead } = body;

    if (markAllRead) {
      // Mark all notifications as read for this user
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true, readAt: new Date() },
      });
    } else if (ids && Array.isArray(ids)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          userId: session.user.id,
        },
        data: { read: true, readAt: new Date() },
      });
    } else {
      return NextResponse.json(
        { error: 'Either ids array or markAllRead must be provided' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('[PATCH /api/notifications] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
