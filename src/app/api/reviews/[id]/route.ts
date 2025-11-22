/**
 * Review Detail API
 * 
 * Endpoints for fetching, updating, and deleting individual reviews.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReviewService } from '@/lib/services/review.service';
import { z } from 'zod';

const UpdateReviewSchema = z.object({
  storeId: z.string(),
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  comment: z.string().min(1).optional(),
  images: z.array(z.string()).optional(),
  isApproved: z.boolean().optional(),
});

/**
 * GET /api/reviews/[id]
 * Get single review by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      );
    }

    const reviewService = ReviewService.getInstance();
    const review = await reviewService.getReviewById(id, storeId);

    return NextResponse.json(review, { status: 200 });
  } catch (error) {
    console.error('Error fetching review:', error);
    if (error instanceof Error && error.message === 'Review not found') {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reviews/[id]
 * Update review
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const data = UpdateReviewSchema.parse(body);

    const reviewService = ReviewService.getInstance();
    const review = await reviewService.updateReview(id, data.storeId, data);

    return NextResponse.json(review, { status: 200 });
  } catch (error) {
    console.error('Error updating review:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === 'Review not found') {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[id]
 * Delete review (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      );
    }

    const reviewService = ReviewService.getInstance();
    await reviewService.deleteReview(id, storeId);

    return NextResponse.json(
      { message: 'Review deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting review:', error);
    if (error instanceof Error && error.message === 'Review not found') {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
