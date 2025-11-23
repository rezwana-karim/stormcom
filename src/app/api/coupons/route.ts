/**
 * Coupons API
 * 
 * Manage discount coupons and promo codes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createCouponSchema = z.object({
  code: z.string().min(3).max(20),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive(),
  minPurchase: z.number().min(0).optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  expiresAt: z.string().optional(),
});

/**
 * GET /api/coupons
 * List all coupons
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    // Mock coupons data
    const coupons = [
      {
        id: 'coup1',
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        minPurchase: 50,
        maxDiscount: 100,
        usageLimit: 1000,
        usageCount: 234,
        active: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'coup2',
        code: 'FREESHIP',
        type: 'fixed',
        value: 10,
        minPurchase: 25,
        usageLimit: 500,
        usageCount: 456,
        active: true,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const filteredCoupons = active === 'true' 
      ? coupons.filter(c => c.active) 
      : coupons;

    return NextResponse.json({ 
      data: filteredCoupons,
      meta: { total: filteredCoupons.length },
    }, { status: 200 });
  } catch (error) {
    console.error('List coupons error:', error);
    return NextResponse.json(
      { error: 'Failed to list coupons' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coupons
 * Create a new coupon
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
    const validation = createCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Mock coupon creation
    const coupon = {
      id: `coup_${Date.now()}`,
      ...data,
      active: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
    };

    console.log('Coupon created (mock):', coupon);

    return NextResponse.json({ coupon, message: 'Coupon created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
