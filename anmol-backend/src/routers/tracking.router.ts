import { router, publicProcedure, staffProcedure } from '../config/trpc.config';
import { RecordVisitSchema, RecordInteractionSchema } from '../models/tracking.model';

export const trackingRouter = router({
  recordVisit: publicProcedure
    .input(RecordVisitSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.tracking.recordVisit(input);
    }),

  recordInteraction: publicProcedure
    .input(RecordInteractionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.tracking.recordInteraction(ctx.user?.id, input);
    }),

  getVisitsCount: staffProcedure.query(async ({ ctx }) => {
    return ctx.services.tracking.getVisitsCount();
  }),
});
