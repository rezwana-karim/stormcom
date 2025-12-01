/**
 * POST /api/payments/reconciliation
 *
 * Run reconciliation job to find payment attempts stuck in AUTHORIZING state
 * This endpoint should be called by a scheduled job (e.g., daily CRON)
 *
 * Query Parameters:
 *   - timeoutMinutes: number (optional, default 15)
 *
 * Returns:
 *   - 200: Reconciliation result with stuck attempts
 *   - 401: Unauthorized
 *   - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PaymentService } from '@/lib/services/payment.service';

export async function POST(request: NextRequest) {
  try {
    // Auth check - this endpoint should be restricted to admins
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse timeout from query or body
    const { searchParams } = new URL(request.url);
    let timeoutMinutes = 15; // Default

    const timeoutParam = searchParams.get('timeoutMinutes');
    if (timeoutParam) {
      const parsed = parseInt(timeoutParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        timeoutMinutes = parsed;
      }
    }

    // Try to get from body for POST
    try {
      const body = await request.json();
      if (body.timeoutMinutes && typeof body.timeoutMinutes === 'number') {
        timeoutMinutes = body.timeoutMinutes;
      }
    } catch {
      // Body parsing failed, use default or query param
    }

    // Run reconciliation
    const paymentService = PaymentService.getInstance();
    const result = await paymentService.runReconciliation(timeoutMinutes);

    return NextResponse.json({
      success: true,
      reconciliation: {
        checkedAt: result.checkedAt.toISOString(),
        timeoutMinutes,
        totalStuck: result.totalStuck,
        stuckAttempts: result.stuckAttempts.map((attempt) => ({
          id: attempt.id,
          storeId: attempt.storeId,
          orderId: attempt.orderId,
          status: attempt.status,
          createdAt: attempt.createdAt.toISOString(),
          stuckMinutes: attempt.stuckMinutes,
        })),
      },
      message: result.totalStuck > 0
        ? `Found ${result.totalStuck} payment(s) stuck in AUTHORIZING state`
        : 'No stuck payments found',
    });
  } catch (error) {
    console.error('POST /api/payments/reconciliation error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to run reconciliation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/reconciliation
 *
 * Check for stuck payments without triggering full reconciliation
 * Useful for monitoring dashboards
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeoutParam = searchParams.get('timeoutMinutes');
    const timeoutMinutes = timeoutParam ? parseInt(timeoutParam, 10) : 15;

    // Find stuck attempts (without logging to audit)
    const paymentService = PaymentService.getInstance();
    const result = await paymentService.findStuckAttempts(timeoutMinutes);

    return NextResponse.json({
      checkedAt: result.checkedAt.toISOString(),
      timeoutMinutes,
      totalStuck: result.totalStuck,
      stuckAttempts: result.stuckAttempts.map((attempt) => ({
        id: attempt.id,
        storeId: attempt.storeId,
        orderId: attempt.orderId,
        status: attempt.status,
        createdAt: attempt.createdAt.toISOString(),
        stuckMinutes: attempt.stuckMinutes,
      })),
    });
  } catch (error) {
    console.error('GET /api/payments/reconciliation error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to check reconciliation status' },
      { status: 500 }
    );
  }
}
