/**
 * PATCH /api/subscriptions/[id]
 * 
 * Update subscription status for a store
 * 
 * @requires Authentication (Admin only)
 * @returns Updated store subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

const UpdateSubscriptionSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan).optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  trialEndsAt: z.string().datetime().optional(),
  subscriptionEndsAt: z.string().datetime().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract params
    const { id: storeId } = await context.params;

    // Parse and validate request body
    const body = await request.json();
    const validation = UpdateSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Check if store exists
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

    // Update subscription
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        ...(updateData.plan && { subscriptionPlan: updateData.plan }),
        ...(updateData.status && { subscriptionStatus: updateData.status }),
        ...(updateData.trialEndsAt && { 
          trialEndsAt: new Date(updateData.trialEndsAt) 
        }),
        ...(updateData.subscriptionEndsAt && { 
          subscriptionEndsAt: new Date(updateData.subscriptionEndsAt) 
        }),
        // Update limits based on plan
        ...(updateData.plan && {
          productLimit: updateData.plan === SubscriptionPlan.FREE ? 10 :
                       updateData.plan === SubscriptionPlan.BASIC ? 100 :
                       updateData.plan === SubscriptionPlan.PRO ? 1000 :
                       10000,
          orderLimit: updateData.plan === SubscriptionPlan.FREE ? 100 :
                     updateData.plan === SubscriptionPlan.BASIC ? 1000 :
                     updateData.plan === SubscriptionPlan.PRO ? 10000 :
                     100000,
        }),
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
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedStore,
      message: 'Subscription updated successfully',
    });
  } catch (error) {
    console.error('[PATCH /api/subscriptions/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
