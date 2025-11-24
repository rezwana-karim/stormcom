// src/app/api/checkout/validate/route.ts
// Checkout Validate API - Validates cart items and checks stock availability

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CheckoutService } from '@/lib/services/checkout.service';
import { z } from 'zod';

// Validation schema for cart validation request
const validateCartSchema = z.object({
  storeId: z.string().cuid(),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      variantId: z.string().cuid().optional(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
});

// POST /api/checkout/validate - Validate cart items
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedInput = validateCartSchema.parse(body);

    const checkoutService = CheckoutService.getInstance();
    const result = await checkoutService.validateCart(
      validatedInput.storeId,
      validatedInput.items
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/checkout/validate error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to validate cart' },
      { status: 500 }
    );
  }
}
