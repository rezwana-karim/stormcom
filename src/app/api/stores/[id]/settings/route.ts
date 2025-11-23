/**
 * Store Settings API
 * 
 * Get and update store general settings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const settingsSchema = z.object({
  storeName: z.string().min(1).max(100).optional(),
  storeDescription: z.string().max(500).optional(),
  currency: z.string().length(3).optional(), // ISO 4217
  timezone: z.string().optional(),
  language: z.string().length(2).optional(), // ISO 639-1
  taxRate: z.number().min(0).max(100).optional(),
  shippingZones: z.array(z.string()).optional(),
  allowGuestCheckout: z.boolean().optional(),
  requireAccountVerification: z.boolean().optional(),
  enableReviews: z.boolean().optional(),
  enableWishlist: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * GET /api/stores/[id]/settings
 * Get store settings
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock settings data - In production, fetch from database
    const settings = {
      storeId: params.id,
      storeName: 'Acme Store',
      storeDescription: 'Premium quality products for your everyday needs',
      currency: 'USD',
      timezone: 'America/New_York',
      language: 'en',
      taxRate: 8.5,
      shippingZones: ['US', 'CA', 'MX'],
      allowGuestCheckout: true,
      requireAccountVerification: true,
      enableReviews: true,
      enableWishlist: true,
      maintenanceMode: false,
      seo: {
        metaTitle: 'Acme Store - Quality Products',
        metaDescription: 'Shop the best products at Acme Store',
        keywords: ['ecommerce', 'shopping', 'quality products'],
      },
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error('Get settings error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/stores/[id]/settings
 * Update store settings
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Mock settings update - In production, save to database
    const updatedSettings = {
      storeId: params.id,
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.id,
    };

    console.log('Settings updated (mock):', updatedSettings);

    return NextResponse.json({ settings: updatedSettings, message: 'Settings updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Update settings error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
