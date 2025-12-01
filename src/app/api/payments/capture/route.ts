/**
 * POST /api/payments/capture
 *
 * Capture an authorized payment (AUTHORIZED → CAPTURED)
 *
 * Body:
 *   - attemptId: string (required)
 *   - storeId: string (required)
 *   - amount: number (optional, defaults to authorized amount)
 *   - providerReference: string (optional)
 *
 * Returns:
 *   - 200: Payment captured successfully
 *   - 400: Validation error or invalid transition
 *   - 401: Unauthorized
 *   - 404: Payment attempt not found
 *   - 409: Payment already captured (double-capture prevention)
 *   - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PaymentService, capturePaymentSchema } from '@/lib/services/payment.service';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const input = capturePaymentSchema.parse(body);

    // Capture payment
    const paymentService = PaymentService.getInstance();
    const attempt = await paymentService.capture(input, {
      userId: (session.user as typeof session.user & { id?: string }).id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        storeId: attempt.storeId,
        orderId: attempt.orderId,
        provider: attempt.provider,
        providerReference: attempt.providerReference,
        status: attempt.status,
        amount: attempt.amount,
        currency: attempt.currency,
        createdAt: attempt.createdAt,
        updatedAt: attempt.updatedAt,
        transactions: attempt.transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          currency: t.currency,
          providerReference: t.providerReference,
          createdAt: t.createdAt,
        })),
      },
      message: 'Payment captured successfully',
    });
  } catch (error) {
    console.error('POST /api/payments/capture error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Double-capture prevention - return 409 Conflict
      if ((error as Error & { code?: string }).code === 'ALREADY_CAPTURED' ||
          error.message.includes('already captured')) {
        return NextResponse.json(
          { error: 'Payment already captured', code: 'ALREADY_CAPTURED' },
          { status: 409 }
        );
      }

      // Not found
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      // Invalid transition
      if (error.message.includes('Invalid transition')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to capture payment' },
      { status: 500 }
    );
  }
}
