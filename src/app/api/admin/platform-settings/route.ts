/**
 * Platform Settings API
 * 
 * GET /api/admin/platform-settings - Get platform settings
 * PATCH /api/admin/platform-settings - Update platform settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/platform-settings
 * Get platform settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is Super Admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });
    
    if (!user?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super Admin access required' },
        { status: 403 }
      );
    }
    
    // Get or create platform settings
    let settings = await prisma.platformSettings.findUnique({
      where: { id: 'global' },
      include: {
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    
    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          id: 'global',
          defaultCustomRoleLimit: 5,
          maxCustomRoleLimit: 20,
          customRoleLimitsByPlan: JSON.stringify({
            FREE: 3,
            BASIC: 5,
            PRO: 10,
            ENTERPRISE: 20,
          }),
        },
        include: {
          updatedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    }
    
    // Parse limits by plan
    let limitsByPlan = {};
    try {
      limitsByPlan = JSON.parse(settings.customRoleLimitsByPlan);
    } catch {
      limitsByPlan = { FREE: 3, BASIC: 5, PRO: 10, ENTERPRISE: 20 };
    }
    
    return NextResponse.json({
      settings: {
        defaultCustomRoleLimit: settings.defaultCustomRoleLimit,
        maxCustomRoleLimit: settings.maxCustomRoleLimit,
        customRoleLimitsByPlan: limitsByPlan,
        updatedAt: settings.updatedAt,
        updatedBy: settings.updatedBy,
      },
    });
    
  } catch (error) {
    console.error('Get platform settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get platform settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/platform-settings
 * Update platform settings
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
    
    // Check if user is Super Admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });
    
    if (!user?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { 
      defaultCustomRoleLimit, 
      maxCustomRoleLimit, 
      customRoleLimitsByPlan 
    } = body;
    
    const updateData: Record<string, unknown> = {
      updatedById: session.user.id,
    };
    
    // Validate and update defaultCustomRoleLimit
    if (defaultCustomRoleLimit !== undefined) {
      if (typeof defaultCustomRoleLimit !== 'number' || defaultCustomRoleLimit < 0) {
        return NextResponse.json(
          { error: 'Invalid default custom role limit' },
          { status: 400 }
        );
      }
      updateData.defaultCustomRoleLimit = defaultCustomRoleLimit;
    }
    
    // Validate and update maxCustomRoleLimit
    if (maxCustomRoleLimit !== undefined) {
      if (typeof maxCustomRoleLimit !== 'number' || maxCustomRoleLimit < 1) {
        return NextResponse.json(
          { error: 'Invalid max custom role limit' },
          { status: 400 }
        );
      }
      updateData.maxCustomRoleLimit = maxCustomRoleLimit;
    }
    
    // Validate and update customRoleLimitsByPlan
    if (customRoleLimitsByPlan !== undefined) {
      if (typeof customRoleLimitsByPlan !== 'object') {
        return NextResponse.json(
          { error: 'Invalid custom role limits by plan' },
          { status: 400 }
        );
      }
      
      // Validate each plan limit
      const validPlans = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
      for (const [plan, limit] of Object.entries(customRoleLimitsByPlan)) {
        if (!validPlans.includes(plan)) {
          return NextResponse.json(
            { error: `Invalid plan: ${plan}` },
            { status: 400 }
          );
        }
        if (typeof limit !== 'number' || limit < 0) {
          return NextResponse.json(
            { error: `Invalid limit for plan ${plan}` },
            { status: 400 }
          );
        }
      }
      
      updateData.customRoleLimitsByPlan = JSON.stringify(customRoleLimitsByPlan);
    }
    
    // Ensure default limit doesn't exceed max limit
    const currentSettings = await prisma.platformSettings.findUnique({
      where: { id: 'global' },
    });
    
    const newDefaultLimit = updateData.defaultCustomRoleLimit ?? currentSettings?.defaultCustomRoleLimit ?? 5;
    const newMaxLimit = updateData.maxCustomRoleLimit ?? currentSettings?.maxCustomRoleLimit ?? 20;
    
    if (newDefaultLimit > newMaxLimit) {
      return NextResponse.json(
        { error: 'Default limit cannot exceed max limit' },
        { status: 400 }
      );
    }
    
    // Update settings
    const updatedSettings = await prisma.platformSettings.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        ...updateData,
      } as {
        id: string;
        updatedById: string;
        defaultCustomRoleLimit?: number;
        maxCustomRoleLimit?: number;
        customRoleLimitsByPlan?: string;
      },
      update: updateData,
      include: {
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    
    // Parse limits by plan
    let limitsByPlan = {};
    try {
      limitsByPlan = JSON.parse(updatedSettings.customRoleLimitsByPlan);
    } catch {
      limitsByPlan = { FREE: 3, BASIC: 5, PRO: 10, ENTERPRISE: 20 };
    }
    
    return NextResponse.json({
      success: true,
      settings: {
        defaultCustomRoleLimit: updatedSettings.defaultCustomRoleLimit,
        maxCustomRoleLimit: updatedSettings.maxCustomRoleLimit,
        customRoleLimitsByPlan: limitsByPlan,
        updatedAt: updatedSettings.updatedAt,
        updatedBy: updatedSettings.updatedBy,
      },
      message: 'Platform settings updated successfully',
    });
    
  } catch (error) {
    console.error('Update platform settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update platform settings' },
      { status: 500 }
    );
  }
}
