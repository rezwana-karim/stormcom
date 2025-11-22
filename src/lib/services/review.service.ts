/**
 * Review Service
 * 
 * Handles product review operations including CRUD, approval, and filtering.
 * 
 * @module lib/services/review.service
 */

import prisma from '@/lib/prisma';
import type { Prisma, Review } from '@prisma/client';

export interface CreateReviewData {
  storeId: string;
  productId: string;
  customerId?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase?: boolean;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
  isApproved?: boolean;
}

export interface ListReviewsOptions {
  page?: number;
  limit?: number;
  search?: string;
  productId?: string;
  customerId?: string;
  rating?: number;
  isApproved?: boolean;
  sortBy?: 'rating' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ReviewWithRelations extends Review {
  product: {
    id: string;
    name: string;
    slug: string;
    images?: string | null;
  } | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface ReviewListResult {
  reviews: ReviewWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductRatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export class ReviewService {
  private static instance: ReviewService;

  private constructor() {}

  public static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  /**
   * List reviews with pagination and filters
   */
  async listReviews(
    storeId: string,
    options: ListReviewsOptions = {}
  ): Promise<ReviewListResult> {
    const {
      page = 1,
      limit = 20,
      search,
      productId,
      customerId,
      rating,
      isApproved,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const where: Prisma.ReviewWhereInput = {
      storeId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { comment: { contains: search } },
      ];
    }

    if (productId) {
      where.productId = productId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (rating !== undefined) {
      where.rating = rating;
    }

    if (isApproved !== undefined) {
      where.isApproved = isApproved;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single review by ID
   */
  async getReviewById(reviewId: string, storeId: string): Promise<ReviewWithRelations> {
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        storeId,
        deletedAt: null,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    return review;
  }

  /**
   * Create new review
   */
  async createReview(data: CreateReviewData): Promise<ReviewWithRelations> {
    const { storeId, productId, customerId, rating, title, comment, images, isVerifiedPurchase } = data;

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Verify product exists
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId, deletedAt: null },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Check if customer has already reviewed this product
    if (customerId) {
      const existingReview = await prisma.review.findFirst({
        where: {
          storeId,
          productId,
          customerId,
          deletedAt: null,
        },
      });

      if (existingReview) {
        throw new Error('Customer has already reviewed this product');
      }
    }

    const review = await prisma.review.create({
      data: {
        storeId,
        productId,
        customerId,
        rating,
        title,
        comment,
        images: images ? JSON.stringify(images) : null,
        isVerifiedPurchase: isVerifiedPurchase ?? false,
        isApproved: false, // Reviews require approval by default
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return review;
  }

  /**
   * Update review
   */
  async updateReview(
    reviewId: string,
    storeId: string,
    data: UpdateReviewData
  ): Promise<ReviewWithRelations> {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, storeId, deletedAt: null },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    // Validate rating if provided
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const updateData: Prisma.ReviewUpdateInput = {};

    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.comment !== undefined) updateData.comment = data.comment;
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
    if (data.isApproved !== undefined) {
      updateData.isApproved = data.isApproved;
      if (data.isApproved) {
        updateData.approvedAt = new Date();
      }
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updatedReview;
  }

  /**
   * Delete review (soft delete)
   */
  async deleteReview(reviewId: string, storeId: string): Promise<void> {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, storeId, deletedAt: null },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Approve review
   */
  async approveReview(reviewId: string, storeId: string): Promise<ReviewWithRelations> {
    return this.updateReview(reviewId, storeId, { isApproved: true });
  }

  /**
   * Get product rating stats
   */
  async getProductRatingStats(productId: string, storeId: string): Promise<ProductRatingStats> {
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        storeId,
        isApproved: true,
        deletedAt: null,
      },
      select: {
        rating: true,
      },
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution = reviews.reduce((dist: Record<number, number>, r) => {
      dist[r.rating] = (dist[r.rating] || 0) + 1;
      return dist;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
    };
  }
}
