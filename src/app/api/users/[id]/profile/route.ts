/**
 * User Profile API
 * 
 * Get and update user profile information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  language: z.enum(['en', 'es', 'fr', 'de', 'zh', 'ja']).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
});

/**
 * GET /api/users/[id]/profile
 * Get user profile
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

    // Check if user can access this profile
    if (session.user.id !== params.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view your own profile' },
        { status: 403 }
      );
    }

    // Mock profile data - In production, fetch from database
    const profile = {
      id: params.id,
      name: 'John Doe',
      email: session.user.email,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + params.id,
      bio: 'Product Manager passionate about building great e-commerce experiences',
      phone: '+1 (555) 123-4567',
      timezone: 'America/New_York',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error('Get profile error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]/profile
 * Update user profile
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

    // Check if user can update this profile
    if (session.user.id !== params.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = profileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Mock profile update - In production, save to database
    const updatedProfile = {
      id: params.id,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    console.log('Profile updated (mock):', updatedProfile);

    return NextResponse.json({ profile: updatedProfile, message: 'Profile updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
