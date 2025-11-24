/**
 * Cart Item API
 * 
 * Update or remove specific cart items.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CartService } from '@/lib/services/cart.service';
import { getCartSessionId } from '@/lib/cart-session';
import { z } from 'zod';

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
});

/**
 * PATCH /api/cart/[id]
 * Update cart item quantity
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const validation = updateCartItemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const userId = session?.user?.id;
    const sessionId = !userId ? await getCartSessionId() : undefined;

    const cart = await CartService.updateCartItem({
      cartItemId: params.id,
      quantity: data.quantity,
      userId,
      sessionId,
    });

    return NextResponse.json({
      cart,
      message: data.quantity === 0 ? 'Item removed from cart' : 'Cart item updated successfully',
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/[id]
 * Remove item from cart
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const sessionId = !userId ? await getCartSessionId() : undefined;

    const cart = await CartService.removeCartItem(params.id, userId, sessionId);

    return NextResponse.json({
      cart,
      message: 'Item removed from cart successfully',
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}
