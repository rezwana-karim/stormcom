/**
 * Email Templates API
 * 
 * GET /api/emails/templates - List email templates
 * POST /api/emails/templates - Create email template
 * 
 * @module api/emails/templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  type: z.enum(['order_confirmation', 'shipping_notification', 'password_reset', 'newsletter', 'custom']),
});

// Mock templates database
const mockTemplates = [
  {
    id: 'tpl_1',
    name: 'Order Confirmation',
    subject: 'Order Confirmed - {{orderNumber}}',
    body: 'Thank you for your order {{orderNumber}}...',
    type: 'order_confirmation',
    createdAt: '2024-11-20T10:00:00Z',
  },
  {
    id: 'tpl_2',
    name: 'Shipping Notification',
    subject: 'Your order is on its way!',
    body: 'Your order {{orderNumber}} has been shipped...',
    type: 'shipping_notification',
    createdAt: '2024-11-20T10:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let templates = mockTemplates;
    if (type) {
      templates = templates.filter((t) => t.type === type);
    }

    return NextResponse.json({
      data: templates,
      meta: {
        total: templates.length,
      },
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Failed to get email templates' },
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
    const validation = createTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid template data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const template = {
      id: `tpl_${Date.now()}`,
      ...validation.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      message: 'Email template created',
      data: template,
    }, { status: 201 });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}
