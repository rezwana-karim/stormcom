/**
 * Cart API
 * 
 * Manage shopping cart operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
});

/**
 * GET /api/cart
 * Get current user's cart
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

    // Mock cart data
    const cart = {
      id: `cart_${session.user.id}`,
      userId: session.user.id,
      items: [
        {
          id: 'item1',
          productId: 'prod1',
          productName: 'Sample Product',
          variantId: null,
          quantity: 2,
          price: 49.99,
          image: 'https://via.placeholder.com/150',
        },
      ],
      subtotal: 99.98,
      tax: 8.00,
      shipping: 10.00,
      total: 117.98,
      itemCount: 2,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ cart }, { status: 200 });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { error: 'Failed to get cart' },
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
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = addToCartSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Mock add to cart
    const cartItem = {
      id: `item_${Date.now()}`,
      productId: data.productId,
      variantId: data.variantId,
      quantity: data.quantity,
      addedAt: new Date().toISOString(),
    };

    console.log('Item added to cart (mock):', cartItem);

    return NextResponse.json({ 
      cartItem, 
      message: 'Item added to cart' 
    }, { status: 201 });
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart
 * Clear cart
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Cart cleared (mock) for user:', session.user.id);

    return NextResponse.json({ message: 'Cart cleared' }, { status: 200 });
  } catch (error) {
    console.error('Clear cart error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
