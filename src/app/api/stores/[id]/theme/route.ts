/**
 * Store Theme API
 * 
 * Get and update store theme settings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.enum(['inter', 'roboto', 'poppins', 'playfair', 'montserrat']).optional(),
  logo: z.string().url().optional(),
  favicon: z.string().url().optional(),
  customCSS: z.string().optional(),
  layout: z.enum(['classic', 'modern', 'minimal']).optional(),
});

/**
 * GET /api/stores/[id]/theme
 * Get store theme settings
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

    // Mock theme data - In production, fetch from database
    const theme = {
      storeId: params.id,
      primaryColor: '#4F46E5',
      secondaryColor: '#10B981',
      fontFamily: 'inter',
      logo: 'https://example.com/logo.png',
      favicon: 'https://example.com/favicon.ico',
      customCSS: '',
      layout: 'modern',
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ theme }, { status: 200 });
  } catch (error) {
    console.error('Get theme error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get theme' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/stores/[id]/theme
 * Update store theme settings
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
    const validation = themeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Mock theme update - In production, save to database
    const updatedTheme = {
      storeId: params.id,
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.id,
    };

    console.log('Theme updated (mock):', updatedTheme);

    return NextResponse.json({ theme: updatedTheme, message: 'Theme updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Update theme error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update theme' },
      { status: 500 }
    );
  }
}
