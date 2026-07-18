import {
  router,
  publicProcedure,
  protectedProcedure,
} from '@backend/config/trpc.config';
import { z } from 'zod';
import { AddReviewSchema, ListReviewsSchema } from '@backend/models/review.model';

export const reviewRouter = router({
  add: protectedProcedure
    .input(AddReviewSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.review.addReview(ctx.user.id, input);
    }),

  listByProduct: publicProcedure
    .input(ListReviewsSchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.review.listReviews(input);
    }),

  stats: publicProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.services.review.getStats(input.productId);
    }),
});
