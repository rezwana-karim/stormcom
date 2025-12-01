/**
 * Instagram Product Tagging API
 *
 * GET /api/integrations/instagram/products - List product tags
 * POST /api/integrations/instagram/products - Submit product for tagging
 * PATCH /api/integrations/instagram/products - Update product tag status
 *
 * @module api/integrations/instagram/products
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const submitProductTagSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  instagramMediaId: z.string().optional(),
  instagramMediaUrl: z.string().url().optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL', 'STORY', 'REEL']).optional(),
});

/**
 * List product tags for Instagram
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

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
    });

    if (!connection) {
      return NextResponse.json({ error: 'Instagram not connected' }, { status: 404 });
    }

    const whereClause: Record<string, unknown> = {
      connectionId: connection.id,
    };

    if (status) {
      whereClause.status = status;
    }

    const [productTags, total] = await Promise.all([
      prisma.instagramProductTag.findMany({
        where: whereClause,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              thumbnailUrl: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.instagramProductTag.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: productTags,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get product tags error:', error);
    return NextResponse.json(
      { error: 'Failed to get product tags' },
      { status: 500 }
    );
  }
}

/**
 * Submit product for Instagram tagging
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, ...tagData } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const validation = submitProductTagSchema.safeParse(tagData);
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
    });

    if (!connection || connection.status !== 'CONNECTED') {
      return NextResponse.json(
        { error: 'Instagram not connected' },
        { status: 404 }
      );
    }

    // Verify product belongs to this store
    const product = await prisma.product.findFirst({
      where: {
        id: validation.data.productId,
        storeId,
        status: 'ACTIVE',
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or not active' },
        { status: 404 }
      );
    }

    // Check if product is already tagged for this media
    if (validation.data.instagramMediaId) {
      const existingTag = await prisma.instagramProductTag.findUnique({
        where: {
          connectionId_productId_instagramMediaId: {
            connectionId: connection.id,
            productId: product.id,
            instagramMediaId: validation.data.instagramMediaId,
          },
        },
      });

      if (existingTag) {
        return NextResponse.json(
          { error: 'Product already tagged on this media' },
          { status: 409 }
        );
      }
    }

    const productTag = await prisma.instagramProductTag.create({
      data: {
        connectionId: connection.id,
        productId: product.id,
        instagramMediaId: validation.data.instagramMediaId,
        instagramMediaUrl: validation.data.instagramMediaUrl,
        mediaType: validation.data.mediaType,
        status: 'PENDING',
        submittedAt: new Date(),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Product submitted for tagging',
        data: productTag,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit product tag error:', error);
    return NextResponse.json(
      { error: 'Failed to submit product for tagging' },
      { status: 500 }
    );
  }
}

/**
 * Update product tag (approve/reject simulation for demo)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, tagId, status, rejectedReason } = body;

    if (!storeId || !tagId) {
      return NextResponse.json(
        { error: 'Store ID and tag ID required' },
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

    const connection = await prisma.instagramConnection.findUnique({
      where: { storeId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Instagram not connected' },
        { status: 404 }
      );
    }

    const productTag = await prisma.instagramProductTag.findFirst({
      where: {
        id: tagId,
        connectionId: connection.id,
      },
    });

    if (!productTag) {
      return NextResponse.json(
        { error: 'Product tag not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status === 'APPROVED') {
      updateData.status = 'APPROVED';
      updateData.approvedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.status = 'REJECTED';
      updateData.rejectedReason = rejectedReason || 'Not approved';
    }

    const updatedTag = await prisma.instagramProductTag.update({
      where: { id: tagId },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Product tag updated',
      data: updatedTag,
    });
  } catch (error) {
    console.error('Update product tag error:', error);
    return NextResponse.json(
      { error: 'Failed to update product tag' },
      { status: 500 }
    );
  }
}
