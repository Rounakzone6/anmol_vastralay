import { router, staffProcedure, publicProcedure } from '../config/trpc.config';
import {
  ListCategorySchema,
  CategoryIdSchema,
  CategorySlugSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  DeleteCategorySchema,
} from '../models/category.model';

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

  seedDefaults: staffProcedure.mutation(async ({ ctx }) => {
    return ctx.services.category.seedDefaults();
  }),
});
