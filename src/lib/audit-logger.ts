/**
 * Audit Logger - Track all permission checks, denials, and system actions
 * 
 * This module provides comprehensive audit logging for security and compliance.
 * All permission checks and denials are logged with full context.
 */

import { prisma } from '@/lib/prisma';
import { Role, Prisma } from '@prisma/client';
import { headers } from 'next/headers';

export type AuditAction = 
  | 'CREATE' 
  | 'READ' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'PERMISSION_CHECK' 
  | 'PERMISSION_DENIED'
  | 'LOGIN'
  | 'LOGOUT'
  | 'RATE_LIMIT_HIT';

export type EntityType = 
  | 'Permission'
  | 'User' 
  | 'Organization' 
  | 'Store' 
  | 'Product' 
  | 'Order' 
  | 'Customer'
  | 'Category'
  | 'Brand'
  | 'Inventory'
  | 'RateLimit';

export interface AuditLogData {
  userId?: string;
  storeId?: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  permission?: string;
  role?: Role | string;
  allowed?: boolean;
  changes?: Record<string, { old: unknown; new: unknown }>;
  endpoint?: string;
  method?: string;
}

/**
 * Get request metadata (IP, user agent, etc.)
 */
async function getRequestMetadata() {
  try {
    const headersList = await headers();
    return {
      ipAddress: headersList.get('x-forwarded-for') || 
                 headersList.get('x-real-ip') || 
                 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    };
  } catch {
    // Headers not available (non-request context)
    return {
      ipAddress: 'system',
      userAgent: 'system',
    };
  }
}

/**
 * Log an audit event
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const metadata = await getRequestMetadata();
    
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        storeId: data.storeId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        permission: data.permission,
        role: data.role,
        allowed: data.allowed !== undefined ? (data.allowed ? 1 : 0) : null,
        changes: data.changes ? JSON.stringify(data.changes) : null,
        endpoint: data.endpoint,
        method: data.method,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });
  } catch (error) {
    // Don't throw - audit logging failure shouldn't break app
    console.error('Audit logging failed:', error);
  }
}

/**
 * Log a permission check
 */
export async function logPermissionCheck(
  userId: string,
  permission: string,
  role: Role | string,
  allowed: boolean,
  context?: {
    storeId?: string;
    endpoint?: string;
    method?: string;
  }
): Promise<void> {
  await logAudit({
    userId,
    storeId: context?.storeId,
    action: allowed ? 'PERMISSION_CHECK' : 'PERMISSION_DENIED',
    entityType: 'Permission',
    entityId: permission,
    permission,
    role,
    allowed,
    endpoint: context?.endpoint,
    method: context?.method,
  });
}

/**
 * Log a permission denial (convenience function)
 */
export async function logPermissionDenied(
  userId: string,
  permission: string,
  role: Role | string,
  context?: {
    storeId?: string;
    endpoint?: string;
    method?: string;
  }
): Promise<void> {
  await logPermissionCheck(userId, permission, role, false, context);
}

/**
 * Log entity creation
 */
export async function logCreate(
  entityType: EntityType,
  entityId: string,
  userId?: string,
  storeId?: string,
  data?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    userId,
    storeId,
    action: 'CREATE',
    entityType,
    entityId,
    changes: data ? { created: { old: null, new: data } } : undefined,
  });
}

/**
 * Log entity update
 */
export async function logUpdate(
  entityType: EntityType,
  entityId: string,
  changes: Record<string, { old: unknown; new: unknown }>,
  userId?: string,
  storeId?: string
): Promise<void> {
  await logAudit({
    userId,
    storeId,
    action: 'UPDATE',
    entityType,
    entityId,
    changes,
  });
}

/**
 * Log entity deletion
 */
export async function logDelete(
  entityType: EntityType,
  entityId: string,
  userId?: string,
  storeId?: string
): Promise<void> {
  await logAudit({
    userId,
    storeId,
    action: 'DELETE',
    entityType,
    entityId,
  });
}

/**
 * Log rate limit hit
 */
export async function logRateLimitHit(
  identifier: string,
  endpoint: string,
  role?: string
): Promise<void> {
  await logAudit({
    userId: identifier.startsWith('user:') ? identifier.replace('user:', '') : undefined,
    action: 'RATE_LIMIT_HIT',
    entityType: 'RateLimit',
    entityId: `${identifier}:${endpoint}`,
    endpoint,
    role,
  });
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  storeId?: string;
  action?: AuditAction;
  entityType?: EntityType;
  permission?: string;
  allowed?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 50, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.storeId) where.storeId = filters.storeId;
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.permission) where.permission = filters.permission;
  if (filters.allowed !== undefined) where.allowed = filters.allowed ? 1 : 0;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map(log => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get audit statistics
 */
export async function getAuditStats(filters?: {
  userId?: string;
  storeId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters?.userId) where.userId = filters.userId;
  if (filters?.storeId) where.storeId = filters.storeId;

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const [
    totalLogs,
    permissionChecks,
    permissionDenials,
    actionCounts,
    entityCounts,
  ] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({
      where: { ...where, action: 'PERMISSION_CHECK', allowed: 1 },
    }),
    prisma.auditLog.count({
      where: { ...where, action: 'PERMISSION_DENIED', allowed: 0 },
    }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
    }),
    prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: true,
    }),
  ]);

  return {
    totalLogs,
    permissionChecks,
    permissionDenials,
    denialRate: permissionChecks + permissionDenials > 0
      ? (permissionDenials / (permissionChecks + permissionDenials)) * 100
      : 0,
    actionCounts: actionCounts.reduce((acc, { action, _count }) => {
      acc[action] = _count;
      return acc;
    }, {} as Record<string, number>),
    entityCounts: entityCounts.reduce((acc, { entityType, _count }) => {
      acc[entityType] = _count;
      return acc;
    }, {} as Record<string, number>),
  };
}

/**
 * Clean up old audit logs (retention policy)
 */
export async function cleanupAuditLogs(retentionDays: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}
