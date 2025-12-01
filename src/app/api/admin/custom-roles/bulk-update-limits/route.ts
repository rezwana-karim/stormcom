/**
 * Bulk Update Store Custom Role Limits API
 * 
 * POST /api/admin/custom-roles/bulk-update-limits - Bulk update limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CustomRoleAction, SubscriptionPlan } from '@prisma/client';

/**
 * POST /api/admin/custom-roles/bulk-update-limits
 * Bulk update store custom role limits
 */
export async function POST(request: NextRequest) {
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
    const { applyPlanDefaults, storeIds, limit } = body;
    
    // Get platform settings for limits
    const platformSettings = await prisma.platformSettings.findUnique({
      where: { id: 'global' },
      select: { 
        customRoleLimitsByPlan: true,
        maxCustomRoleLimit: true,
      },
    });
    
    const maxAllowed = platformSettings?.maxCustomRoleLimit || 20;
    let limitsByPlan: Record<string, number> = { FREE: 3, BASIC: 5, PRO: 10, ENTERPRISE: 20 };
    
    try {
      if (platformSettings?.customRoleLimitsByPlan) {
        limitsByPlan = JSON.parse(platformSettings.customRoleLimitsByPlan);
      }
    } catch {
      // Use defaults
    }
    
    const results: Array<{
      storeId: string;
      storeName: string;
      previousLimit: number;
      newLimit: number;
      success: boolean;
      error?: string;
    }> = [];
    
    if (applyPlanDefaults) {
      // Apply limits based on subscription plan
      const stores = await prisma.store.findMany({
        select: {
          id: true,
          name: true,
          subscriptionPlan: true,
          customRoleLimit: true,
          _count: {
            select: { customRoles: true },
          },
        },
      });
      
      for (const store of stores) {
        const planLimit = limitsByPlan[store.subscriptionPlan] || 5;
        const newLimit = Math.min(planLimit, maxAllowed);
        
        // Skip if new limit is below current usage
        if (newLimit < store._count.customRoles) {
          results.push({
            storeId: store.id,
            storeName: store.name,
            previousLimit: store.customRoleLimit,
            newLimit: store.customRoleLimit, // unchanged
            success: false,
            error: `Cannot reduce limit below current usage (${store._count.customRoles} roles)`,
          });
          continue;
        }
        
        // Skip if limit unchanged
        if (newLimit === store.customRoleLimit) {
          continue;
        }
        
        // Update limit
        await prisma.store.update({
          where: { id: store.id },
          data: { customRoleLimit: newLimit },
        });
        
        // Log activity
        await prisma.customRoleActivity.create({
          data: {
            action: CustomRoleAction.LIMIT_CHANGED,
            actorId: session.user.id,
            storeId: store.id,
            roleName: 'N/A',
            details: JSON.stringify({
              previousLimit: store.customRoleLimit,
              newLimit,
              reason: `Bulk update: Applied ${store.subscriptionPlan} plan default`,
              changedBy: 'Super Admin (Bulk)',
            }),
            previousValue: String(store.customRoleLimit),
            newValue: String(newLimit),
          },
        });
        
        results.push({
          storeId: store.id,
          storeName: store.name,
          previousLimit: store.customRoleLimit,
          newLimit,
          success: true,
        });
      }
      
    } else if (storeIds && Array.isArray(storeIds) && typeof limit === 'number') {
      // Update specific stores with specific limit
      if (limit < 0 || limit > maxAllowed) {
        return NextResponse.json(
          { 
            error: 'Invalid limit value',
            message: `Limit must be between 0 and ${maxAllowed}`,
          },
          { status: 400 }
        );
      }
      
      const stores = await prisma.store.findMany({
        where: { id: { in: storeIds } },
        select: {
          id: true,
          name: true,
          customRoleLimit: true,
          _count: {
            select: { customRoles: true },
          },
        },
      });
      
      for (const store of stores) {
        // Skip if new limit is below current usage
        if (limit < store._count.customRoles) {
          results.push({
            storeId: store.id,
            storeName: store.name,
            previousLimit: store.customRoleLimit,
            newLimit: store.customRoleLimit, // unchanged
            success: false,
            error: `Cannot reduce limit below current usage (${store._count.customRoles} roles)`,
          });
          continue;
        }
        
        // Skip if limit unchanged
        if (limit === store.customRoleLimit) {
          continue;
        }
        
        // Update limit
        await prisma.store.update({
          where: { id: store.id },
          data: { customRoleLimit: limit },
        });
        
        // Log activity
        await prisma.customRoleActivity.create({
          data: {
            action: CustomRoleAction.LIMIT_CHANGED,
            actorId: session.user.id,
            storeId: store.id,
            roleName: 'N/A',
            details: JSON.stringify({
              previousLimit: store.customRoleLimit,
              newLimit: limit,
              reason: 'Bulk update: Set specific limit',
              changedBy: 'Super Admin (Bulk)',
            }),
            previousValue: String(store.customRoleLimit),
            newValue: String(limit),
          },
        });
        
        results.push({
          storeId: store.id,
          storeName: store.name,
          previousLimit: store.customRoleLimit,
          newLimit: limit,
          success: true,
        });
      }
      
    } else {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: 'Provide either applyPlanDefaults=true or storeIds[] and limit',
        },
        { status: 400 }
      );
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    return NextResponse.json({
      success: true,
      updated: successCount,
      failed: failCount,
      results,
      message: `Updated ${successCount} stores${failCount > 0 ? `, ${failCount} failed` : ''}`,
    });
    
  } catch (error) {
    console.error('Bulk update limits error:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update limits' },
      { status: 500 }
    );
  }
}
