import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const customerRouter = router({
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.user!.id },
        data: input,
        select: { id: true, email: true, name: true, role: true },
      });
    }),

  getAddresses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.address.findMany({
      where: { userId: ctx.user!.id },
      orderBy: { createdAt: 'desc' },
    });
  }),

  addAddress: protectedProcedure
    .input(z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      country: z.string(),
      zipCode: z.string(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.isDefault) {
        await ctx.prisma.address.updateMany({
          where: { userId: ctx.user!.id },
          data: { isDefault: false },
        });
      }
      return ctx.prisma.address.create({
        data: {
          ...input,
          userId: ctx.user!.id,
        },
      });
    }),
});
