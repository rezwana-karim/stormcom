/**
 * External Order Status API v1
 * 
 * PUT /api/v1/external/orders/[id]/status - Update order status bidirectionally
 * GET /api/v1/external/orders/[id]/status - Get order status
 * 
 * Authentication: Bearer token (API key from integration)
 * 
 * @module api/v1/external/orders/[id]/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { wordpressIntegrationService } from '@/lib/services/wordpress-integration.service';

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
 * PUT /api/v1/external/orders/[id]/status
 * Update order status from external system (bidirectional sync)
 * 
 * The [id] parameter is the external order ID (e.g., WooCommerce order ID)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: externalOrderId } = await params;

    // Extract and verify API key
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
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
    
    const statusUpdateSchema = z.object({
      status: z.string().min(1),
      trackingNumber: z.string().optional(),
      trackingUrl: z.string().optional(),
      note: z.string().optional(),
    });

    const validatedData = statusUpdateSchema.parse(body);

    // Update order status
    const result = await wordpressIntegrationService.updateOrderStatusFromExternal(
      integration.id,
      integration.storeId,
      {
        externalOrderId,
        status: validatedData.status,
        trackingNumber: validatedData.trackingNumber,
        trackingUrl: validatedData.trackingUrl,
        note: validatedData.note,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to update order status',
          message: result.error,
          externalOrderId: result.externalOrderId,
        },
        { status: result.error === 'Order not found' ? 404 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: result.orderId,
        externalOrderId: result.externalOrderId,
        action: result.action,
      },
    });

  } catch (error) {
    console.error('PUT /api/v1/external/orders/[id]/status error:', error);
    
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
 * GET /api/v1/external/orders/[id]/status
 * Get order status for external system
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: externalOrderId } = await params;

    // Extract and verify API key
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
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

    // Find the order mapping
    const mapping = await prisma.orderMapping.findUnique({
      where: {
        integrationId_externalOrderId: {
          integrationId: integration.id,
          externalOrderId,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            trackingNumber: true,
            trackingUrl: true,
            fulfilledAt: true,
            canceledAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!mapping) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Map StormCom status to external format
    const statusMap: Record<string, string> = {
      PENDING: 'pending',
      PAYMENT_FAILED: 'failed',
      PAID: 'processing',
      PROCESSING: 'processing',
      SHIPPED: 'completed',
      DELIVERED: 'completed',
      CANCELED: 'cancelled',
      REFUNDED: 'refunded',
    };

    return NextResponse.json({
      success: true,
      data: {
        externalOrderId,
        stormcomOrderId: mapping.stormcomOrderId,
        orderNumber: mapping.order.orderNumber,
        status: mapping.order.status,
        externalStatus: statusMap[mapping.order.status] || 'pending',
        paymentStatus: mapping.order.paymentStatus,
        trackingNumber: mapping.order.trackingNumber,
        trackingUrl: mapping.order.trackingUrl,
        fulfilledAt: mapping.order.fulfilledAt,
        canceledAt: mapping.order.canceledAt,
        lastSyncedAt: mapping.lastSyncedAt,
        createdAt: mapping.order.createdAt,
        updatedAt: mapping.order.updatedAt,
      },
    });

  } catch (error) {
    console.error('GET /api/v1/external/orders/[id]/status error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
