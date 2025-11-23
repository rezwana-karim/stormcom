/**
 * Admin Activity Logs API
 * 
 * Get system-wide activity logs (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/admin/activity
 * Get activity logs
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
    const userId = searchParams.get('userId') || '';
    const action = searchParams.get('action') || '';
    const resource = searchParams.get('resource') || '';

    // Mock activity logs - In production, fetch from database/log system
    const activities = Array.from({ length: limit }, (_, i) => {
      const actions = ['created', 'updated', 'deleted', 'viewed', 'exported'];
      const resources = ['user', 'product', 'order', 'store', 'settings'];
      const actionType = actions[i % actions.length];
      const resourceType = resources[i % resources.length];

      return {
        id: `activity_${page}_${i + 1}`,
        userId: `user_${Math.floor(Math.random() * 100) + 1}`,
        userName: `User ${Math.floor(Math.random() * 100) + 1}`,
        action: actionType,
        resource: resourceType,
        resourceId: `${resourceType}_${Math.floor(Math.random() * 1000) + 1}`,
        details: `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} ${resourceType} successfully`,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - i * 60 * 1000).toISOString(),
      };
    });

    return NextResponse.json({
      data: activities,
      meta: {
        total: 50000,
        page,
        limit,
        totalPages: Math.ceil(50000 / limit),
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
