/**
 * POST /api/payments/refund
 *
 * Refund a captured payment
 *
 * Body:
 *   - attemptId: string (required)
 *   - storeId: string (required)
 *   - amount: number (required, minor units)
 *   - reason: string (optional)
 *   - providerReference: string (optional)
 *
 * Returns:
 *   - 200: Refund processed successfully
 *   - 400: Validation error (e.g., amount exceeds refundable amount)
 *   - 401: Unauthorized
 *   - 404: Payment attempt not found
 *   - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PaymentService, refundPaymentSchema } from '@/lib/services/payment.service';
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
    const input = refundPaymentSchema.parse(body);

    // Get refundable amount first for validation
    const paymentService = PaymentService.getInstance();
    const refundableAmount = await paymentService.getRefundableAmount(
      input.attemptId,
      input.storeId
    );

    if (refundableAmount === 0) {
      return NextResponse.json(
        { error: 'No refundable amount available. Payment may not be captured or already fully refunded.' },
        { status: 400 }
      );
    }

    // Process refund
    const attempt = await paymentService.refund(input, {
      userId: (session.user as typeof session.user & { id?: string }).id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Calculate remaining refundable amount
    const newRefundableAmount = await paymentService.getRefundableAmount(
      input.attemptId,
      input.storeId
    );

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        storeId: attempt.storeId,
        orderId: attempt.orderId,
        provider: attempt.provider,
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
      refund: {
        amount: input.amount,
        reason: input.reason,
        remainingRefundable: newRefundableAmount,
      },
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('POST /api/payments/refund error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Not found
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      // Refund amount validation
      if (error.message.includes('exceeds refundable amount') ||
          error.message.includes('not been captured')) {
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
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
