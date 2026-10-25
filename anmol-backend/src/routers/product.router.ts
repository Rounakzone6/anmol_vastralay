import {
  router,
  staffProcedure,
  publicProcedure,
} from '@backend/config/trpc.config';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  ListProductSchema,
  productBaseSchema,
  UpdateProductSchema,
  DeleteProductSchema,
  SetProductActiveSchema,
  UpsertVariantSchema,
  DeleteVariantSchema,
  AdjustStockSchema,
  UploadImageSchema,
  AddImageSchema,
  RemoveImageSchema,
  ProductIdSchema,
  ProductSlugSchema,
} from '@backend/models/product.model';

export const productRouter = router({
  list: publicProcedure
    .input(ListProductSchema.optional())
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.user?.role === 'STAFF' || ctx.user?.role === 'ADMIN';
      return ctx.services.product.list(input, isStaff);
    }),

  getSitemapProducts: publicProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(1000).default(500),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.services.product.getSitemapProducts(
        input?.page ?? 1,
        input?.pageSize ?? 500,
      );
    }),

  searchSuggestions: publicProcedure
    .input(
      z.object({
        query: z.string().default(''),
        limit: z.number().int().min(1).max(20).default(6),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.services.product.searchSuggestions(input.query, input.limit);
    }),

  getById: publicProcedure
    .input(ProductIdSchema)
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.user?.role === 'STAFF' || ctx.user?.role === 'ADMIN';
      return ctx.services.product.getById(input.id, isStaff);
    }),

  getBySlug: publicProcedure
    .input(ProductSlugSchema)
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.user?.role === 'STAFF' || ctx.user?.role === 'ADMIN';
      return ctx.services.product.getBySlug(input.slug, isStaff);
    }),

  getRecommendations: publicProcedure
    .input(ProductIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.product.getRecommendations(input.id);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch recommendations',
        });
      }
    }),

  getOutOfStockVariants: staffProcedure.query(async ({ ctx }) => {
    return ctx.services.product.getOutOfStockVariants();
  }),

  create: staffProcedure
    .input(productBaseSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.product.create(input, ctx.user.id);
    }),

  update: staffProcedure
    .input(UpdateProductSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.product.update(input, ctx.user.id);
    }),

  delete: staffProcedure
    .input(DeleteProductSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.product.delete(input);
    }),

  setActive: staffProcedure
    .input(SetProductActiveSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.product.setActive(input);
    }),

  upsertVariant: staffProcedure
    .input(UpsertVariantSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.product.upsertVariant(input);
    }),

  deleteVariant: staffProcedure
    .input(DeleteVariantSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.product.deleteVariant(input);
    }),

  adjustStock: staffProcedure
    .input(AdjustStockSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.product.adjustStock(input);
    }),

  uploadImage: staffProcedure
    .input(UploadImageSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.product.uploadImage(input);
    }),

  addImage: staffProcedure
    .input(AddImageSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.product.addImage(input);
    }),

  removeImage: staffProcedure
    .input(RemoveImageSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.product.removeImage(input);
    }),

  generateAiDetails: staffProcedure
    .input(
      z.object({
        imageUrl: z.string().optional().nullable(),
        categoryName: z.string().optional(),
        name: z.string().optional(),
        brand: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.services.ai.generateProductDetails({
          imageUrl: input.imageUrl || undefined,
          categoryName: input.categoryName,
          name: input.name,
          brand: input.brand,
          description: input.description,
        });
      } catch (error: any) {
        console.error('Error in generateAiDetails:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error.message || 'Failed to generate product details using AI',
        });
      }
    }),
});
