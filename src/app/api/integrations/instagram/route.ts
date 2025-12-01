/**
 * Instagram Shopping Integration API
 *
 * GET /api/integrations/instagram - Get Instagram connection status
 * POST /api/integrations/instagram - Connect Instagram via Facebook OAuth
 * DELETE /api/integrations/instagram - Disconnect Instagram
 *
 * @module api/integrations/instagram
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const connectInstagramSchema = z.object({
  facebookAccessToken: z.string().min(1, 'Facebook access token is required'),
  facebookPageId: z.string().min(1, 'Facebook page ID is required'),
  instagramAccountId: z.string().min(1, 'Instagram account ID is required'),
});

/**
 * Get Instagram connection status and details
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    // Verify user has access to this store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        organization: {
          memberships: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const connection = await prisma.instagramConnection.findUnique({
      where: { storeId },
      include: {
        _count: {
          select: {
            productTags: true,
            orders: true,
          },
        },
      },
    });

    if (!connection) {
      return NextResponse.json({
        data: null,
        connected: false,
      });
    }

    // Get recent analytics
    const recentAnalytics = await prisma.instagramAnalytics.findMany({
      where: { connectionId: connection.id },
      orderBy: { date: 'desc' },
      take: 30,
    });

    // Calculate summary stats
    const totalRevenue = recentAnalytics.reduce((sum, a) => sum + a.revenue, 0);
    const totalOrders = recentAnalytics.reduce((sum, a) => sum + a.ordersCompleted, 0);
    const avgConversionRate =
      recentAnalytics.length > 0
        ? recentAnalytics.reduce((sum, a) => sum + a.conversionRate, 0) / recentAnalytics.length
        : 0;

    return NextResponse.json({
      data: {
        id: connection.id,
        status: connection.status,
        instagramUsername: connection.instagramUsername,
        instagramProfilePic: connection.instagramProfilePic,
        instagramFollowers: connection.instagramFollowers,
        facebookPageName: connection.facebookPageName,
        catalogId: connection.catalogId,
        catalogName: connection.catalogName,
        catalogSyncedAt: connection.catalogSyncedAt,
        domainVerified: connection.domainVerified,
        autoSyncProducts: connection.autoSyncProducts,
        syncInterval: connection.syncInterval,
        productTagsCount: connection._count.productTags,
        ordersCount: connection._count.orders,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
      },
      analytics: {
        totalRevenue,
        totalOrders,
        avgConversionRate: avgConversionRate.toFixed(2),
        recentData: recentAnalytics.slice(0, 7),
      },
      connected: connection.status === 'CONNECTED',
    });
  } catch (error) {
    console.error('Get Instagram connection error:', error);
    return NextResponse.json(
      { error: 'Failed to get Instagram connection' },
      { status: 500 }
    );
  }
}

/**
 * Connect Instagram via Facebook Business Suite OAuth
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, ...connectionData } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const validation = connectInstagramSchema.safeParse(connectionData);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify user has access to this store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        organization: {
          memberships: {
            some: {
              userId: session.user.id,
              role: { in: ['OWNER', 'ADMIN'] },
            },
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Check if already connected
    const existingConnection = await prisma.instagramConnection.findUnique({
      where: { storeId },
    });

    if (existingConnection && existingConnection.status === 'CONNECTED') {
      return NextResponse.json(
        { error: 'Instagram already connected. Disconnect first to reconnect.' },
        { status: 409 }
      );
    }

    // In production, this would validate the token with Facebook Graph API
    // and fetch Instagram business account details
    // For now, we simulate the OAuth callback data

    const connection = await prisma.instagramConnection.upsert({
      where: { storeId },
      create: {
        storeId,
        facebookAccessToken: validation.data.facebookAccessToken,
        facebookPageId: validation.data.facebookPageId,
        facebookPageName: body.facebookPageName || 'Connected Page',
        facebookTokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        instagramAccountId: validation.data.instagramAccountId,
        instagramUsername: body.instagramUsername || '@business',
        instagramProfilePic: body.instagramProfilePic,
        instagramFollowers: body.instagramFollowers || 0,
        catalogId: body.catalogId,
        catalogName: body.catalogName,
        status: 'CONNECTED',
        domainVerified: false,
        autoSyncProducts: true,
        syncInterval: 60,
      },
      update: {
        facebookAccessToken: validation.data.facebookAccessToken,
        facebookPageId: validation.data.facebookPageId,
        facebookPageName: body.facebookPageName || 'Connected Page',
        facebookTokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        instagramAccountId: validation.data.instagramAccountId,
        instagramUsername: body.instagramUsername || '@business',
        instagramProfilePic: body.instagramProfilePic,
        instagramFollowers: body.instagramFollowers || 0,
        catalogId: body.catalogId,
        catalogName: body.catalogName,
        status: 'CONNECTED',
        connectionError: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: 'Instagram connected successfully',
        data: {
          id: connection.id,
          status: connection.status,
          instagramUsername: connection.instagramUsername,
          instagramFollowers: connection.instagramFollowers,
          facebookPageName: connection.facebookPageName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Connect Instagram error:', error);
    return NextResponse.json(
      { error: 'Failed to connect Instagram' },
      { status: 500 }
    );
  }
}

/**
 * Disconnect Instagram
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    // Verify user has access to this store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        organization: {
          memberships: {
            some: {
              userId: session.user.id,
              role: { in: ['OWNER', 'ADMIN'] },
            },
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found or insufficient permissions' },
        { status: 404 }
      );
    }

    const connection = await prisma.instagramConnection.findUnique({
      where: { storeId },
    });

    if (!connection) {
      return NextResponse.json({ error: 'No Instagram connection found' }, { status: 404 });
    }

    // Update status to disconnected (preserving data for history)
    await prisma.instagramConnection.update({
      where: { storeId },
      data: {
        status: 'DISCONNECTED',
        facebookAccessToken: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Instagram disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect Instagram error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Instagram' },
      { status: 500 }
    );
  }
}
