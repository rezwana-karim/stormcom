/**
 * Admin Pending Users API
 * 
 * List all users with PENDING account status awaiting approval.
 * Super Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/users/pending
 * List all pending users awaiting approval
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build search condition
    const searchCondition = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { businessName: { contains: search } },
          ],
        }
      : {};

    // Get pending users count
    const total = await prisma.user.count({
      where: {
        accountStatus: 'PENDING',
        ...searchCondition,
      },
    });

    // Get pending users
    const pendingUsers = await prisma.user.findMany({
      where: {
        accountStatus: 'PENDING',
        ...searchCondition,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        accountStatus: true,
        businessName: true,
        businessDescription: true,
        businessCategory: true,
        phoneNumber: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      data: pendingUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get pending users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending users' },
      { status: 500 }
    );
  }
}
