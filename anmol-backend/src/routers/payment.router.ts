import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../config/trpc.config';

export const paymentRouter = router({
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.payment.findMany({
      where: { userId: ctx.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        order: true,
      },
    });
  }),

  processPayment: protectedProcedure
    .input(z.object({
      orderId: z.string(),
      paymentMethod: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
      });

      if (!order || order.userId !== ctx.user!.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
      }

      if (order.status !== 'PENDING') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Order cannot be paid' });
      }

      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const transactionId = `txn_${Date.now()}`;

      // Create payment and update order
      return ctx.prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            userId: ctx.user!.id,
            amount: order.totalAmount,
            status: 'COMPLETED',
            paymentMethod: input.paymentMethod,
            transactionId,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { status: 'PROCESSING' },
        });

        return payment;
      });
    }),
});
