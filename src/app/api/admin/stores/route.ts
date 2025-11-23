/**
 * Admin Stores API
 * 
 * Manage all stores in the system (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/admin/stores
 * List all stores with filters
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Mock stores data
    const stores = [
      {
        id: 'store1',
        name: 'Acme Store',
        slug: 'acme-store',
        owner: { id: 'user1', name: 'John Doe', email: 'john@example.com' },
        status: 'active',
        plan: 'pro',
        productsCount: 245,
        ordersCount: 1245,
        revenue: 45890.50,
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'store2',
        name: 'Tech Gadgets',
        slug: 'tech-gadgets',
        owner: { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
        status: 'active',
        plan: 'enterprise',
        productsCount: 567,
        ordersCount: 3456,
        revenue: 125430.00,
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'store3',
        name: 'Fashion Hub',
        slug: 'fashion-hub',
        owner: { id: 'user3', name: 'Bob Wilson', email: 'bob@example.com' },
        status: 'suspended',
        plan: 'basic',
        productsCount: 89,
        ordersCount: 234,
        revenue: 12340.00,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const filteredStores = stores.filter(store => {
      if (search && !store.name.toLowerCase().includes(search.toLowerCase()) && 
          !store.slug.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (status && store.status !== status) {
        return false;
      }
      return true;
    });

    const total = filteredStores.length;
    const paginatedStores = filteredStores.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      data: paginatedStores,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('List stores error:', error);
    return NextResponse.json(
      { error: 'Failed to list stores' },
      { status: 500 }
    );
  }
}
