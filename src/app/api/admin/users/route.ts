/**
 * Admin Users API
 * 
 * Manage all users in the system (Super Admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AccountStatus } from '@prisma/client';

/**
 * GET /api/admin/users
 * List all users with pagination and filters
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
    const status = searchParams.get('status') as AccountStatus | null;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { businessName: { contains: search } },
      ];
    }

    if (status && Object.values(AccountStatus).includes(status)) {
      whereClause.accountStatus = status;
    }

    // Get total count
    const total = await prisma.user.count({ where: whereClause });

    // Get users with related data
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        isSuperAdmin: true,
        accountStatus: true,
        businessName: true,
        businessCategory: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
        approvedAt: true,
        memberships: {
          select: {
            role: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        storeStaff: {
          where: { isActive: true },
          select: {
            role: true,
            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            memberships: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Format response
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      isSuperAdmin: user.isSuperAdmin,
      accountStatus: user.accountStatus,
      businessName: user.businessName,
      businessCategory: user.businessCategory,
      phoneNumber: user.phoneNumber,
      organizationCount: user._count.memberships,
      stores: user.storeStaff.map(ss => ({
        id: ss.store.id,
        name: ss.store.name,
        role: ss.role,
      })),
      organizations: user.memberships.map(m => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role,
      })),
      createdAt: user.createdAt.toISOString(),
      approvedAt: user.approvedAt?.toISOString() || null,
    }));

    return NextResponse.json({
      data: formattedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/stats
 * Get user statistics by status
 */
export async function POST(_request: NextRequest) {
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

    // Get counts by status
    const [pending, approved, rejected, suspended, total] = await Promise.all([
      prisma.user.count({ where: { accountStatus: 'PENDING' } }),
      prisma.user.count({ where: { accountStatus: 'APPROVED' } }),
      prisma.user.count({ where: { accountStatus: 'REJECTED' } }),
      prisma.user.count({ where: { accountStatus: 'SUSPENDED' } }),
      prisma.user.count(),
    ]);

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRegistrations = await prisma.user.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    });

    return NextResponse.json({
      stats: {
        total,
        pending,
        approved,
        rejected,
        suspended,
        recentRegistrations,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}
