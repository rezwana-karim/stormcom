/**
 * Cancel Subscription API
 * 
 * Cancel an active subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const cancelSchema = z.object({
  subscriptionId: z.string().min(1),
  immediately: z.boolean().optional(),
  reason: z.string().optional(),
  feedback: z.string().optional(),
});

/**
 * POST /api/subscriptions/cancel
 * Cancel a subscription
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
    const validation = cancelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Mock subscription cancellation - In production, integrate with Stripe/payment processor
    const canceledSubscription = {
      id: data.subscriptionId,
      status: 'canceled',
      canceledAt: new Date().toISOString(),
      cancelAtPeriodEnd: !data.immediately,
      cancellationDetails: {
        reason: data.reason || 'Customer requested',
        feedback: data.feedback,
        canceledBy: session.user.id,
      },
      endDate: data.immediately ? new Date().toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    console.log('Subscription canceled (mock):', canceledSubscription);

    return NextResponse.json({ 
      subscription: canceledSubscription, 
      message: data.immediately ? 'Subscription canceled immediately' : 'Subscription will be canceled at period end' 
    }, { status: 200 });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
