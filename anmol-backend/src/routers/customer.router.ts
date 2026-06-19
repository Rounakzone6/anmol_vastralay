import { protectedProcedure, router } from '../config/trpc.config';
import { UpdateProfileSchema, AddAddressSchema } from '../models/customer.model';

export const customerRouter = router({
  updateProfile: protectedProcedure
    .input(UpdateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.customer.updateProfile(ctx.user!.id, input);
    }),

  getAddresses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.services.customer.getAddresses(ctx.user!.id);
  }),

  addAddress: protectedProcedure
    .input(AddAddressSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.customer.addAddress(ctx.user!.id, input);
    }),
});
