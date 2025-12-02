// src/lib/services/store.service.ts
// Store Management Service
// Handles store creation, updates, and multi-tenant store operations

import { prisma } from '@/lib/prisma';
import { caseInsensitiveStringFilter } from '@/lib/prisma-utils';
import { Prisma, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { z } from 'zod';

/**
 * Store creation input schema
 */
export const CreateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('US'),
  currency: z.string().default('USD'),
  timezone: z.string().default('UTC'),
  locale: z.string().default('en'),
  subscriptionPlan: z.nativeEnum(SubscriptionPlan).default(SubscriptionPlan.FREE),
  organizationId: z.string().optional(), // Optional - will be derived from session if not provided
});

export type CreateStoreInput = z.infer<typeof CreateStoreSchema>;

/**
 * Store update input schema
 */
export const UpdateStoreSchema = CreateStoreSchema.partial().omit({ organizationId: true });
export type UpdateStoreInput = z.infer<typeof UpdateStoreSchema>;

/**
 * Store list query options
 */
export interface ListStoresOptions {
  page?: number;
  limit?: number;
  search?: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Store list result
 */
export interface StoreListResult {
  stores: Array<{
    id: string;
    name: string;
    slug: string;
    email: string;
    phone: string | null;
    address: string | null;
    currency: string;
    timezone: string;
    subscriptionPlan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
      products: number;
      orders: number;
      customers: number;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class StoreService {
  private static instance: StoreService;

  private constructor() {}

  static getInstance(): StoreService {
    if (!StoreService.instance) {
      StoreService.instance = new StoreService();
    }
    return StoreService.instance;
  }

  /**
   * Create a new store
   */
  async create(input: CreateStoreInput, userId: string) {
    // Validate slug uniqueness
    const existingStore = await prisma.store.findUnique({
      where: { slug: input.slug },
    });

    if (existingStore) {
      throw new Error(`Store with slug '${input.slug}' already exists`);
    }

    // Destructure to separate organizationId from other fields
    const { organizationId, ...storeData } = input;

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true },
    });

    // If no organizationId provided, create one (for super admins)
    let finalOrganizationId = organizationId;
    if (!finalOrganizationId) {
      if (!user?.isSuperAdmin) {
        throw new Error('organizationId is required to create a store');
      }
      
      // Auto-create organization for the store with unique slug
      let orgSlug = `${input.slug}-org`;
      const orgName = `${input.name} Organization`;
      
      // Check if organization slug already exists
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: orgSlug },
      });
      
      if (existingOrg) {
        // Add timestamp suffix to make it unique
        orgSlug = `${input.slug}-org-${Date.now()}`;
      }
      
      const organization = await prisma.organization.create({
        data: {
          name: orgName,
          slug: orgSlug,
          memberships: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
      });
      finalOrganizationId = organization.id;
    }

    const store = await prisma.store.create({
      data: {
        ...storeData,
        organizationId: finalOrganizationId,
        subscriptionStatus: SubscriptionStatus.TRIAL,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      },
      include: {
        organization: true,
      },
    });

    return store;
  }

  /**
   * Get store by ID
   */
  async getById(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId, deletedAt: null },
      include: {
        organization: true,
        _count: {
          select: {
            products: true,
            orders: true,
            customers: true,
          },
        },
      },
    });

    if (!store) {
      throw new Error('Store not found');
    }

    return store;
  }

  /**
   * Get store by slug
   */
  async getBySlug(slug: string) {
    const store = await prisma.store.findUnique({
      where: { slug, deletedAt: null },
      include: {
        organization: true,
        _count: {
          select: {
            products: true,
            orders: true,
            customers: true,
          },
        },
      },
    });

    if (!store) {
      throw new Error('Store not found');
    }

    return store;
  }

  /**
   * List stores with filters and pagination
   */
  async list(
    options: ListStoresOptions = {},
    userId?: string,
    userRole?: string,
    userStoreId?: string,
    userOrganizationId?: string
  ): Promise<StoreListResult> {
    const {
      page = 1,
      limit = 20,
      search,
      subscriptionPlan,
      subscriptionStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Build where clause
    const where: Prisma.StoreWhereInput = {
      deletedAt: null,
    };

    // Role-based filtering
    if (userRole !== 'SUPER_ADMIN') {
      // Organization-level roles (OWNER, ADMIN, MEMBER, VIEWER) - filter by organizationId
      if (userOrganizationId && ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(userRole || '')) {
        where.organizationId = userOrganizationId;
      }
      // Store-level roles (STORE_ADMIN, SALES_MANAGER, etc.) - filter by storeId
      else if (userStoreId) {
        where.id = userStoreId;
      }
    }

    if (search) {
      where.OR = [
        { name: caseInsensitiveStringFilter(search) },
        { slug: caseInsensitiveStringFilter(search) },
        { email: caseInsensitiveStringFilter(search) },
      ];
    }

    if (subscriptionPlan) {
      where.subscriptionPlan = subscriptionPlan;
    }

    if (subscriptionStatus) {
      where.subscriptionStatus = subscriptionStatus;
    }

    // Get total count
    const total = await prisma.store.count({ where });

    // Get paginated stores
    const stores = await prisma.store.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
            customers: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      stores: stores.map(store => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        email: store.email,
        phone: store.phone,
        address: store.address,
        currency: store.currency,
        timezone: store.timezone,
        subscriptionPlan: store.subscriptionPlan,
        subscriptionStatus: store.subscriptionStatus,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
        _count: store._count,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Update store
   */
  async update(storeId: string, input: UpdateStoreInput) {
    // If slug is being updated, check uniqueness
    if (input.slug) {
      const existingStore = await prisma.store.findFirst({
        where: {
          slug: input.slug,
          id: { not: storeId },
          deletedAt: null,
        },
      });

      if (existingStore) {
        throw new Error(`Store with slug '${input.slug}' already exists`);
      }
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data: input,
      include: {
        organization: true,
      },
    });

    return store;
  }

  /**
   * Delete store (soft delete)
   */
  async delete(storeId: string) {
    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        deletedAt: new Date(),
      },
    });

    return store;
  }

  /**
   * Validate slug availability
   */
  async validateSlug(slug: string, excludeStoreId?: string): Promise<boolean> {
    const where: Prisma.StoreWhereInput = {
      slug,
      deletedAt: null,
    };

    if (excludeStoreId) {
      where.id = { not: excludeStoreId };
    }

    const existingStore = await prisma.store.findFirst({ where });
    return !existingStore;
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    storeId: string,
    plan: SubscriptionPlan,
    status: SubscriptionStatus
  ) {
    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: status,
        subscriptionEndsAt: status === SubscriptionStatus.ACTIVE 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          : undefined,
      },
    });

    return store;
  }
}
