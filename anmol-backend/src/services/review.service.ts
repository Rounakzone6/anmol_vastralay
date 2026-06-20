import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { TRPCError } from '@trpc/server';
import { AddReviewInput, ListReviewsInput } from '../models/review.model';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async addReview(userId: string, input: AddReviewInput) {
    try {
      // Check if user already reviewed this product
      const existingReview = await this.prisma.review.findUnique({
        where: {
          productId_userId: {
            productId: input.productId,
            userId,
          },
        },
      });

      if (existingReview) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You have already reviewed this product',
        });
      }

      // Check if product exists
      const product = await this.prisma.product.findUnique({
        where: { id: input.productId },
      });

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      // For a real app, you might check if the user actually purchased the product here
      // and set isVerifiedBuyer = true. For now, we leave it false or set it based on past orders.

      const review = await this.prisma.review.create({
        data: {
          productId: input.productId,
          userId,
          rating: input.rating,
          title: input.title,
          comment: input.comment,
          isVerifiedBuyer: false, // Update logic when orders are integrated
        },
      });

      return { success: true, review };
    } catch (error: any) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add review',
        cause: error,
      });
    }
  }

  async listReviews(input: ListReviewsInput) {
    const limit = input.limit ?? 10;
    
    const items = await this.prisma.review.findMany({
      where: { productId: input.productId },
      take: limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    let nextCursor: typeof input.cursor | undefined = undefined;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem!.id;
    }

    return {
      items,
      nextCursor,
    };
  }

  async getStats(productId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { id: true },
    });

    return {
      averageRating: stats._avg.rating || 0,
      totalCount: stats._count.id || 0,
    };
  }
}
