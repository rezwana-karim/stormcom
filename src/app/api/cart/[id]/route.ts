/**
 * Cart Item API
 * 
 * Update or remove specific cart items.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateCartItemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If quantity is 0, remove item
    if (data.quantity === 0) {
      console.log('Cart item removed (mock):', params.id);
      return NextResponse.json({ message: 'Item removed from cart' }, { status: 200 });
    }

    // Mock update cart item
    const updatedItem = {
      id: params.id,
      quantity: data.quantity,
      updatedAt: new Date().toISOString(),
    };

    console.log('Cart item updated (mock):', updatedItem);

    return NextResponse.json({ 
      cartItem: updatedItem, 
      message: 'Cart item updated' 
    }, { status: 200 });
  } catch (error) {
    console.error('Update cart item error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
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
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Cart item removed (mock):', params.id);

    return NextResponse.json({ message: 'Item removed from cart' }, { status: 200 });
  } catch (error) {
    console.error('Remove cart item error:', error);
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}
