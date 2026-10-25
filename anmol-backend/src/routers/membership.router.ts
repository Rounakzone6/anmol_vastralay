import {
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  router,
} from '@backend/config/trpc.config';
import {
  UpdateMembershipPlanSchema,
  VerifyMembershipPaymentSchema,
} from '@backend/models/membership.model';

export const membershipRouter = router({
  getPlan: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.membership.getPlan();
  }),

  getMyMembership: protectedProcedure.query(async ({ ctx }) => {
    return ctx.services.membership.getMyMembership(ctx.user.id);
  }),

  createOrder: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.services.membership.createMembershipOrder(ctx.user.id);
  }),

  verifyPayment: protectedProcedure
    .input(VerifyMembershipPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.membership.verifyMembershipPayment(
        ctx.user.id,
        input,
      );
    }),

  adminUpdatePlan: adminProcedure
    .input(UpdateMembershipPlanSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.membership.adminUpdatePlan(input);
    }),

  adminGetMembers: adminProcedure.query(async ({ ctx }) => {
    return ctx.services.membership.adminGetMembers();
  }),
});
