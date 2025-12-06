// src/lib/services/webhook.service.ts
// Webhook Service - Handles event dispatching to external integrations

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Private/internal IP ranges to block (SSRF protection)
 */
const BLOCKED_IP_PATTERNS = [
  /^127\./,                          // Loopback (127.0.0.0/8)
  /^10\./,                           // Private (10.0.0.0/8)
  /^172\.(1[6-9]|2[0-9]|3[01])\./,  // Private (172.16.0.0/12)
  /^192\.168\./,                     // Private (192.168.0.0/16)
  /^169\.254\./,                     // Link-local (169.254.0.0/16)
  /^0\./,                            // Current network (0.0.0.0/8)
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // Shared (100.64.0.0/10)
  /^198\.51\.100\./,                 // Documentation (TEST-NET-2)
  /^203\.0\.113\./,                  // Documentation (TEST-NET-3)
  /^192\.0\.2\./,                    // Documentation (TEST-NET-1)
  /^224\./,                          // Multicast
  /^240\./,                          // Reserved
];

/**
 * Blocked hostnames (SSRF protection)
 */
const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal',        // GCP metadata
  '169.254.169.254',                 // AWS/Azure/GCP metadata
  'metadata.azure.internal',         // Azure metadata
  'kubernetes.default.svc',          // Kubernetes
];

/**
 * Allowed custom headers (safe headers only)
 * Block headers that could be used for SSRF or security bypass
 */
const ALLOWED_CUSTOM_HEADERS = new Set([
  'authorization',
  'x-api-key',
  'x-auth-token',
  'x-request-id',
  'x-correlation-id',
  'x-custom-header',
  'accept',
  'accept-language',
]);

/**
 * Validate webhook URL to prevent SSRF attacks
 * @param urlString - URL to validate
 * @returns Object with isValid flag and optional error message
 */
function validateWebhookUrl(urlString: string): { isValid: boolean; error?: string } {
  try {
    const url = new URL(urlString);

    // Only allow HTTPS (enforce encrypted transport)
    if (url.protocol !== 'https:') {
      return { isValid: false, error: 'Only HTTPS URLs are allowed for webhooks' };
    }

    // Check for blocked hostnames
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return { isValid: false, error: 'URL hostname is not allowed' };
    }

    // Check for blocked IP patterns
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { isValid: false, error: 'Internal/private IP addresses are not allowed' };
      }
    }

    // Block any URL with credentials embedded
    if (url.username || url.password) {
      return { isValid: false, error: 'URLs with embedded credentials are not allowed' };
    }

    // Block file:// and other non-HTTP protocols
    if (!['https:'].includes(url.protocol)) {
      return { isValid: false, error: 'Only HTTPS protocol is allowed' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Filter custom headers to only allow safe headers
 * @param customHeaders - JSON string or object of custom headers
 * @returns Filtered headers object
 */
function filterCustomHeaders(customHeaders: string | null): Record<string, string> {
  if (!customHeaders) return {};

  try {
    const parsed = typeof customHeaders === 'string' ? JSON.parse(customHeaders) : customHeaders;
    const filtered: Record<string, string> = {};

    for (const [key, value] of Object.entries(parsed)) {
      const lowerKey = key.toLowerCase();
      // Only allow specific safe headers and block any Host, Origin, or internal headers
      if (
        ALLOWED_CUSTOM_HEADERS.has(lowerKey) &&
        typeof value === 'string' &&
        !lowerKey.startsWith('x-forwarded-') &&
        !lowerKey.startsWith('x-real-') &&
        lowerKey !== 'host' &&
        lowerKey !== 'origin' &&
        lowerKey !== 'cookie' &&
        lowerKey !== 'set-cookie'
      ) {
        filtered[key] = value;
      }
    }

    return filtered;
  } catch {
    return {};
  }
}

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

    // SECURITY: Validate webhook URL to prevent SSRF attacks
    const urlValidation = validateWebhookUrl(url);
    if (!urlValidation.isValid) {
      const errorMessage = urlValidation.error || 'Invalid webhook URL';
      
      // Log the failed delivery due to URL validation
      await this.logDelivery(webhookId, payload.event, JSON.stringify(payload), {
        success: false,
        error: `SSRF Protection: ${errorMessage}`,
        responseTime: Date.now() - startTime,
      });

      // Update webhook status with security error
      await this.updateWebhookStatus(webhookId, false, `Security: ${errorMessage}`);

      return {
        webhookId,
        success: false,
        responseTime: Date.now() - startTime,
        error: errorMessage,
      };
    }

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

      // SECURITY: Filter custom headers to only allow safe headers
      const filteredHeaders = filterCustomHeaders(customHeaders);
      Object.assign(headers, filteredHeaders);

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
   * Validates URL to prevent SSRF attacks before storing
   */
  async createWebhook(data: {
    storeId: string;
    name: string;
    url: string;
    secret?: string;
    events: WebhookEventType[];
    customHeaders?: Record<string, string>;
  }) {
    // SECURITY: Validate URL before storing to prevent SSRF attacks
    const urlValidation = validateWebhookUrl(data.url);
    if (!urlValidation.isValid) {
      throw new Error(`Invalid webhook URL: ${urlValidation.error}`);
    }

    // SECURITY: Filter custom headers to only allow safe headers
    const filteredHeaders = data.customHeaders 
      ? filterCustomHeaders(JSON.stringify(data.customHeaders))
      : null;

    return prisma.webhook.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        url: data.url,
        secret: data.secret,
        events: JSON.stringify(data.events),
        customHeaders: filteredHeaders ? JSON.stringify(filteredHeaders) : null,
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
   * Validates URL before sending to prevent SSRF attacks
   */
  async testWebhook(webhookId: string): Promise<DeliveryResult> {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    // SECURITY: Validate URL before testing to prevent SSRF attacks
    const urlValidation = validateWebhookUrl(webhook.url);
    if (!urlValidation.isValid) {
      return {
        webhookId,
        success: false,
        error: `Security: ${urlValidation.error}`,
      };
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
