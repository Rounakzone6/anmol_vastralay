import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const cartRouter = router({
  getCart: protectedProcedure.query(async ({ ctx }) => {
    let cart = await ctx.prisma.cart.findUnique({
      where: { userId: ctx.user!.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await ctx.prisma.cart.create({
        data: { userId: ctx.user!.id },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });
    }

    return cart;
  }),

  addToCart: protectedProcedure
    .input(z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      quantity: z.number().int().positive().default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      let cart = await ctx.prisma.cart.findUnique({
        where: { userId: ctx.user!.id },
      });

      if (!cart) {
        cart = await ctx.prisma.cart.create({
          data: { userId: ctx.user!.id },
        });
      }

      // Check if item already exists
      const existingItem = await ctx.prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: input.productId,
          variantId: input.variantId || null,
        },
      });

      if (existingItem) {
        return ctx.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + input.quantity },
        });
      }

      return ctx.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: input.productId,
          variantId: input.variantId || null,
          quantity: input.quantity,
        },
      });
    }),

  updateQuantity: protectedProcedure
    .input(z.object({
      cartItemId: z.string(),
      quantity: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      // Ensure the item belongs to user's cart
      const cartItem = await ctx.prisma.cartItem.findUnique({
        where: { id: input.cartItemId },
        include: { cart: true },
      });

      if (!cartItem || cartItem.cart.userId !== ctx.user!.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cart item not found' });
      }

      if (input.quantity <= 0) {
        await ctx.prisma.cartItem.delete({
          where: { id: input.cartItemId },
        });
        return { deleted: true };
      }

      return ctx.prisma.cartItem.update({
        where: { id: input.cartItemId },
        data: { quantity: input.quantity },
      });
    }),

  removeFromCart: protectedProcedure
    .input(z.object({ cartItemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const cartItem = await ctx.prisma.cartItem.findUnique({
        where: { id: input.cartItemId },
        include: { cart: true },
      });

      if (!cartItem || cartItem.cart.userId !== ctx.user!.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cart item not found' });
      }

      await ctx.prisma.cartItem.delete({
        where: { id: input.cartItemId },
      });

      return { success: true };
    }),

  clearCart: protectedProcedure.mutation(async ({ ctx }) => {
    const cart = await ctx.prisma.cart.findUnique({
      where: { userId: ctx.user!.id },
    });

    if (cart) {
      await ctx.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return { success: true };
  }),
});
