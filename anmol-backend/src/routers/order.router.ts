import { protectedProcedure, router, staffProcedure } from '../config/trpc.config';
import { CreateOrderSchema, OrderIdSchema, UpdateOrderStatusSchema } from '../models/order.model';

export const orderRouter = router({
  createOrder: protectedProcedure
    .input(CreateOrderSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.order.createOrder(ctx.user!.id, input);
    }),

  getOrderHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.services.order.getOrderHistory(ctx.user!.id);
  }),

  getOrderDetails: protectedProcedure
    .input(OrderIdSchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.order.getOrderDetails(ctx.user!.id, input.orderId);
    }),

  adminGetOrders: staffProcedure.query(async ({ ctx }) => {
    return ctx.services.order.adminGetOrders();
  }),

  adminUpdateOrderStatus: staffProcedure
    .input(UpdateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.order.adminUpdateOrderStatus(input);
    }),
});
