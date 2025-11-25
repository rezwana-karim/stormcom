// src/app/api/checkout/complete/route.ts
// Checkout Complete API - Finalize order creation

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CheckoutService } from '@/lib/services/checkout.service';
import { z } from 'zod';

// Validation schema for order creation
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

const completeCheckoutSchema = z.object({
  storeId: z.string().cuid(),
  customerId: z.string().cuid().optional(),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      variantId: z.string().cuid().optional(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  shippingMethod: z.string().min(1),
  shippingCost: z.number().min(0),
  discountCode: z.string().optional(),
  customerNote: z.string().optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_BANKING', 'BANK_TRANSFER', 'CASH_ON_DELIVERY']).optional(),
  paymentGateway: z.enum(['STRIPE', 'SSLCOMMERZ', 'MANUAL']).optional(),
});

// POST /api/checkout/complete - Create order
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
    const validatedInput = completeCheckoutSchema.parse(body);

    // Get IP address from request
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    const checkoutService = CheckoutService.getInstance();
    const order = await checkoutService.createOrder({
      ...validatedInput,
      customerId: session.user.id,
      ipAddress,
    }, session.user.id);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('POST /api/checkout/complete error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
