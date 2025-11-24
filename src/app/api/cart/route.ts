/**
 * Cart API
 * 
 * Manage shopping cart operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CartService } from '@/lib/services/cart.service';
import { getCartSessionId } from '@/lib/cart-session';
import { z } from 'zod';

const addToCartSchema = z.object({
  storeId: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
});

/**
 * GET /api/cart
 * Get current user's cart
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

    const cart = await CartService.getOrCreateCart(storeId, userId, sessionId);

    // Calculate tax and shipping (simplified - you can enhance this)
    const taxRate = 0.08; // 8% tax
    const tax = cart.subtotal * taxRate;
    const shipping = cart.subtotal > 50 ? 0 : 10.0; // Free shipping over $50
    const total = cart.subtotal + tax + shipping;

    return NextResponse.json({
      cart: {
        ...cart,
        tax,
        shipping,
        total,
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get cart' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Add item to cart
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const validation = addToCartSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const userId = session?.user?.id;
    const sessionId = !userId ? await getCartSessionId() : undefined;

    const cart = await CartService.addToCart({
      ...data,
      userId,
      sessionId,
    });

    return NextResponse.json(
      {
        cart,
        message: 'Item added to cart successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart
 * Clear cart
 */
export async function DELETE(request: NextRequest) {
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

    await CartService.clearCart(storeId, userId, sessionId);

    return NextResponse.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
