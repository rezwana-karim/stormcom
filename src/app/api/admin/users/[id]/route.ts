/**
 * Admin User Management API
 * 
 * Get, update, or delete specific user (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user', 'moderator']).optional(),
  status: z.enum(['active', 'suspended', 'banned']).optional(),
});

/**
 * GET /api/admin/users/[id]
 * Get user details
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

    // Mock user data
    const user = {
      id: params.id,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
      emailVerified: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${params.id}`,
      phone: '+1 (555) 123-4567',
      timezone: 'America/New_York',
      language: 'en',
      organizations: [
        { id: 'org1', name: 'Acme Inc', role: 'owner' },
        { id: 'org2', name: 'Tech Startup', role: 'member' },
      ],
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      loginCount: 145,
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user
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
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Mock user update
    const updatedUser = {
      id: params.id,
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.id,
    };

    console.log('User updated (mock):', updatedUser);

    return NextResponse.json({ user: updatedUser, message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user
 */
export async function DELETE(
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

    // Prevent self-deletion
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    console.log('User deleted (mock):', params.id);

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
