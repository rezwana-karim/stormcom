/**
 * POST /api/payments/attempt
 *
 * Create a new payment attempt (idempotent)
 *
 * Headers:
 *   - Idempotency-Key: Optional client-provided key for idempotent requests
 *
 * Body:
 *   - storeId: string (required)
 *   - orderId: string (required)
 *   - provider: 'stripe' | 'bkash' | 'cod' (required)
 *   - amount: number (required, minor units e.g., cents)
 *   - currency: string (required, ISO 4217 code)
 *   - providerReference: string (optional)
 *
 * Returns:
 *   - 200: Existing attempt if idempotency key matches
 *   - 201: Newly created attempt
 *   - 400: Validation error
 *   - 401: Unauthorized
 *   - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PaymentService, createPaymentAttemptSchema } from '@/lib/services/payment.service';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    const body = await request.json();

    // Extract idempotency key from header or body
    const idempotencyKey =
      request.headers.get('Idempotency-Key') ||
      request.headers.get('X-Idempotency-Key') ||
      body.idempotencyKey;

    // Validate input
    const input = createPaymentAttemptSchema.parse({
      ...body,
      idempotencyKey,
    });

    // Create or retrieve attempt
    const paymentService = PaymentService.getInstance();

    const { attempt, isExisting } = await paymentService.createAttempt(input, {
      userId: (session.user as typeof session.user & { id?: string }).id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(
      {
        attempt: {
          id: attempt.id,
          storeId: attempt.storeId,
          orderId: attempt.orderId,
          provider: attempt.provider,
          providerReference: attempt.providerReference,
          status: attempt.status,
          amount: attempt.amount,
          currency: attempt.currency,
          idempotencyKey: attempt.idempotencyKey,
          attemptCount: attempt.attemptCount,
          createdAt: attempt.createdAt,
          updatedAt: attempt.updatedAt,
        },
        isIdempotentReturn: isExisting,
      },
      { status: isExisting ? 200 : 201 }
    );
  } catch (error) {
    console.error('POST /api/payments/attempt error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Idempotency key')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment attempt' },
      { status: 500 }
    );
  }
}
