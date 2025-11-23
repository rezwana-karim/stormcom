/**
 * Coupon Validation API
 * 
 * Validate and apply coupon codes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const validateCouponSchema = z.object({
  code: z.string().min(1),
  cartTotal: z.number().min(0),
});

/**
 * POST /api/coupons/validate
 * Validate a coupon code
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
    const validation = validateCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { code, cartTotal } = validation.data;

    // Mock coupon validation
    const mockCoupons: Record<string, { type: string; value: number; minPurchase?: number; maxDiscount?: number }> = {
      'SAVE20': { type: 'percentage', value: 20, minPurchase: 50, maxDiscount: 100 },
      'FREESHIP': { type: 'fixed', value: 10, minPurchase: 25 },
      'VIP50': { type: 'percentage', value: 50, minPurchase: 200, maxDiscount: 500 },
    };

    const coupon = mockCoupons[code.toUpperCase()];

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 404 }
      );
    }

    if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
      return NextResponse.json(
        { error: `Minimum purchase of $${coupon.minPurchase} required` },
        { status: 400 }
      );
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (cartTotal * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }

    const result = {
      valid: true,
      code: code.toUpperCase(),
      type: coupon.type,
      discount: Number(discount.toFixed(2)),
      newTotal: Number((cartTotal - discount).toFixed(2)),
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
