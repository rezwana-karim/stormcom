// src/lib/services/webhook.service.ts
// Webhook Service - Handles event dispatching to external integrations

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Supported webhook event types
 */
export const WEBHOOK_EVENTS = {
  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_PAID: 'order.paid',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_REFUNDED: 'order.refunded',
  
  // Customer events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  
  // Product events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_LOW_STOCK: 'product.low_stock',
  PRODUCT_OUT_OF_STOCK: 'product.out_of_stock',
  
  // Inventory events
  INVENTORY_UPDATED: 'inventory.updated',
} as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  storeId: string;
  createdAt: string;
  data: Record<string, unknown>;
}

/**
 * Webhook delivery result
 */
interface DeliveryResult {
  webhookId: string;
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

/**
 * Webhook Service
 * Handles webhook registration, event dispatching, and delivery tracking
 */
export class WebhookService {
  private static instance: WebhookService;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 5000, 30000]; // 1s, 5s, 30s
  private static readonly TIMEOUT_MS = 10000; // 10 second timeout
  private static readonly MAX_FAILURES_BEFORE_DISABLE = 10;

  private constructor() {}

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  /**
   * Dispatch an event to all subscribed webhooks for a store
   * This is non-blocking - errors are logged but don't throw
   */
  async dispatch(
    storeId: string,
    event: WebhookEventType,
    data: Record<string, unknown>
  ): Promise<void> {
    try {
      // Find all active webhooks for this store that are subscribed to this event
      const webhooks = await prisma.webhook.findMany({
        where: {
          storeId,
          isActive: true,
          deletedAt: null,
        },
      });

      // Filter webhooks that are subscribed to this event
      const subscribedWebhooks = webhooks.filter((webhook) => {
        try {
          const events: string[] = JSON.parse(webhook.events);
          return events.includes(event) || events.includes('*');
        } catch {
          return false;
        }
      });

      if (subscribedWebhooks.length === 0) {
        return;
      }

      // Create payload
      const payload: WebhookPayload = {
        id: crypto.randomUUID(),
        event,
        storeId,
        createdAt: new Date().toISOString(),
        data,
      };

      // Dispatch to all webhooks (non-blocking)
      Promise.allSettled(
        subscribedWebhooks.map((webhook) =>
          this.deliverWithRetry(webhook.id, webhook.url, webhook.secret, webhook.customHeaders, payload)
        )
      ).catch((error) => {
        console.error('[Webhook] Dispatch error:', error);
      });
    } catch (error) {
      console.error('[Webhook] Failed to dispatch event:', error);
    }
  }

