// src/lib/services/discount.service.ts
// Discount Code Service - Handles coupon code validation and application

import { prisma } from '@/lib/prisma';
import { DiscountType } from '@prisma/client';

/**
 * Result of discount code validation
 */
export interface DiscountValidationResult {
  valid: boolean;
  error?: string;
  discount?: {
    id: string;
    code: string;
    type: DiscountType;
    value: number;
    minOrderAmount: number | null;
    maxDiscountAmount: number | null;
    name: string;
    description: string | null;
  };
}

/**
 * Result of discount code application
 */
export interface DiscountApplicationResult {
  valid: boolean;
  error?: string;
  discountAmount: number;
  originalTotal: number;
  discountedTotal: number;
  discount?: {
    code: string;
    type: DiscountType;
    value: number;
    description: string | null;
  };
}

/**
 * Discount Code Service
 * Handles validation, application, and usage tracking of discount codes
 */
export class DiscountService {
  private static instance: DiscountService;

  private constructor() {}

  public static getInstance(): DiscountService {
    if (!DiscountService.instance) {
      DiscountService.instance = new DiscountService();
    }
    return DiscountService.instance;
  }

  /**
   * Validate a discount code for a specific store and order
   * @param storeId - Store ID
   * @param code - Discount code to validate
   * @param orderSubtotal - Order subtotal for minimum order check
   * @param customerEmail - Optional customer email for targeted discounts
   * @returns Validation result with discount details if valid
   */
  async validateCode(
    storeId: string,
    code: string,
    orderSubtotal: number,
    customerEmail?: string
  ): Promise<DiscountValidationResult> {
    const normalizedCode = code.trim().toUpperCase();

    // Find the discount code
    const discount = await prisma.discountCode.findUnique({
      where: {
        storeId_code: {
          storeId,
          code: normalizedCode,
        },
      },
    });

    // Check if code exists
    if (!discount) {
      return {
        valid: false,
        error: 'Invalid discount code',
      };
    }

    // Check if code is active
    if (!discount.isActive || discount.deletedAt) {
      return {
        valid: false,
        error: 'This discount code is no longer active',
      };
    }

    // Check validity period
    const now = new Date();
    if (discount.startsAt > now) {
      return {
        valid: false,
        error: 'This discount code is not yet active',
      };
    }

    if (discount.expiresAt && discount.expiresAt < now) {
      return {
        valid: false,
        error: 'This discount code has expired',
      };
    }

    // Check max uses
    if (discount.maxUses !== null && discount.currentUses >= discount.maxUses) {
      return {
        valid: false,
        error: 'This discount code has reached its usage limit',
      };
    }

    // Check minimum order amount
    if (discount.minOrderAmount !== null && orderSubtotal < discount.minOrderAmount) {
      return {
        valid: false,
        error: `Minimum order amount of $${discount.minOrderAmount.toFixed(2)} required for this code`,
      };
    }

    // Check customer-specific targeting
    if (discount.customerEmails) {
      try {
        const targetedEmails: string[] = JSON.parse(discount.customerEmails);
        if (targetedEmails.length > 0) {
          if (!customerEmail || !targetedEmails.includes(customerEmail.toLowerCase())) {
            return {
              valid: false,
              error: 'This discount code is not valid for your account',
            };
          }
        }
      } catch {
        // If JSON parsing fails, ignore customer targeting
      }
    }

    // Check per-customer usage limit
    if (customerEmail && discount.maxUsesPerCustomer > 0) {
      const customerUsageCount = await this.getCustomerUsageCount(
        storeId,
        normalizedCode,
        customerEmail
      );
      
      if (customerUsageCount >= discount.maxUsesPerCustomer) {
        return {
          valid: false,
          error: 'You have already used this discount code the maximum number of times',
        };
      }
    }

    // Code is valid
    return {
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        minOrderAmount: discount.minOrderAmount,
        maxDiscountAmount: discount.maxDiscountAmount,
        name: discount.name,
        description: discount.description,
      },
    };
  }

  /**
   * Calculate discount amount for an order
   * @param storeId - Store ID
   * @param code - Discount code
   * @param orderSubtotal - Order subtotal
   * @param shippingAmount - Shipping amount (for FREE_SHIPPING type)
   * @param customerEmail - Optional customer email
   * @returns Discount application result with calculated amounts
   */
  async applyCode(
    storeId: string,
    code: string,
    orderSubtotal: number,
    shippingAmount: number = 0,
    customerEmail?: string
  ): Promise<DiscountApplicationResult> {
    // First validate the code
    const validation = await this.validateCode(storeId, code, orderSubtotal, customerEmail);

    if (!validation.valid || !validation.discount) {
      return {
        valid: false,
        error: validation.error,
        discountAmount: 0,
        originalTotal: orderSubtotal + shippingAmount,
        discountedTotal: orderSubtotal + shippingAmount,
      };
    }

    const { discount } = validation;
    let discountAmount = 0;

    // Calculate discount based on type
    switch (discount.type) {
      case DiscountType.PERCENTAGE:
        discountAmount = (orderSubtotal * discount.value) / 100;
        // Apply max discount cap if set
        if (discount.maxDiscountAmount !== null) {
          discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
        }
        break;

      case DiscountType.FIXED:
        discountAmount = Math.min(discount.value, orderSubtotal);
        break;

      case DiscountType.FREE_SHIPPING:
        discountAmount = shippingAmount;
        break;

      default:
        discountAmount = 0;
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;

    const originalTotal = orderSubtotal + shippingAmount;
    const discountedTotal = Math.max(0, originalTotal - discountAmount);

    return {
      valid: true,
      discountAmount,
      originalTotal,
      discountedTotal,
      discount: {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        description: discount.description,
      },
    };
  }

  /**
   * Increment usage count for a discount code (call after successful order)
   * @param storeId - Store ID
   * @param code - Discount code
   */
  async incrementUsage(storeId: string, code: string): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();

    await prisma.discountCode.update({
      where: {
        storeId_code: {
          storeId,
          code: normalizedCode,
        },
      },
      data: {
        currentUses: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get customer usage count for a discount code
   * This counts orders where the customer used this discount code
   */
  private async getCustomerUsageCount(
    storeId: string,
    code: string,
    customerEmail: string
  ): Promise<number> {
    const count = await prisma.order.count({
      where: {
        storeId,
        discountCode: code,
        customer: {
          email: customerEmail,
        },
        deletedAt: null,
      },
    });

    return count;
  }

  /**
   * Create a new discount code
   */
  async createDiscountCode(data: {
    storeId: string;
    code: string;
    name: string;
    description?: string;
    type: DiscountType;
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    maxUses?: number;
    maxUsesPerCustomer?: number;
    startsAt?: Date;
    expiresAt?: Date;
    isActive?: boolean;
  }) {
    return prisma.discountCode.create({
      data: {
        storeId: data.storeId,
        code: data.code.trim().toUpperCase(),
        name: data.name,
        description: data.description,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount,
        maxDiscountAmount: data.maxDiscountAmount,
        maxUses: data.maxUses,
        maxUsesPerCustomer: data.maxUsesPerCustomer ?? 1,
        startsAt: data.startsAt ?? new Date(),
        expiresAt: data.expiresAt,
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * List discount codes for a store
   */
  async listDiscountCodes(
    storeId: string,
    options?: {
      includeExpired?: boolean;
      includeInactive?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: {
      storeId: string;
      deletedAt: null;
      isActive?: boolean;
      OR?: Array<{ expiresAt: null } | { expiresAt: { gte: Date } }>;
    } = {
      storeId,
      deletedAt: null,
    };

    if (!options?.includeInactive) {
      where.isActive = true;
    }

    if (!options?.includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ];
    }

    const [codes, total] = await Promise.all([
      prisma.discountCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      prisma.discountCode.count({ where }),
    ]);

    return { codes, total };
  }
}

// Export singleton instance
export const discountService = DiscountService.getInstance();
