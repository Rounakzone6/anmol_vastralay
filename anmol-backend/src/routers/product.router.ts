import { router, staffProcedure, publicProcedure } from '../config/trpc.config';
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
} from '../models/product.model';

export const productRouter = router({
  list: publicProcedure
    .input(ListProductSchema.optional())
    .query(async ({ ctx, input }) => {
      return ctx.services.product.list(input);
    }),

  getById: publicProcedure
    .input(ProductIdSchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.product.getById(input.id);
    }),

  getBySlug: publicProcedure
    .input(ProductSlugSchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.product.getBySlug(input.slug);
    }),

  create: staffProcedure
    .input(productBaseSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.product.create(input);
    }),

  update: staffProcedure
    .input(UpdateProductSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.product.update(input);
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
});
