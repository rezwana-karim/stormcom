/**
 * Reviews API
 * 
 * Endpoints for listing and creating reviews.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReviewService } from '@/lib/services/review.service';
import { z } from 'zod';

const CreateReviewSchema = z.object({
  storeId: z.string(),
  productId: z.string(),
  customerId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().min(1, 'Comment is required'),
  images: z.array(z.string()).optional(),
  isVerifiedPurchase: z.boolean().optional(),
});

const ListReviewsQuerySchema = z.object({
  storeId: z.string(),
  productId: z.string().optional(),
  customerId: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isApproved: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['rating', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * GET /api/reviews
 * List reviews with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const query = ListReviewsQuerySchema.parse(params);

    if (!query.storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      );
    }

    const reviewService = ReviewService.getInstance();
    const result = await reviewService.listReviews(query.storeId, {
      page: query.page,
      limit: query.limit,
      search: query.search,
      productId: query.productId,
      customerId: query.customerId,
      rating: query.rating,
      isApproved: query.isApproved === 'true' ? true : query.isApproved === 'false' ? false : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Create a new review
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = CreateReviewSchema.parse(body);

    const reviewService = ReviewService.getInstance();
    const review = await reviewService.createReview(data);

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
