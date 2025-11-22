/**
 * CustomerService - Service for managing customers
 * 
 * Provides customer management functionality including CRUD operations,
 * search, and customer statistics tracking.
 * 
 * @module lib/services/customer.service
 */

import { prisma } from '@/lib/prisma';
import { caseInsensitiveStringFilter } from '@/lib/prisma-utils';
import type { Customer, Prisma } from '@prisma/client';

/**
 * Filters for retrieving customers
 */
export interface CustomerFilters {
  storeId: string;
  search?: string;
  acceptsMarketing?: boolean;
  minTotalSpent?: number;
  maxTotalSpent?: number;
  minTotalOrders?: number;
  hasOrders?: boolean;
  page?: number;
  perPage?: number;
  sortBy?: 'createdAt' | 'totalSpent' | 'totalOrders' | 'lastOrderAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated customer results
 */
export interface PaginatedCustomers {
  customers: Customer[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Customer creation data
 */
export interface CreateCustomerData {
  storeId: string;
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptsMarketing?: boolean;
}

/**
 * Customer update data
 */
export interface UpdateCustomerData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
}

/**
 * Service class for customer operations
 */
export class CustomerService {
  private static instance: CustomerService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService();
    }
    return CustomerService.instance;
  }

  /**
   * Create a new customer
   */
  async create(data: CreateCustomerData): Promise<Customer> {
    // Check if customer already exists with this email in the store
    const existing = await prisma.customer.findUnique({
      where: {
        storeId_email: {
          storeId: data.storeId,
          email: data.email,
        },
      },
    });

    if (existing) {
      throw new Error('Customer with this email already exists in this store');
    }

    const customer = await prisma.customer.create({
      data: {
        storeId: data.storeId,
        userId: data.userId || null,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        acceptsMarketing: data.acceptsMarketing || false,
        marketingOptInAt: data.acceptsMarketing ? new Date() : null,
      },
    });

    return customer;
  }

  /**
   * Get customer by ID
   */
  async getById(id: string, storeId: string): Promise<Customer | null> {
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        storeId,
        deletedAt: null,
      },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return customer;
  }

  /**
   * Get customer by email
   */
  async getByEmail(email: string, storeId: string): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({
      where: {
        storeId_email: {
          storeId,
          email,
        },
      },
    });

    return customer;
  }

  /**
   * List customers with filters and pagination
   */
  async list(filters: CustomerFilters): Promise<PaginatedCustomers> {
    const {
      storeId,
      search,
      acceptsMarketing,
      minTotalSpent,
      maxTotalSpent,
      minTotalOrders,
      hasOrders,
      page = 1,
      perPage = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Validate pagination
    if (page < 1) {
      throw new Error('page must be >= 1');
    }
    if (perPage < 1 || perPage > 100) {
      throw new Error('perPage must be between 1 and 100');
    }

    // Build where clause
    const where: Prisma.CustomerWhereInput = {
      storeId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { email: caseInsensitiveStringFilter(search) },
        { firstName: caseInsensitiveStringFilter(search) },
        { lastName: caseInsensitiveStringFilter(search) },
        { phone: caseInsensitiveStringFilter(search) },
      ];
    }

    if (acceptsMarketing !== undefined) {
      where.acceptsMarketing = acceptsMarketing;
    }

    if (minTotalSpent !== undefined) {
      where.totalSpent = {
        ...(typeof where.totalSpent === 'object' ? where.totalSpent : {}),
        gte: minTotalSpent,
      };
    }

    if (maxTotalSpent !== undefined) {
      where.totalSpent = {
        ...(typeof where.totalSpent === 'object' ? where.totalSpent : {}),
        lte: maxTotalSpent,
      };
    }

    if (minTotalOrders !== undefined) {
      where.totalOrders = { gte: minTotalOrders };
    }

    if (hasOrders !== undefined) {
      if (hasOrders) {
        where.totalOrders = { gt: 0 };
      } else {
        where.totalOrders = 0;
      }
    }

    // Execute queries in parallel
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      customers,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  /**
   * Update customer
   */
  async update(id: string, storeId: string, data: UpdateCustomerData): Promise<Customer> {
    // Check customer exists
    const existing = await prisma.customer.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    if (!existing) {
      throw new Error('Customer not found');
    }

    // If email is being updated, check it's not taken
    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.customer.findUnique({
        where: {
          storeId_email: {
            storeId,
            email: data.email,
          },
        },
      });

      if (emailTaken) {
        throw new Error('Email is already in use by another customer');
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        acceptsMarketing: data.acceptsMarketing,
        marketingOptInAt:
          data.acceptsMarketing !== undefined
            ? data.acceptsMarketing
              ? new Date()
              : null
            : undefined,
      },
    });

    return customer;
  }

  /**
   * Delete customer (soft delete)
   */
  async delete(id: string, storeId: string): Promise<void> {
    const customer = await prisma.customer.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Update customer statistics (called after order completion)
   */
  async updateStatistics(customerId: string): Promise<void> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        orders: {
          where: {
            status: { notIn: ['CANCELED'] },
          },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const totalOrders = customer.orders.length;
    const totalSpent = customer.orders.reduce((sum: number, order: { totalAmount: number }) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrderAt =
      totalOrders > 0
        ? customer.orders.sort((a: { createdAt: Date }, b: { createdAt: Date }) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
        : null;

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderAt,
      },
    });
  }
}
