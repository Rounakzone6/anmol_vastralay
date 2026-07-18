import { protectedProcedure, router } from '@backend/config/trpc.config';
import {
  AddToCartSchema,
  UpdateCartQuantitySchema,
  RemoveFromCartSchema,
} from '@backend/models/cart.model';

export const cartRouter = router({
  getCart: protectedProcedure.query(async ({ ctx }) => {
    return ctx.services.cart.getCart(ctx.user.id);
  }),

  addToCart: protectedProcedure
    .input(AddToCartSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.cart.addToCart(ctx.user.id, input);
    }),

  updateQuantity: protectedProcedure
    .input(UpdateCartQuantitySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.cart.updateQuantity(ctx.user.id, input);
    }),

  removeFromCart: protectedProcedure
    .input(RemoveFromCartSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.cart.removeFromCart(ctx.user.id, input);
    }),

  clearCart: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.services.cart.clearCart(ctx.user.id);
  }),
});
