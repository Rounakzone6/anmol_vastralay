import {
  protectedProcedure,
  publicProcedure,
  router,
  staffProcedure,
} from '@backend/config/trpc.config';
import { TRPCError } from '@trpc/server';
import { redis } from '@backend/config/redis.config';
import {
  CreateOrderSchema,
  GenerateInvoiceSchema,
  OrderIdSchema,
  UpdateOrderStatusSchema,
  ValidateCouponSchema,
} from '@backend/models/order.model';

export const orderRouter = router({
  validateCoupon: publicProcedure
    .input(ValidateCouponSchema)
    .query(async ({ ctx, input }) => {
      // Security: Rate-limit public coupon validation to 10 attempts/min per user/IP
      const clientKey =
        ctx.user?.id || (ctx as any).req?.ip || 'anonymous_client';
      const rateKey = `rate:coupon:${clientKey}`;
      try {
        const attempts = await redis.incr(rateKey);
        if (attempts === 1) {
          await redis.expire(rateKey, 60);
        }
        if (attempts > 10) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message:
              'Too many coupon validation attempts. Please wait 1 minute before trying again.',
          });
        }
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
      }

      return ctx.services.order.validateCoupon(input.code);
    }),

  createOrder: protectedProcedure
    .input(CreateOrderSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.order.createOrder(ctx.user.id, input);
    }),

  getOrderHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.services.order.getOrderHistory(ctx.user.id);
  }),

  getOrderDetails: protectedProcedure
    .input(OrderIdSchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.order.getOrderDetails(ctx.user.id, input.orderId);
    }),

  generateInvoice: protectedProcedure
    .input(GenerateInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.order.generateInvoice(ctx.user.id, input.orderId);
    }),

  adminGenerateInvoice: staffProcedure
    .input(GenerateInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.order.generateInvoice(undefined, input.orderId);
    }),

  adminGetOrders: staffProcedure.query(async ({ ctx }) => {
    return ctx.services.order.adminGetOrders();
  }),

  adminUpdateOrderStatus: staffProcedure
    .input(UpdateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.order.adminUpdateOrderStatusWithEvents(input);
    }),
});
