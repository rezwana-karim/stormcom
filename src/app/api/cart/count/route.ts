/**
 * Cart Count API
 * Get the total number of items in cart (for badge display)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CartService } from '@/lib/services/cart.service';
import { getCartSessionId } from '@/lib/cart-session';

/**
 * GET /api/cart/count
 * Get cart item count
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    const userId = session?.user?.id;
    const sessionId = !userId ? await getCartSessionId() : undefined;

    const count = await CartService.getCartCount(storeId, userId, sessionId);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Get cart count error:', error);
    return NextResponse.json(
      { error: 'Failed to get cart count' },
      { status: 500 }
    );
  }
}
