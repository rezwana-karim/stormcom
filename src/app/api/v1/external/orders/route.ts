/**
 * External Orders API v1
 * 
 * POST /api/v1/external/orders - Create order from WooCommerce/external source
 * GET /api/v1/external/orders - Get orders for sync to WooCommerce
 * 
 * Authentication: Bearer token (API key from integration)
 * 
 * @module api/v1/external/orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  wordpressIntegrationService,
  ExternalOrderData 
} from '@/lib/services/wordpress-integration.service';

// Rate limiting constants (simple in-memory)
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 1000; // requests per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple rate limiting check
 */
function checkRateLimit(apiKey: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(apiKey);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(apiKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetIn: record.resetAt - now };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetIn: record.resetAt - now };
}

/**
 * Extract API key from Authorization header
 */
function extractApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;
  
  const [type, key] = authHeader.split(' ');
  if (type.toLowerCase() !== 'bearer') return null;
  
  return key || null;
}

/**
 * POST /api/v1/external/orders
 * Create order from external source (WooCommerce → StormCom)
 */
export async function POST(request: NextRequest) {
  try {
    // Extract and verify API key
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    // Rate limit check
    const rateLimit = checkRateLimit(apiKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetIn: Math.ceil(rateLimit.resetIn / 1000) },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000)),
          },
        }
      );
    }

    // Verify API key and get integration
    const integration = await wordpressIntegrationService.verifyApiKey(apiKey);
    if (!integration) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Check if order sync is enabled
    if (!integration.syncOrders) {
      return NextResponse.json(
        { error: 'Order sync is disabled for this integration' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const orderData: ExternalOrderData = body;

    // Create order
    const result = await wordpressIntegrationService.createOrderFromExternal(
      integration.id,
      integration.storeId,
      orderData
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to create order',
          message: result.error,
          externalOrderId: result.externalOrderId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Order synced successfully',
        data: {
          orderId: result.orderId,
          externalOrderId: result.externalOrderId,
          action: result.action,
        },
      },
      { 
        status: 201,
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );

  } catch (error) {
    console.error('POST /api/v1/external/orders error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/external/orders
 * Get orders for sync to external system (StormCom → WooCommerce)
 * Used when external system needs to pull orders from Facebook/Instagram channels
 */
export async function GET(request: NextRequest) {
  try {
    // Extract and verify API key
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    // Rate limit check
    const rateLimit = checkRateLimit(apiKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Verify API key and get integration
    const integration = await wordpressIntegrationService.verifyApiKey(apiKey);
    if (!integration) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Check if bidirectional sync is enabled
    if (integration.orderSyncDirection !== 'TWO_WAY' && integration.orderSyncDirection !== 'FROM_STORMCOM') {
      return NextResponse.json(
        { error: 'Outbound order sync is disabled for this integration' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const limit = searchParams.get('limit');
    const includeAlreadySynced = searchParams.get('includeAlreadySynced') === 'true';

    const options = {
      since: since ? new Date(since) : undefined,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 50,
      includeAlreadySynced,
    };

    // Get orders for external sync
    const orders = await wordpressIntegrationService.getOrdersForExternalSync(
      integration.id,
      integration.storeId,
      options
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          orders,
          count: orders.length,
        },
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );

  } catch (error) {
    console.error('GET /api/v1/external/orders error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
