/**
 * Admin System Settings API
 * 
 * Get and update system-wide settings (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const systemSettingsSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  signupEnabled: z.boolean().optional(),
  emailVerificationRequired: z.boolean().optional(),
  maxUploadSize: z.number().positive().optional(), // MB
  sessionTimeout: z.number().positive().optional(), // minutes
  rateLimit: z.object({
    enabled: z.boolean(),
    requestsPerMinute: z.number().positive(),
  }).optional(),
  features: z.object({
    reviews: z.boolean().optional(),
    wishlist: z.boolean().optional(),
    guestCheckout: z.boolean().optional(),
    subscriptions: z.boolean().optional(),
  }).optional(),
  smtp: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    username: z.string().optional(),
    secure: z.boolean().optional(),
  }).optional(),
});

/**
 * GET /api/admin/system
 * Get system settings
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock system settings
    const settings = {
      maintenanceMode: false,
      signupEnabled: true,
      emailVerificationRequired: true,
      maxUploadSize: 10, // MB
      sessionTimeout: 60, // minutes
      rateLimit: {
        enabled: true,
        requestsPerMinute: 100,
      },
      features: {
        reviews: true,
        wishlist: true,
        guestCheckout: true,
        subscriptions: true,
      },
      smtp: {
        host: 'smtp.example.com',
        port: 587,
        username: 'noreply@example.com',
        secure: true,
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error('Get system settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get system settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/system
 * Update system settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = systemSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Mock system settings update
    const updatedSettings = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.id,
    };

    console.log('System settings updated (mock):', updatedSettings);

    return NextResponse.json({ 
      settings: updatedSettings, 
      message: 'System settings updated successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Update system settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}
