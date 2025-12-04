/**
 * Base Service Class
 * 
 * Provides common CRUD operations and patterns for all services.
 * Reduces code duplication and ensures consistent behavior.
 */

import { prisma } from '@/lib/prisma';

/**
 * Common pagination parameters
 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
}

/**
 * Common sort parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Common filter parameters
 */
export interface BaseFilters extends PaginationParams, SortParams {
  search?: string;
  storeId?: string;
}

/**
 * Paginated result interface
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Base Service with common CRUD operations
 */
export abstract class BaseService<T = unknown> {
  protected abstract modelName: string;
  protected defaultPerPage = 20;
  protected maxPerPage = 100;

  /**
   * Get Prisma model delegate
   */
  protected get model() {
    return (prisma as any)[this.modelName];
  }

  /**
   * Calculate pagination values
   */
  protected calculatePagination(
    page: number = 1,
    perPage: number = this.defaultPerPage
  ) {
    const validPage = Math.max(1, page);
    const validPerPage = Math.min(
      Math.max(1, perPage),
      this.maxPerPage
    );

    return {
      page: validPage,
      perPage: validPerPage,
      skip: (validPage - 1) * validPerPage,
      take: validPerPage,
    };
  }

  /**
   * Build paginated result
   */
  protected buildPaginatedResult<R = T>(
    items: R[],
    total: number,
    page: number,
    perPage: number
  ): PaginatedResult<R> {
    return {
      items,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Build search filter for text fields
   */
  protected buildSearchFilter(search?: string, fields: string[] = ['name']) {
    if (!search) return {};

    return {
      OR: fields.map(field => ({
        [field]: {
          contains: search,
          mode: 'insensitive' as const,
        },
      })),
    };
  }

  /**
   * Generic find by ID
   */
  async findById(id: string, include?: Record<string, unknown>) {
    return this.model.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Generic find by slug
   */
  async findBySlug(slug: string, include?: Record<string, unknown>) {
    return this.model.findUnique({
      where: { slug },
      include,
    });
  }

  /**
   * Generic delete by ID
   */
  async delete(id: string) {
    return this.model.delete({
      where: { id },
    });
  }

  /**
   * Check if record exists
   */
  async exists(where: Record<string, unknown>): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }

  /**
   * Soft delete (if model has isDeleted field)
   */
  async softDelete(id: string) {
    return this.model.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  /**
   * Restore soft deleted record
   */
  async restore(id: string) {
    return this.model.update({
      where: { id },
      data: { isDeleted: false },
    });
  }

  /**
   * Count records with filters
   */
  async count(where: Record<string, unknown> = {}) {
    return this.model.count({ where });
  }
}

/**
 * Service error class for consistent error handling
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string = 'SERVICE_ERROR',
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends ServiceError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

/**
 * Validation error
 */
export class ValidationError extends ServiceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

/**
 * Conflict error (duplicate, etc.)
 */
export class ConflictError extends ServiceError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}
