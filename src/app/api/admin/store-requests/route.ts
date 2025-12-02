/**
 * Admin Store Requests API
 * 
 * Super Admin endpoints for managing store requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/store-requests
 * List all store requests with filters
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
    const status = searchParams.get('status') || 'PENDING';
    const search = searchParams.get('search');
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { storeName: { contains: search } },
        { storeSlug: { contains: search } },
        { businessName: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    // Get total count
    const total = await prisma.storeRequest.count({ where: whereClause });

    // Get store requests with related data
    const requests = await prisma.storeRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            accountStatus: true,
            businessName: true,
            businessCategory: true,
            phoneNumber: true,
            createdAt: true,
          },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
        createdStore: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List store requests error:', error);
    return NextResponse.json(
      { error: 'Failed to list store requests' },
      { status: 500 }
    );
  }
}
