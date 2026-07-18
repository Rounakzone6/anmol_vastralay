import { router, staffProcedure, publicProcedure } from '@backend/config/trpc.config';
import {
  ListCategorySchema,
  CategoryIdSchema,
  CategorySlugSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  DeleteCategorySchema,
  CreateSubcategorySchema,
  UpdateSubcategorySchema,
  CreateItemTypeSchema,
  UpdateItemTypeSchema,
  ReorderCategorySchema,
} from '@backend/models/category.model';
import { z } from 'zod';

export const categoryRouter = router({
  list: publicProcedure
    .input(ListCategorySchema.optional())
    .query(async ({ ctx, input }) => {
      return ctx.services.category.list(input);
    }),

  getById: publicProcedure
    .input(CategoryIdSchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.category.getById(input.id);
    }),

  getBySlug: publicProcedure
    .input(CategorySlugSchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.category.getBySlug(input.slug);
    }),

  create: staffProcedure
    .input(CreateCategorySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.category.create(input);
    }),

  update: staffProcedure
    .input(UpdateCategorySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.category.update(input);
    }),

  delete: staffProcedure
    .input(DeleteCategorySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.category.delete(input);
    }),

  reorder: staffProcedure
    .input(ReorderCategorySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.category.reorder(input);
    }),

  seedDefaults: staffProcedure.mutation(async ({ ctx }) => {
    return ctx.services.category.seedDefaults();
  }),

  createSubcategory: staffProcedure
    .input(CreateSubcategorySchema)
    .mutation(async ({ ctx, input }) =>
      ctx.services.category.createSubcategory(input),
    ),

  updateSubcategory: staffProcedure
    .input(UpdateSubcategorySchema)
    .mutation(async ({ ctx, input }) =>
      ctx.services.category.updateSubcategory(input),
    ),

  deleteSubcategory: staffProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) =>
      ctx.services.category.deleteSubcategory(input.id),
    ),

  createItemType: staffProcedure
    .input(CreateItemTypeSchema)
    .mutation(async ({ ctx, input }) =>
      ctx.services.category.createItemType(input),
    ),

  updateItemType: staffProcedure
    .input(UpdateItemTypeSchema)
    .mutation(async ({ ctx, input }) =>
      ctx.services.category.updateItemType(input),
    ),

  deleteItemType: staffProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) =>
      ctx.services.category.deleteItemType(input.id),
    ),
});
