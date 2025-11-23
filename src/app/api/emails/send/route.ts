/**
 * Email Sending API
 * 
 * POST /api/emails/send - Send transactional emails
 * 
 * @module api/emails/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  type: z.enum(['order_confirmation', 'shipping_notification', 'password_reset', 'custom']).optional(),
  orderId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = sendEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { to, subject, body: emailBody, type, orderId } = validation.data;

    // In production, integrate with email service (Resend, SendGrid, etc.)
    // For now, log the email details
    console.log('Email sent:', {
      to,
      subject,
      type,
      orderId,
      bodyLength: emailBody.length,
      sentBy: session.user.id,
    });

    // Mock successful email send
    return NextResponse.json({
      message: 'Email sent successfully',
      data: {
        id: `email_${Date.now()}`,
        to,
        subject,
        type: type || 'custom',
        status: 'sent',
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
