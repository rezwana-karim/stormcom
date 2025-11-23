/**
 * Integration Detail API
 * 
 * GET /api/integrations/[id] - Get integration details
 * PATCH /api/integrations/[id] - Update integration settings
 * DELETE /api/integrations/[id] - Disconnect integration
 * 
 * @module api/integrations/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updateIntegrationSchema = z.object({
  settings: z.record(z.any()),
  active: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock integration details
    const integration = {
      id: params.id,
      type: 'stripe',
      name: 'Stripe',
      description: 'Accept payments with Stripe',
      connected: true,
      connectedAt: '2024-11-15T10:00:00Z',
      status: 'active',
      settings: {
        publishableKey: 'pk_test_***************',
        webhookSecret: 'whsec_***************',
        currency: 'USD',
      },
      stats: {
        transactionsProcessed: 142,
        totalVolume: 15420.50,
        lastUsed: '2024-11-23T09:15:00Z',
      },
    };

    return NextResponse.json({ data: integration });
  } catch (error) {
    console.error('Get integration error:', error);
    return NextResponse.json(
      { error: 'Failed to get integration' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateIntegrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const integration = {
      id: params.id,
      ...validation.data,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      message: 'Integration updated',
      data: integration,
    });
  } catch (error) {
    console.error('Update integration error:', error);
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      message: 'Integration disconnected',
      data: { id: params.id },
    });
  } catch (error) {
    console.error('Delete integration error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}
