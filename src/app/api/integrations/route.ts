/**
 * Integrations API
 * 
 * GET /api/integrations - List available integrations
 * POST /api/integrations - Connect new integration
 * 
 * @module api/integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const connectIntegrationSchema = z.object({
  type: z.enum(['stripe', 'paypal', 'mailchimp', 'google_analytics', 'facebook_pixel', 'shippo']),
  credentials: z.record(z.string(), z.string()),
  settings: z.record(z.string(), z.unknown()).optional(),
});

// Mock integrations
const mockIntegrations = [
  {
    id: 'int_1',
    type: 'stripe',
    name: 'Stripe',
    description: 'Accept payments with Stripe',
    connected: true,
    connectedAt: '2024-11-15T10:00:00Z',
    status: 'active',
  },
  {
    id: 'int_2',
    type: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing automation',
    connected: false,
    status: 'available',
  },
  {
    id: 'int_3',
    type: 'google_analytics',
    name: 'Google Analytics',
    description: 'Track website analytics',
    connected: true,
    connectedAt: '2024-11-18T14:30:00Z',
    status: 'active',
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connected = searchParams.get('connected');

    let integrations = mockIntegrations;
    if (connected === 'true') {
      integrations = integrations.filter((i) => i.connected);
    } else if (connected === 'false') {
      integrations = integrations.filter((i) => !i.connected);
    }

    return NextResponse.json({
      data: integrations,
      meta: {
        total: integrations.length,
        connected: mockIntegrations.filter((i) => i.connected).length,
      },
    });
  } catch (error) {
    console.error('Get integrations error:', error);
    return NextResponse.json(
      { error: 'Failed to get integrations' },
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
    const validation = connectIntegrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid integration data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const integration = {
      id: `int_${Date.now()}`,
      type: validation.data.type,
      name: validation.data.type.charAt(0).toUpperCase() + validation.data.type.slice(1),
      connected: true,
      connectedAt: new Date().toISOString(),
      status: 'active',
      settings: validation.data.settings || {},
    };

    return NextResponse.json({
      message: 'Integration connected',
      data: integration,
    }, { status: 201 });
  } catch (error) {
    console.error('Connect integration error:', error);
    return NextResponse.json(
      { error: 'Failed to connect integration' },
      { status: 500 }
    );
  }
}
