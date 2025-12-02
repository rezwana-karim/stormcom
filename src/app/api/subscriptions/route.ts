/**
 * GET /api/subscriptions
 * 
 * Get subscription information for a store
 * 
 * @requires Authentication
 * @returns Store subscription details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const GetSubscriptionSchema = z.object({
  storeId: z.string().cuid(),
});

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Validate storeId
    const validation = GetSubscriptionSchema.safeParse({ storeId });
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Verify user has access to this store (prevent IDOR)
    const userMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: {
          store: {
            id: storeId,
          },
        },
      },
    });

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Access denied. You do not have access to this store.' },
        { status: 403 }
      );
    }

    // Get store with subscription details
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        productLimit: true,
        orderLimit: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Calculate days remaining for trial/subscription
    const now = new Date();
    let daysRemaining = null;
    
    if (store.subscriptionStatus === 'TRIAL' && store.trialEndsAt) {
      const diff = store.trialEndsAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    } else if (store.subscriptionEndsAt) {
      const diff = store.subscriptionEndsAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      success: true,
      data: {
        ...store,
        daysRemaining,
        isActive: store.subscriptionStatus === 'ACTIVE' || 
                  store.subscriptionStatus === 'TRIAL',
        needsUpgrade: store.subscriptionStatus === 'PAST_DUE' || 
                      store.subscriptionStatus === 'CANCELED' ||
                      (store.subscriptionStatus === 'TRIAL' && daysRemaining && daysRemaining <= 0),
      },
    });
  } catch (error) {
    console.error('[GET /api/subscriptions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions
 * 
 * Create subscription checkout session (Stripe integration placeholder)
 * 
 * TODO: Integrate with Stripe for actual payment processing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { storeId, plan } = body;

    if (!storeId || !plan) {
      return NextResponse.json(
        { error: 'storeId and plan are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this store
    const userMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: {
          store: {
            id: storeId,
          },
        },
      },
    });

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Access denied. You do not have access to this store.' },
        { status: 403 }
      );
    }

    // Verify store exists
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        deletedAt: null,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // TODO: Create actual Stripe checkout session
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const checkoutSession = await stripe.checkout.sessions.create({...});

    // Mock checkout session
    const mockCheckoutSession = {
      id: `cs_mock_${Date.now()}`,
      url: `https://checkout.stripe.com/mock/${Date.now()}`,
      plan,
      storeId,
    };

    return NextResponse.json({
      success: true,
      data: mockCheckoutSession,
      message: 'Checkout session created (MOCK - Configure Stripe for real payments)',
    });
  } catch (error) {
    console.error('[POST /api/subscriptions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
