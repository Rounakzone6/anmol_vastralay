import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const orderRouter = router({
  createOrder: protectedProcedure
    .input(z.object({
      shippingAddress: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Get user cart
      const cart = await ctx.prisma.cart.findUnique({
        where: { userId: ctx.user!.id },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });
      }

      // 2. Calculate total amount
      let totalAmount = 0;
      for (const item of cart.items) {
        // using product netPrice
        const price = Number(item.product.netPrice);
        totalAmount += price * item.quantity;
      }

      // 3. Create order in transaction
      return ctx.prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId: ctx.user!.id,
            totalAmount,
            shippingAddress: input.shippingAddress,
            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.product.netPrice,
              })),
            },
          },
        });

        // 4. Clear cart
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        return order;
      });
    }),

  getOrderHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.order.findMany({
      where: { userId: ctx.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
  }),

  getOrderDetails: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          payments: true,
        },
      });

      if (!order || order.userId !== ctx.user!.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
      }

      return order;
    }),
});
