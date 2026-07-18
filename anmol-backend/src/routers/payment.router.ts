import { protectedProcedure, router, staffProcedure } from '../config/trpc.config';
import { VerifyRazorpayPaymentSchema } from '../models/payment.model';

export const paymentRouter = router({
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.services.payment.getPaymentHistory(ctx.user.id);
  }),

  adminGetPayments: staffProcedure.query(async ({ ctx }) => {
    return ctx.services.payment.adminGetPayments();
  }),

  verifyRazorpayPayment: protectedProcedure
    .input(VerifyRazorpayPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.payment.verifyRazorpayPayment(ctx.user.id, input);
    }),
});
