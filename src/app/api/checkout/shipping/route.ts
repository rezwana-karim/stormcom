// src/app/api/checkout/shipping/route.ts
// Checkout Shipping API - Calculate shipping options based on address

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CheckoutService } from '@/lib/services/checkout.service';
import { z } from 'zod';

// Validation schema for shipping calculation
const shippingAddressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string(),
  country: z.string(),
});

const calculateShippingSchema = z.object({
  storeId: z.string().cuid(),
  shippingAddress: shippingAddressSchema,
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      variantId: z.string().cuid().optional(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
});

// POST /api/checkout/shipping - Calculate shipping options
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
    const validatedInput = calculateShippingSchema.parse(body);

    const checkoutService = CheckoutService.getInstance();
    const options = await checkoutService.calculateShipping(
      validatedInput.storeId,
      validatedInput.shippingAddress,
      validatedInput.items
    );

    return NextResponse.json({ options });
  } catch (error) {
    console.error('POST /api/checkout/shipping error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 }
    );
  }
}
