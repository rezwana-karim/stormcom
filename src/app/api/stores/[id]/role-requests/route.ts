/**
 * Store Role Requests API
 * 
 * GET  /api/stores/[id]/role-requests - Get store's custom role requests
 * POST /api/stores/[id]/role-requests - Submit new custom role request
 * 
 * These endpoints allow store owners/admins to manage custom role requests
 * for their store.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { validatePermissions } from '@/lib/custom-role-permissions';

// Validation schema for creating role request
const createRoleRequestSchema = z.object({
  roleName: z.string()
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  roleDescription: z.string().max(500).optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  justification: z.string().max(1000).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Type for request with relations
interface RoleRequestWithRelations {
  id: string;
  userId: string;
  storeId: string;
  roleName: string;
  roleDescription: string | null;
  permissions: string;
  justification: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  adminNotes: string | null;
  modifiedPermissions: string | null;
  customRoleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string | null; email: string | null };
  reviewer: { id: string; name: string | null; email: string | null } | null;
  customRole: { id: string; name: string; isActive: boolean } | null;
}

// Type for custom role with count
interface CustomRoleWithCount {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  permissions: string;
  isActive: boolean;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { staffAssignments: number };
}

/**
 * GET /api/stores/[id]/role-requests
 * 
 * Get all custom role requests for a store
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id: storeId } = await context.params;
    
    // Check user has access to this store
    const hasAccess = await checkStoreAccess(session.user.id, storeId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this store' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Build where clause
    const whereClause: Record<string, unknown> = { storeId };
    if (status) {
      whereClause.status = status;
    }
    
    // Get role requests
    const [requests, counts] = await Promise.all([
      prisma.customRoleRequest.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          reviewer: {
            select: { id: true, name: true, email: true },
          },
          customRole: {
            select: { id: true, name: true, isActive: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customRoleRequest.groupBy({
        by: ['status'],
        where: { storeId },
        _count: true,
      }),
    ]);
    
    // Get approved custom roles for this store
    const customRoles = await prisma.customRole.findMany({
      where: { storeId, isActive: true },
      include: {
        _count: {
          select: { staffAssignments: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    
    // Format counts with proper type safety
    type StatusType = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'INFO_REQUESTED';
    type GroupByResult = { status: StatusType; _count: number };
    const statusCounts: Record<StatusType, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CANCELLED: 0,
      INFO_REQUESTED: 0,
    };
    (counts as GroupByResult[]).forEach((c) => {
      statusCounts[c.status] = c._count;
    });
    
    return NextResponse.json({
      requests: (requests as RoleRequestWithRelations[]).map((r: RoleRequestWithRelations) => ({
        ...r,
        permissions: JSON.parse(r.permissions),
        modifiedPermissions: r.modifiedPermissions ? JSON.parse(r.modifiedPermissions) : null,
      })),
      customRoles: (customRoles as CustomRoleWithCount[]).map((role: CustomRoleWithCount) => ({
        ...role,
        permissions: JSON.parse(role.permissions),
        staffCount: role._count.staffAssignments,
      })),
      counts: statusCounts,
    });
    
  } catch (error) {
    console.error('Get role requests error:', error);
    return NextResponse.json(
      { error: 'Failed to get role requests' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stores/[id]/role-requests
 * 
 * Submit a new custom role request
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id: storeId } = await context.params;
    
    // Check user has Store Admin access
    const hasAdminAccess = await checkStoreAdminAccess(session.user.id, storeId);
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Store Admin access required to create custom roles' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = createRoleRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { roleName, roleDescription, permissions, justification } = validation.data;
    
    // Validate permissions are allowed
    const permissionValidation = validatePermissions(permissions);
    if (!permissionValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid permissions', 
          details: permissionValidation.errors,
          invalidPermissions: permissionValidation.invalidPermissions,
        },
        { status: 400 }
      );
    }
    
    // Check for duplicate role name
    const existingRole = await prisma.customRole.findUnique({
      where: {
        storeId_name: { storeId, name: roleName },
      },
    });
    
    if (existingRole) {
      return NextResponse.json(
        { error: 'A custom role with this name already exists' },
        { status: 400 }
      );
    }
    
    // Check for pending request with same name
    const pendingRequest = await prisma.customRoleRequest.findFirst({
      where: {
        storeId,
        roleName,
        status: { in: ['PENDING', 'INFO_REQUESTED'] },
      },
    });
    
    if (pendingRequest) {
      return NextResponse.json(
        { error: 'A pending request for this role name already exists' },
        { status: 400 }
      );
    }
    
    // Check rate limits (max 5 pending requests per store)
    const pendingCount = await prisma.customRoleRequest.count({
      where: {
        storeId,
        status: { in: ['PENDING', 'INFO_REQUESTED'] },
      },
    });
    
    if (pendingCount >= 5) {
      return NextResponse.json(
        { error: 'Maximum pending role requests reached (5). Please wait for existing requests to be processed.' },
        { status: 429 }
      );
    }
    
    // Create the role request
    const roleRequest = await prisma.customRoleRequest.create({
      data: {
        userId: session.user.id,
        storeId,
        roleName,
        roleDescription,
        permissions: JSON.stringify(permissions),
        justification,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        store: {
          select: { name: true },
        },
      },
    });
    
    // Notify all Super Admins
    const superAdmins = await prisma.user.findMany({
      where: { isSuperAdmin: true },
      select: { id: true },
    });
    
    await prisma.notification.createMany({
      data: superAdmins.map(admin => ({
        userId: admin.id,
        type: 'ROLE_REQUEST_PENDING',
        title: 'New Custom Role Request',
        message: `${roleRequest.user.name || roleRequest.user.email} from "${roleRequest.store.name}" has requested a new custom role: "${roleName}"`,
        actionUrl: '/admin/roles/requests',
        actionLabel: 'Review Request',
      })),
    });
    
    // Log platform activity
    await prisma.platformActivity.create({
      data: {
        actorId: session.user.id,
        storeId,
        action: 'ROLE_REQUEST_CREATED',
        entityType: 'CustomRoleRequest',
        entityId: roleRequest.id,
        description: `Requested custom role "${roleName}" for store "${roleRequest.store.name}"`,
      },
    });
    
    return NextResponse.json({
      request: {
        ...roleRequest,
        permissions,
      },
      message: 'Custom role request submitted successfully. Awaiting Super Admin approval.',
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create role request error:', error);
    return NextResponse.json(
      { error: 'Failed to create role request' },
      { status: 500 }
    );
  }
}

/**
 * Check if user has any access to the store
 */
async function checkStoreAccess(userId: string, storeId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      storeStaff: {
        where: { storeId, isActive: true },
        select: { id: true },
      },
      memberships: {
        where: {
          organization: { store: { id: storeId } },
        },
        select: { id: true },
      },
    },
  });
  
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.storeStaff.length > 0) return true;
  if (user.memberships.length > 0) return true;
  
  return false;
}

/**
 * Check if user has Store Admin access (can create custom roles)
 */
async function checkStoreAdminAccess(userId: string, storeId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      storeStaff: {
        where: { 
          storeId, 
          isActive: true,
          role: 'STORE_ADMIN',
        },
        select: { id: true },
      },
      memberships: {
        where: {
          organization: { store: { id: storeId } },
          role: { in: ['OWNER', 'ADMIN'] },
        },
        select: { id: true },
      },
    },
  });
  
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (user.storeStaff.length > 0) return true;
  if (user.memberships.length > 0) return true;
  
  return false;
}
