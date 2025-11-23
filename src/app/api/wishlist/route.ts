/**
 * Wishlist API
 * 
 * Manage user wishlist operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const addToWishlistSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
});

/**
 * GET /api/wishlist
 * Get current user's wishlist
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

    // Mock wishlist data
    const wishlist = {
      id: `wishlist_${session.user.id}`,
      userId: session.user.id,
      items: [
        {
          id: 'wish1',
          productId: 'prod1',
          productName: 'Premium Headphones',
          price: 299.99,
          image: 'https://via.placeholder.com/150',
          inStock: true,
          addedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'wish2',
          productId: 'prod2',
          productName: 'Smart Watch',
          price: 399.99,
          image: 'https://via.placeholder.com/150',
          inStock: false,
          addedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      itemCount: 2,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ wishlist }, { status: 200 });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to get wishlist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wishlist
 * Add item to wishlist
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
    const validation = addToWishlistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Mock add to wishlist
    const wishlistItem = {
      id: `wish_${Date.now()}`,
      productId: data.productId,
      variantId: data.variantId,
      addedAt: new Date().toISOString(),
    };

    console.log('Item added to wishlist (mock):', wishlistItem);

    return NextResponse.json({ 
      wishlistItem, 
      message: 'Item added to wishlist' 
    }, { status: 201 });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to add item to wishlist' },
      { status: 500 }
    );
  }
}
