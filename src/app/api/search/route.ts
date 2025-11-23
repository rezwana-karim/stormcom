/**
 * Search API
 * 
 * Global search across products, orders, and customers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/search
 * Search across multiple entity types
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
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, products, orders, customers

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Mock search results
    const results: {
      products: Array<{ id: string; name: string; price: number; image: string }>;
      orders: Array<{ id: string; orderNumber: string; total: number; status: string }>;
      customers: Array<{ id: string; name: string; email: string; totalOrders: number }>;
    } = {
      products: [],
      orders: [],
      customers: [],
    };

    if (type === 'all' || type === 'products') {
      results.products = [
        {
          id: 'prod1',
          name: 'Wireless Headphones',
          price: 79.99,
          image: 'https://via.placeholder.com/150',
        },
        {
          id: 'prod2',
          name: 'Bluetooth Speaker',
          price: 49.99,
          image: 'https://via.placeholder.com/150',
        },
      ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    }

    if (type === 'all' || type === 'orders') {
      results.orders = [
        {
          id: 'ord1',
          orderNumber: 'ORD-2024-001',
          total: 129.99,
          status: 'delivered',
        },
        {
          id: 'ord2',
          orderNumber: 'ORD-2024-002',
          total: 249.99,
          status: 'pending',
        },
      ].filter(o => o.orderNumber.toLowerCase().includes(query.toLowerCase()));
    }

    if (type === 'all' || type === 'customers') {
      results.customers = [
        {
          id: 'cust1',
          name: 'John Doe',
          email: 'john@example.com',
          totalOrders: 5,
        },
        {
          id: 'cust2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          totalOrders: 3,
        },
      ].filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase())
      );
    }

    const totalResults = 
      results.products.length + 
      results.orders.length + 
      results.customers.length;

    return NextResponse.json({ 
      results,
      query,
      type,
      totalResults,
      searchedAt: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
