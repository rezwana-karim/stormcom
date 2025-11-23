/**
 * Subscription Status API
 * 
 * Get subscription status and details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/subscriptions/status?customerId=xxx
 * Get subscription status for a customer
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
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Mock subscription status - In production, fetch from Stripe/payment processor
    const subscription = {
      id: `sub_${customerId}_123`,
      customerId,
      plan: 'pro',
      interval: 'monthly',
      status: 'active',
      currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 29.99,
      currency: 'USD',
      cancelAtPeriodEnd: false,
      trialEnd: null,
      features: [
        'Unlimited products',
        'Advanced analytics',
        'Priority support',
        'Custom domain',
        'API access',
      ],
      usage: {
        productsUsed: 45,
        productsLimit: null,
        storageUsed: '2.3 GB',
        storageLimit: '10 GB',
        apiCallsUsed: 12500,
        apiCallsLimit: 50000,
      },
      nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      nextBillingAmount: 29.99,
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return NextResponse.json({ subscription }, { status: 200 });
  } catch (error) {
    console.error('Get subscription status error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
