import { z } from 'zod';
import { adminProcedure, publicProcedure, router } from '../config/trpc.config';
import {
  BannerPlacementEnum,
  CreateBannerSchema,
  UpdateBannerSchema,
} from '../models/banner.model';

export const bannerRouter = router({
  getBanners: publicProcedure
    .input(z.object({ placement: BannerPlacementEnum.optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.services.banner.getBanners(input?.placement);
    }),

  adminGetBanners: adminProcedure.query(async ({ ctx }) => {
    return ctx.services.banner.adminGetBanners();
  }),

  adminSeedBanners: adminProcedure.mutation(async ({ ctx }) => {
    return ctx.services.banner.seedBanners();
  }),

  adminCreateBanner: adminProcedure
    .input(CreateBannerSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.banner.createBanner(input);
    }),

  adminUpdateBanner: adminProcedure
    .input(UpdateBannerSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.banner.updateBanner(input);
    }),

  adminDeleteBanner: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.banner.deleteBanner(input.id);
    }),
});
