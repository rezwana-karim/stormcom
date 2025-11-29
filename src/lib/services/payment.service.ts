/**
 * PaymentService - State machine for payment attempts and transactions
 *
 * Provides atomic, auditable payment flows with:
 * - Idempotent payment attempt creation
 * - State machine transitions with validation
 * - Double-capture prevention (409 conflict)
 * - Refund tracking with amount validation
 * - Reconciliation for stuck payments
 *
 * State Machine Rules:
 * - INITIATED → AUTHORIZING → AUTHORIZED → CAPTURED
 * - AUTHORIZED → VOID (cancel before capture)
 * - CAPTURED → REFUND (multi-refund allowed up to captured amount)
 * - Any → FAILED (terminal state)
 *
 * @module lib/services/payment.service
 */

import { prisma } from '@/lib/prisma';
import {
  PaymentAttemptStatus,
  PaymentTransactionType,
  Prisma,
} from '@prisma/client';
import { z } from 'zod';
import { AuditLogService } from './audit-log.service';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum time (in minutes) an attempt can stay in AUTHORIZING before flagged */
const AUTHORIZING_TIMEOUT_MINUTES = 15;

/** Supported payment providers */
export const PAYMENT_PROVIDERS = ['stripe', 'bkash', 'cod'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for creating a new payment attempt
 */
export const createPaymentAttemptSchema = z.object({
  storeId: z.string().cuid(),
  orderId: z.string().cuid(),
  provider: z.enum(['stripe', 'bkash', 'cod']),
  amount: z.number().int().positive('Amount must be positive (minor units)'),
  currency: z.string().length(3, 'Currency must be ISO 4217 code (3 chars)').transform(c => c.toUpperCase()),
  idempotencyKey: z.string().min(1).max(128).optional(),
  providerReference: z.string().optional(),
});

/**
 * Schema for starting authorization
 */
export const startAuthorizationSchema = z.object({
  attemptId: z.string().cuid(),
  storeId: z.string().cuid(),
  providerReference: z.string().optional(),
});

/**
 * Schema for completing authorization
 */
export const completeAuthorizationSchema = z.object({
  attemptId: z.string().cuid(),
  storeId: z.string().cuid(),
  providerReference: z.string().optional(),
});

/**
 * Schema for authorization failure
 */
export const failAuthorizationSchema = z.object({
  attemptId: z.string().cuid(),
  storeId: z.string().cuid(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  scheduleRetry: z.boolean().default(false),
  retryDelayMinutes: z.number().int().positive().optional(),
});

/**
 * Schema for capturing a payment
 */
export const capturePaymentSchema = z.object({
  attemptId: z.string().cuid(),
  storeId: z.string().cuid(),
  amount: z.number().int().positive().optional(), // Optional: capture less than authorized
  providerReference: z.string().optional(),
});

/**
 * Schema for refunding a payment
 */
export const refundPaymentSchema = z.object({
  attemptId: z.string().cuid(),
  storeId: z.string().cuid(),
  amount: z.number().int().positive('Refund amount must be positive'),
  reason: z.string().max(500).optional(),
  providerReference: z.string().optional(),
});

/**
 * Schema for voiding an authorization
 */
export const voidPaymentSchema = z.object({
  attemptId: z.string().cuid(),
  storeId: z.string().cuid(),
  reason: z.string().max(500).optional(),
  providerReference: z.string().optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type CreatePaymentAttemptInput = z.infer<typeof createPaymentAttemptSchema>;
export type StartAuthorizationInput = z.infer<typeof startAuthorizationSchema>;
export type CompleteAuthorizationInput = z.infer<typeof completeAuthorizationSchema>;
export type FailAuthorizationInput = z.infer<typeof failAuthorizationSchema>;
export type CapturePaymentInput = z.infer<typeof capturePaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
export type VoidPaymentInput = z.infer<typeof voidPaymentSchema>;

/**
 * Valid state transitions for payment attempts
 */
const VALID_TRANSITIONS: Record<PaymentAttemptStatus, PaymentAttemptStatus[]> = {
  INITIATED: [PaymentAttemptStatus.AUTHORIZING, PaymentAttemptStatus.FAILED, PaymentAttemptStatus.CANCELED],
  AUTHORIZING: [PaymentAttemptStatus.AUTHORIZED, PaymentAttemptStatus.FAILED],
  AUTHORIZED: [PaymentAttemptStatus.CAPTURED, PaymentAttemptStatus.CANCELED, PaymentAttemptStatus.FAILED],
  CAPTURED: [PaymentAttemptStatus.FAILED], // Refunds don't change attempt status
  FAILED: [], // Terminal state
  CANCELED: [], // Terminal state
};

/**
 * PaymentAttempt with transactions included
 */
export type PaymentAttemptWithTransactions = Prisma.PaymentAttemptGetPayload<{
  include: { transactions: true };
}>;

/**
 * Result of reconciliation check
 */
export interface ReconciliationResult {
  stuckAttempts: {
    id: string;
    storeId: string;
    orderId: string;
    status: PaymentAttemptStatus;
    createdAt: Date;
    stuckMinutes: number;
  }[];
  totalStuck: number;
  checkedAt: Date;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class PaymentService {
  private static instance: PaymentService;
  private auditLogService: AuditLogService;

  private constructor() {
    this.auditLogService = AuditLogService.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // ==========================================================================
  // STATE MACHINE VALIDATION
  // ==========================================================================

  /**
   * Check if a state transition is valid
   */
  private isValidTransition(
    from: PaymentAttemptStatus,
    to: PaymentAttemptStatus
  ): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /**
   * Log a state transition to audit log
   */
  private async logStateTransition(
    attemptId: string,
    storeId: string,
    fromStatus: PaymentAttemptStatus,
    toStatus: PaymentAttemptStatus,
    metadata?: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      additionalInfo?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.auditLogService.create(
      'PAYMENT_STATE_CHANGE',
      'PaymentAttempt',
      attemptId,
      {
        storeId,
        userId: metadata?.userId,
        changes: {
          status: {
            old: fromStatus,
            new: toStatus,
          },
          ...(metadata?.additionalInfo && { info: { old: null, new: metadata.additionalInfo } }),
        },
        metadata: {
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        },
      }
    );
  }

  // ==========================================================================
  // PAYMENT ATTEMPT OPERATIONS
  // ==========================================================================

  /**
   * Create a new payment attempt (idempotent)
   *
   * If an idempotency key is provided and an attempt with that key exists,
   * returns the existing attempt instead of creating a new one.
   */
  async createAttempt(
    input: CreatePaymentAttemptInput,
    metadata?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<PaymentAttemptWithTransactions> {
    const validated = createPaymentAttemptSchema.parse(input);

    // Check for existing attempt with same idempotency key
    if (validated.idempotencyKey) {
      const existing = await prisma.paymentAttempt.findUnique({
        where: { idempotencyKey: validated.idempotencyKey },
        include: { transactions: true },
      });

      if (existing) {
        // Verify store ID matches for security
        if (existing.storeId !== validated.storeId) {
          throw new Error('Idempotency key already used by another store');
        }
        return existing;
      }
    }

    // Create new attempt
    const attempt = await prisma.paymentAttempt.create({
      data: {
        storeId: validated.storeId,
        orderId: validated.orderId,
        provider: validated.provider,
        providerReference: validated.providerReference,
        amount: validated.amount,
        currency: validated.currency, // Already normalized to uppercase by schema
        idempotencyKey: validated.idempotencyKey,
        status: PaymentAttemptStatus.INITIATED,
        attemptCount: 1,
      },
      include: { transactions: true },
    });

    // Log creation
    await this.auditLogService.create('CREATE', 'PaymentAttempt', attempt.id, {
      storeId: attempt.storeId,
      userId: metadata?.userId,
      changes: {
        status: { old: null, new: attempt.status },
        amount: { old: null, new: attempt.amount },
        currency: { old: null, new: attempt.currency },
        provider: { old: null, new: attempt.provider },
      },
      metadata: {
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    return attempt;
  }

  /**
   * Start authorization process (INITIATED → AUTHORIZING)
   */
  async startAuthorization(
    input: StartAuthorizationInput,
    metadata?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<PaymentAttemptWithTransactions> {
    const validated = startAuthorizationSchema.parse(input);

    const attempt = await prisma.paymentAttempt.findFirst({
      where: {
        id: validated.attemptId,
        storeId: validated.storeId,
      },
      include: { transactions: true },
    });

    if (!attempt) {
      throw new Error('Payment attempt not found');
    }

    if (!this.isValidTransition(attempt.status, PaymentAttemptStatus.AUTHORIZING)) {
      throw new Error(
        `Invalid transition from ${attempt.status} to AUTHORIZING`
      );
    }

    const updated = await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: PaymentAttemptStatus.AUTHORIZING,
        providerReference: validated.providerReference ?? attempt.providerReference,
      },
      include: { transactions: true },
    });

    await this.logStateTransition(
      attempt.id,
      attempt.storeId,
      attempt.status,
      PaymentAttemptStatus.AUTHORIZING,
      metadata
    );

    return updated;
  }

  /**
   * Complete authorization (AUTHORIZING → AUTHORIZED)
   * Creates an AUTH transaction record
   */
  async completeAuthorization(
    input: CompleteAuthorizationInput,
    metadata?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<PaymentAttemptWithTransactions> {
    const validated = completeAuthorizationSchema.parse(input);

    const attempt = await prisma.paymentAttempt.findFirst({
      where: {
        id: validated.attemptId,
        storeId: validated.storeId,
      },
      include: { transactions: true },
    });

    if (!attempt) {
      throw new Error('Payment attempt not found');
    }

    if (!this.isValidTransition(attempt.status, PaymentAttemptStatus.AUTHORIZED)) {
      throw new Error(
        `Invalid transition from ${attempt.status} to AUTHORIZED`
      );
    }

    // Use transaction to update attempt and create AUTH transaction atomically
    const updated = await prisma.$transaction(async (tx) => {
      // Update attempt status
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: PaymentAttemptStatus.AUTHORIZED,
          providerReference: validated.providerReference ?? attempt.providerReference,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
      });

      // Create AUTH transaction
      await tx.paymentTransaction.create({
        data: {
          attemptId: attempt.id,
          storeId: attempt.storeId,
          type: PaymentTransactionType.AUTH,
          amount: attempt.amount,
          currency: attempt.currency,
          providerReference: validated.providerReference,
        },
      });

      return tx.paymentAttempt.findUnique({
        where: { id: attempt.id },
        include: { transactions: true },
      });
    });

    if (!updated) {
      throw new Error('Failed to update payment attempt');
    }

    await this.logStateTransition(
      attempt.id,
      attempt.storeId,
      attempt.status,
      PaymentAttemptStatus.AUTHORIZED,
      metadata
    );

    return updated;
  }

  /**
   * Handle authorization failure (AUTHORIZING → FAILED)
   * Optionally schedules a retry
   */
  async failAuthorization(
    input: FailAuthorizationInput,
    metadata?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<PaymentAttemptWithTransactions> {
    const validated = failAuthorizationSchema.parse(input);

    const attempt = await prisma.paymentAttempt.findFirst({
      where: {
        id: validated.attemptId,
        storeId: validated.storeId,
      },
      include: { transactions: true },
    });

    if (!attempt) {
      throw new Error('Payment attempt not found');
    }

    if (!this.isValidTransition(attempt.status, PaymentAttemptStatus.FAILED)) {
      throw new Error(
        `Invalid transition from ${attempt.status} to FAILED`
      );
    }

    // Calculate next retry time if requested
    let nextRetryAt: Date | null = null;
    if (validated.scheduleRetry && validated.retryDelayMinutes) {
      nextRetryAt = new Date(Date.now() + validated.retryDelayMinutes * 60 * 1000);
    }

    const updated = await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: PaymentAttemptStatus.FAILED,
        lastErrorCode: validated.errorCode,
        lastErrorMessage: validated.errorMessage,
        attemptCount: attempt.attemptCount + 1,
        nextRetryAt,
      },
      include: { transactions: true },
    });

    await this.logStateTransition(
      attempt.id,
      attempt.storeId,
      attempt.status,
      PaymentAttemptStatus.FAILED,
      {
        ...metadata,
        additionalInfo: {
          errorCode: validated.errorCode,
          errorMessage: validated.errorMessage,
          attemptCount: updated.attemptCount,
          scheduledRetry: nextRetryAt?.toISOString(),
        },
      }
    );

    return updated;
  }

  /**
   * Capture authorized payment (AUTHORIZED → CAPTURED)
   * Creates a CAPTURE transaction record
   * Returns 409 Conflict if already captured (double-capture prevention)
   */
  async capture(
    input: CapturePaymentInput,
    metadata?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<PaymentAttemptWithTransactions> {
    const validated = capturePaymentSchema.parse(input);

    const attempt = await prisma.paymentAttempt.findFirst({
      where: {
        id: validated.attemptId,
        storeId: validated.storeId,
      },
      include: { transactions: true },
    });

    if (!attempt) {
      throw new Error('Payment attempt not found');
    }

    // Check for double capture - throw specific error for 409 response
    if (attempt.status === PaymentAttemptStatus.CAPTURED) {
      const error = new Error('Payment already captured');
      (error as Error & { code: string }).code = 'ALREADY_CAPTURED';
      throw error;
    }

    if (!this.isValidTransition(attempt.status, PaymentAttemptStatus.CAPTURED)) {
      throw new Error(
        `Invalid transition from ${attempt.status} to CAPTURED. Payment must be AUTHORIZED first.`
      );
    }

    // Determine capture amount (use authorized amount if not specified)
    const captureAmount = validated.amount ?? attempt.amount;
    if (captureAmount > attempt.amount) {
      throw new Error(
        `Capture amount (${captureAmount}) cannot exceed authorized amount (${attempt.amount})`
      );
    }

    // Use transaction to update attempt and create CAPTURE transaction atomically
    const updated = await prisma.$transaction(async (tx) => {
      // Update attempt status
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: PaymentAttemptStatus.CAPTURED,
        },
      });

      // Create CAPTURE transaction
      await tx.paymentTransaction.create({
        data: {
          attemptId: attempt.id,
          storeId: attempt.storeId,
          type: PaymentTransactionType.CAPTURE,
          amount: captureAmount,
          currency: attempt.currency,
          providerReference: validated.providerReference,
        },
      });

      return tx.paymentAttempt.findUnique({
        where: { id: attempt.id },
        include: { transactions: true },
      });
    });

    if (!updated) {
      throw new Error('Failed to update payment attempt');
    }

    await this.logStateTransition(
      attempt.id,
      attempt.storeId,
      attempt.status,
      PaymentAttemptStatus.CAPTURED,
      {
        ...metadata,
        additionalInfo: {
          captureAmount,
          authorizedAmount: attempt.amount,
        },
      }
    );

    return updated;
  }

  /**
   * Refund captured payment
   * Creates a REFUND transaction record
   * Validates refund amount doesn't exceed remaining refundable amount
   */
  async refund(
    input: RefundPaymentInput,
    metadata?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<PaymentAttemptWithTransactions> {
    const validated = refundPaymentSchema.parse(input);

    const attempt = await prisma.paymentAttempt.findFirst({
      where: {
        id: validated.attemptId,
        storeId: validated.storeId,
      },
      include: { transactions: true },
    });

    if (!attempt) {
      throw new Error('Payment attempt not found');
    }

    // Must be captured to refund
    if (attempt.status !== PaymentAttemptStatus.CAPTURED) {
      throw new Error('Cannot refund a payment that has not been captured');
    }

    // Calculate captured and refunded amounts
    const capturedAmount = attempt.transactions
      .filter((t) => t.type === PaymentTransactionType.CAPTURE)
      .reduce((sum, t) => sum + t.amount, 0);

    const refundedAmount = attempt.transactions
      .filter((t) => t.type === PaymentTransactionType.REFUND)
      .reduce((sum, t) => sum + t.amount, 0);

    const refundableAmount = capturedAmount - refundedAmount;

    if (validated.amount > refundableAmount) {
      throw new Error(
        `Refund amount (${validated.amount}) exceeds refundable amount (${refundableAmount}). ` +
          `Captured: ${capturedAmount}, Already refunded: ${refundedAmount}`
      );
    }

    // Create REFUND transaction (attempt status stays CAPTURED)
    const refundTransaction = await prisma.paymentTransaction.create({
      data: {
        attemptId: attempt.id,
        storeId: attempt.storeId,
        type: PaymentTransactionType.REFUND,
        amount: validated.amount,
        currency: attempt.currency,
        providerReference: validated.providerReference,
      },
    });

    // Log refund
    await this.auditLogService.create('CREATE', 'PaymentTransaction', refundTransaction.id, {
      storeId: attempt.storeId,
      userId: metadata?.userId,
      changes: {
        type: { old: null, new: PaymentTransactionType.REFUND },
        amount: { old: null, new: validated.amount },
        reason: { old: null, new: validated.reason ?? 'Refund requested' },
      },
      metadata: {
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    // Return updated attempt with all transactions
    const updated = await prisma.paymentAttempt.findUnique({
      where: { id: attempt.id },
      include: { transactions: true },
    });

    if (!updated) {
      throw new Error('Failed to retrieve updated payment attempt');
    }

    return updated;
  }

  /**
   * Void an authorized payment (AUTHORIZED → CANCELED)
   * Creates a VOID transaction record
   */
  async void(
    input: VoidPaymentInput,
    metadata?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<PaymentAttemptWithTransactions> {
    const validated = voidPaymentSchema.parse(input);

    const attempt = await prisma.paymentAttempt.findFirst({
      where: {
        id: validated.attemptId,
        storeId: validated.storeId,
      },
      include: { transactions: true },
    });

    if (!attempt) {
      throw new Error('Payment attempt not found');
    }

    if (!this.isValidTransition(attempt.status, PaymentAttemptStatus.CANCELED)) {
      throw new Error(
        `Invalid transition from ${attempt.status} to CANCELED. ` +
          'Void is only allowed for INITIATED, AUTHORIZING, or AUTHORIZED payments.'
      );
    }

    // Use transaction to update attempt and create VOID transaction atomically
    const updated = await prisma.$transaction(async (tx) => {
      // Update attempt status
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: PaymentAttemptStatus.CANCELED,
        },
      });

      // Create VOID transaction
      await tx.paymentTransaction.create({
        data: {
          attemptId: attempt.id,
          storeId: attempt.storeId,
          type: PaymentTransactionType.VOID,
          amount: attempt.amount,
          currency: attempt.currency,
          providerReference: validated.providerReference,
        },
      });

      return tx.paymentAttempt.findUnique({
        where: { id: attempt.id },
        include: { transactions: true },
      });
    });

    if (!updated) {
      throw new Error('Failed to update payment attempt');
    }

    await this.logStateTransition(
      attempt.id,
      attempt.storeId,
      attempt.status,
      PaymentAttemptStatus.CANCELED,
      {
        ...metadata,
        additionalInfo: {
          reason: validated.reason,
        },
      }
    );

    return updated;
  }

  // ==========================================================================
  // QUERY OPERATIONS
  // ==========================================================================

  /**
   * Get payment attempt by ID (store-scoped)
   */
  async getAttemptById(
    attemptId: string,
    storeId: string
  ): Promise<PaymentAttemptWithTransactions | null> {
    return prisma.paymentAttempt.findFirst({
      where: {
        id: attemptId,
        storeId,
      },
      include: { transactions: true },
    });
  }

  /**
   * Get payment attempts for an order (store-scoped)
   */
  async getAttemptsByOrderId(
    orderId: string,
    storeId: string
  ): Promise<PaymentAttemptWithTransactions[]> {
    return prisma.paymentAttempt.findMany({
      where: {
        orderId,
        storeId,
      },
      include: { transactions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Calculate refundable amount for an attempt
   */
  async getRefundableAmount(attemptId: string, storeId: string): Promise<number> {
    const attempt = await this.getAttemptById(attemptId, storeId);

    if (!attempt || attempt.status !== PaymentAttemptStatus.CAPTURED) {
      return 0;
    }

    const capturedAmount = attempt.transactions
      .filter((t) => t.type === PaymentTransactionType.CAPTURE)
      .reduce((sum, t) => sum + t.amount, 0);

    const refundedAmount = attempt.transactions
      .filter((t) => t.type === PaymentTransactionType.REFUND)
      .reduce((sum, t) => sum + t.amount, 0);

    return capturedAmount - refundedAmount;
  }

  // ==========================================================================
  // RECONCILIATION
  // ==========================================================================

  /**
   * Find payment attempts stuck in AUTHORIZING state
   * for longer than the timeout threshold (default 15 minutes)
   */
  async findStuckAttempts(
    timeoutMinutes: number = AUTHORIZING_TIMEOUT_MINUTES
  ): Promise<ReconciliationResult> {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const stuckAttempts = await prisma.paymentAttempt.findMany({
      where: {
        status: PaymentAttemptStatus.AUTHORIZING,
        createdAt: { lt: cutoffTime },
      },
      select: {
        id: true,
        storeId: true,
        orderId: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const now = Date.now();

    return {
      stuckAttempts: stuckAttempts.map((attempt) => ({
        ...attempt,
        stuckMinutes: Math.floor((now - attempt.createdAt.getTime()) / 60000),
      })),
      totalStuck: stuckAttempts.length,
      checkedAt: new Date(),
    };
  }

  /**
   * Run reconciliation job - flags stuck attempts and logs them
   * Returns count of flagged attempts for monitoring
   */
  async runReconciliation(
    timeoutMinutes: number = AUTHORIZING_TIMEOUT_MINUTES
  ): Promise<ReconciliationResult> {
    const result = await this.findStuckAttempts(timeoutMinutes);

    // Log reconciliation run to audit
    if (result.totalStuck > 0) {
      await this.auditLogService.create(
        'RECONCILIATION',
        'PaymentAttempt',
        'system',
        {
          changes: {
            stuckCount: { old: null, new: result.totalStuck },
            stuckAttemptIds: {
              old: null,
              new: result.stuckAttempts.map((a) => a.id),
            },
          },
        }
      );
    }

    return result;
  }
}
