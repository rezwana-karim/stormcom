/**
 * Cart Count API
 * 
 * Get the total number of items in the user's cart.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/cart/count
 * Get current user's cart item count
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock cart count
    const count = 2;

    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error('Get cart count error:', error);
    return NextResponse.json(
      { error: 'Failed to get cart count' },
      { status: 500 }
    );
  }
}
