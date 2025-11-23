/**
 * Wishlist Item API
 * 
 * Remove specific wishlist items.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * DELETE /api/wishlist/[id]
 * Remove item from wishlist
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

    console.log('Wishlist item removed (mock):', params.id);

    return NextResponse.json({ message: 'Item removed from wishlist' }, { status: 200 });
  } catch (error) {
    console.error('Remove wishlist item error:', error);
    return NextResponse.json(
      { error: 'Failed to remove wishlist item' },
      { status: 500 }
    );
  }
}
