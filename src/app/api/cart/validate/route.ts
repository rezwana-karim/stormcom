/**
 * Cart Validation API
 * Validate cart items before checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CartService } from '@/lib/services/cart.service';
import { getCartSessionId } from '@/lib/cart-session';

/**
 * POST /api/cart/validate
 * Validate cart items (stock, prices, availability)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    const userId = session?.user?.id;
    const sessionId = !userId ? await getCartSessionId() : undefined;

    const validation = await CartService.validateCart(storeId, userId, sessionId);

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Validate cart error:', error);
    return NextResponse.json(
      { error: 'Failed to validate cart' },
      { status: 500 }
    );
  }
}
