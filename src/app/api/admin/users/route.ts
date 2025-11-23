/**
 * Admin Users API
 * 
 * Manage all users in the system (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/admin/users
 * List all users with pagination and filters
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

    // TODO: Check if user has admin role
    // if (!session.user.isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    // }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    // Mock users data - In production, fetch from database
    const users = Array.from({ length: limit }, (_, i) => ({
      id: `user_${page}_${i + 1}`,
      name: `User ${page * limit + i + 1}`,
      email: `user${page * limit + i + 1}@example.com`,
      role: ['admin', 'user', 'manager'][i % 3],
      status: ['active', 'inactive', 'suspended'][i % 3],
      emailVerified: i % 2 === 0,
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      lastLoginAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      organizationCount: Math.floor(Math.random() * 5) + 1,
    }));

    return NextResponse.json({
      data: users,
      meta: {
        total: 150,
        page,
        limit,
        totalPages: Math.ceil(150 / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