  /**
   * Deliver webhook with retry logic
   */
  private async deliverWithRetry(
    webhookId: string,
    url: string,
    secret: string | null,
    customHeaders: string | null,
    payload: WebhookPayload,
    attempt: number = 0
  ): Promise<DeliveryResult> {
    const startTime = Date.now();

    try {
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'StormCom-Webhook/1.0',
        'X-Webhook-ID': webhookId,
        'X-Event-Type': payload.event,
        'X-Delivery-ID': payload.id,
        'X-Delivery-Attempt': (attempt + 1).toString(),
      };

      // Add custom headers
      if (customHeaders) {
        try {
          const custom = JSON.parse(customHeaders);
          Object.assign(headers, custom);
        } catch {
          // Ignore invalid custom headers
        }
      }

      // Add signature if secret is set
      const payloadString = JSON.stringify(payload);
      if (secret) {
        const signature = this.signPayload(payloadString, secret);
        headers['X-Webhook-Signature'] = signature;
        headers['X-Webhook-Signature-256'] = `sha256=${signature}`;
      }

      // Send request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WebhookService.TIMEOUT_MS);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      let responseBody: string | undefined;

      try {
        responseBody = await response.text();
        // Truncate long responses
        if (responseBody.length > 1000) {
          responseBody = responseBody.substring(0, 1000) + '... (truncated)';
        }
      } catch {
        responseBody = undefined;
      }

      const success = response.ok;

      // Log delivery
      await this.logDelivery(webhookId, payload.event, payloadString, {
        statusCode: response.status,
        responseBody,
        responseTime,
        success,
      });

      // Update webhook status
      await this.updateWebhookStatus(webhookId, success);

      if (!success && attempt < WebhookService.MAX_RETRIES - 1) {
        // Retry after delay
        await this.delay(WebhookService.RETRY_DELAYS[attempt]);
        return this.deliverWithRetry(webhookId, url, secret, customHeaders, payload, attempt + 1);
      }

      return {
        webhookId,
        success,
        statusCode: response.status,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed delivery
      await this.logDelivery(webhookId, payload.event, JSON.stringify(payload), {
        success: false,
        error: errorMessage,
        responseTime,
      });

      // Update webhook status
      await this.updateWebhookStatus(webhookId, false, errorMessage);

      if (attempt < WebhookService.MAX_RETRIES - 1) {
        // Retry after delay
        await this.delay(WebhookService.RETRY_DELAYS[attempt]);
        return this.deliverWithRetry(webhookId, url, secret, customHeaders, payload, attempt + 1);
      }

      return {
        webhookId,
        success: false,
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Sign payload with HMAC-SHA256
   */
  private signPayload(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Log webhook delivery attempt
   */
  private async logDelivery(
    webhookId: string,
    event: string,
    payload: string,
    result: {
      statusCode?: number;
      responseBody?: string;
      responseTime?: number;
      success: boolean;
      error?: string;
    }
  ): Promise<void> {
    try {
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event,
          payload,
          statusCode: result.statusCode,
          responseBody: result.responseBody,
          responseTime: result.responseTime,
          success: result.success,
          error: result.error,
        },
      });
    } catch (error) {
      console.error('[Webhook] Failed to log delivery:', error);
    }
  }

  /**
   * Update webhook status after delivery
   */
  private async updateWebhookStatus(
    webhookId: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      const now = new Date();

      if (success) {
        await prisma.webhook.update({
          where: { id: webhookId },
          data: {
            lastTriggeredAt: now,
            lastSuccessAt: now,
            failureCount: 0,
          },
        });
      } else {
        const webhook = await prisma.webhook.findUnique({
          where: { id: webhookId },
          select: { failureCount: true },
        });

        const newFailureCount = (webhook?.failureCount ?? 0) + 1;

        await prisma.webhook.update({
          where: { id: webhookId },
          data: {
            lastTriggeredAt: now,
            lastErrorAt: now,
            lastError: error,
            failureCount: newFailureCount,
            // Auto-disable after too many failures
            isActive: newFailureCount < WebhookService.MAX_FAILURES_BEFORE_DISABLE,
          },
        });
      }
    } catch (error) {
      console.error('[Webhook] Failed to update status:', error);
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create a new webhook
   */
  async createWebhook(data: {
    storeId: string;
    name: string;
    url: string;
    secret?: string;
    events: WebhookEventType[];
    customHeaders?: Record<string, string>;
  }) {
    return prisma.webhook.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        url: data.url,
        secret: data.secret,
        events: JSON.stringify(data.events),
        customHeaders: data.customHeaders ? JSON.stringify(data.customHeaders) : null,
      },
    });
  }

  /**
   * List webhooks for a store
   */
  async listWebhooks(storeId: string) {
    return prisma.webhook.findMany({
      where: {
        storeId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get webhook delivery logs
   */
  async getDeliveryLogs(webhookId: string, limit: number = 50) {
    return prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Test webhook by sending a test event
   */
  async testWebhook(webhookId: string): Promise<DeliveryResult> {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const testPayload: WebhookPayload = {
      id: crypto.randomUUID(),
      event: 'test' as WebhookEventType,
      storeId: webhook.storeId,
      createdAt: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        timestamp: Date.now(),
      },
    };

    return this.deliverWithRetry(
      webhook.id,
      webhook.url,
      webhook.secret,
      webhook.customHeaders,
      testPayload
    );
  }
}

// Export singleton instance
export const webhookService = WebhookService.getInstance();
