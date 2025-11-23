/**
 * Subscribe API
 * 
 * Create a new subscription for a customer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const subscribeSchema = z.object({
  customerId: z.string().min(1),
  plan: z.enum(['basic', 'pro', 'enterprise']),
  interval: z.enum(['monthly', 'yearly']),
  paymentMethodId: z.string().optional(),
  trialDays: z.number().int().min(0).max(90).optional(),
});

/**
 * POST /api/subscriptions/subscribe
 * Create a new subscription
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
    const validation = subscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Mock subscription creation - In production, integrate with Stripe/payment processor
    const subscription = {
      id: `sub_${Date.now()}`,
      customerId: data.customerId,
      plan: data.plan,
      interval: data.interval,
      status: data.trialDays ? 'trialing' : 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + (data.interval === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
      trialEnd: data.trialDays ? new Date(Date.now() + data.trialDays * 24 * 60 * 60 * 1000).toISOString() : null,
      amount: data.plan === 'basic' ? (data.interval === 'monthly' ? 9.99 : 99.99) :
              data.plan === 'pro' ? (data.interval === 'monthly' ? 29.99 : 299.99) :
              (data.interval === 'monthly' ? 99.99 : 999.99),
      currency: 'USD',
      createdAt: new Date().toISOString(),
    };

    console.log('Subscription created (mock):', subscription);

    return NextResponse.json({ subscription, message: 'Subscription created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Subscribe error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
