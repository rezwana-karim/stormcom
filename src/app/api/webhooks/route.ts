/**
 * Webhooks API
 * 
 * GET /api/webhooks - List webhooks
 * POST /api/webhooks - Create webhook
 * 
 * @module api/webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
  active: z.boolean().default(true),
});

// Mock webhooks (in production, use database)
const mockWebhooks = [
  {
    id: 'wh_1',
    url: 'https://example.com/webhooks/orders',
    events: ['order.created', 'order.updated', 'order.completed'],
    secret: 'whsec_***************',
    active: true,
    createdAt: '2024-11-20T10:00:00Z',
    lastTriggered: '2024-11-23T08:30:00Z',
  },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      data: mockWebhooks,
      meta: {
        total: mockWebhooks.length,
      },
    });
  } catch (error) {
    console.error('Get webhooks error:', error);
    return NextResponse.json(
      { error: 'Failed to get webhooks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createWebhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid webhook data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const webhook = {
      id: `wh_${Date.now()}`,
      ...validation.data,
      secret: validation.data.secret || `whsec_${Math.random().toString(36).substring(2)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      message: 'Webhook created',
      data: webhook,
    }, { status: 201 });
  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
