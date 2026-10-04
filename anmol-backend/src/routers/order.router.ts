import {
  protectedProcedure,
  router,
  staffProcedure,
} from '@backend/config/trpc.config';
import {
  CreateOrderSchema,
  GenerateInvoiceSchema,
  OrderIdSchema,
  UpdateOrderStatusSchema,
} from '@backend/models/order.model';

export const orderRouter = router({
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
      return ctx.services.order.adminUpdateOrderStatus(input);
    }),
});
