/**
 * Permissions API
 * 
 * GET /api/permissions - Get all available permissions for custom role creation
 * 
 * This endpoint returns the list of permissions that can be assigned
 * to custom roles, organized by category.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { 
  AVAILABLE_PERMISSIONS, 
  SUGGESTED_ROLE_TEMPLATES 
} from '@/lib/custom-role-permissions';

/**
 * GET /api/permissions
 * 
 * Returns all available permissions for custom role creation
 * User must be authenticated and either:
 * - Super Admin
 * - Store Admin/Owner of at least one store
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is Super Admin or Store Admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isSuperAdmin: true,
        storeStaff: {
          where: {
            isActive: true,
            role: { in: ['STORE_ADMIN', 'OWNER'] },
          },
          select: { storeId: true },
        },
        memberships: {
          where: {
            role: { in: ['OWNER', 'ADMIN'] },
          },
          select: { organizationId: true },
        },
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // User must be Super Admin or have store admin access
    const hasAccess = user.isSuperAdmin || 
                      user.storeStaff.length > 0 || 
                      user.memberships.length > 0;
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Store Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({
      permissions: AVAILABLE_PERMISSIONS,
      templates: SUGGESTED_ROLE_TEMPLATES,
    });
    
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to get permissions' },
      { status: 500 }
    );
  }
}
