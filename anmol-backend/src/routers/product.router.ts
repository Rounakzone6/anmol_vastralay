import { GarmentSize, ProductKind } from '@prisma/client';
import { z } from 'zod';
import { uniqueSlug } from '../utils/slug';
import { badRequest, notFound, router, staffProcedure, publicProcedure } from '../config/trpc.config';
import { mapProduct, productInclude, variantSizeKey } from '../models/product.mapper';
import { MAX_PRODUCT_IMAGES, validateProductImages } from '../utils/product-images';

const garmentSizeSchema = z.nativeEnum(GarmentSize);

const variantInputSchema = z.object({
  color: z.string().min(1),
  size: garmentSizeSchema.optional(),
  stockQty: z.number().int().min(0).default(0),
  sku: z.string().optional(),
});

const productBaseSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string(),
  kind: z.nativeEnum(ProductKind),
  netPrice: z.number().positive(),
  discountPercent: z.number().min(0).max(100).default(0),
  allowsExtraSaya: z.boolean().optional(),
  extraSayaPrice: z.number().positive().optional(),
  variants: z.array(variantInputSchema).optional(),
  imageUrls: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .optional(),
});

function validateProductVariants(
  kind: ProductKind,
  allowsExtraSaya: boolean,
  extraSayaPrice: number | null | undefined,
  variants: z.infer<typeof variantInputSchema>[] | undefined,
): void {
  if (kind === ProductKind.SAREE) {
    if (variants?.some((v) => v.size != null)) {
      badRequest('Saree variants use color only — do not set size');
    }
    if (allowsExtraSaya && extraSayaPrice == null) {
      badRequest('Set extraSayaPrice when allowsExtraSaya is enabled');
    }
    return;
  }

  if (allowsExtraSaya) {
    badRequest('Extra saya is only available for saree products');
  }

  if (!variants?.length) {
    badRequest('Standard products need at least one variant (color + size)');
  }

  for (const v of variants) {
    if (!v.size) {
      badRequest('Each standard variant must include a size.');
    }
  }
}

export const productRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          categoryId: z.string().optional(),
          categorySlug: z.string().optional(),
          kind: z.nativeEnum(ProductKind).optional(),
          search: z.string().optional(),
          includeInactive: z.boolean().optional(),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(100).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const where = {
        ...(input?.includeInactive ? {} : { isActive: true }),
        ...(input?.categoryId ? { categoryId: input.categoryId } : {}),
        ...(input?.categorySlug ? { category: { slug: input.categorySlug } } : {}),
        ...(input?.kind ? { kind: input.kind } : {}),
        ...(input?.search
          ? { name: { contains: input.search, mode: 'insensitive' as const } }
          : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.product.findMany({
          where,
          include: productInclude,
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.prisma.product.count({ where }),
      ]);

      return {
        items: items.map(mapProduct),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.id },
        include: productInclude,
      });
      if (!product) notFound('Product');
      return mapProduct(product);
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { slug: input.slug },
        include: productInclude,
      });
      if (!product) notFound('Product');
      return mapProduct(product);
    }),

  create: staffProcedure
    .input(productBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) notFound('Category');

      const allowsExtraSaya =
        input.allowsExtraSaya ?? input.kind === ProductKind.SAREE;
      validateProductVariants(
        input.kind,
        allowsExtraSaya,
        input.extraSayaPrice,
        input.variants,
      );
      const imageUrls = validateProductImages(input.imageUrls, {
        required: true,
      });

      const slug =
        input.slug?.trim() ||
        (await uniqueSlug(input.name, async (s) => {
          const row = await ctx.prisma.product.findUnique({
            where: { slug: s },
          });
          return Boolean(row);
        }));

      const product = await ctx.prisma.product.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          categoryId: input.categoryId,
          kind: input.kind,
          netPrice: input.netPrice,
          discountPercent: input.discountPercent,
          allowsExtraSaya,
          extraSayaPrice:
            allowsExtraSaya && input.extraSayaPrice != null
              ? input.extraSayaPrice
              : null,
          variants: input.variants?.length
            ? {
                create: input.variants.map((v) => ({
                  color: v.color,
                  size: input.kind === ProductKind.STANDARD ? v.size : null,
                  sizeKey: variantSizeKey(input.kind, v.size),
                  stockQty: v.stockQty,
                  sku: v.sku,
                })),
              }
            : undefined,
          images: {
            create: imageUrls.map((img, i) => ({
              url: img.url,
              publicId: img.publicId,
              sortOrder: img.sortOrder ?? i,
            })),
          },
        },
        include: productInclude,
      });

      return mapProduct(product);
    }),

  update: staffProcedure
    .input(
      productBaseSchema
        .partial()
        .extend({ id: z.string() })
        .required({ id: true }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.product.findUnique({
        where: { id: input.id },
        include: { variants: true, images: true },
      });
      if (!existing) notFound('Product');

      const imageUrls =
        input.imageUrls !== undefined
          ? validateProductImages(input.imageUrls, {
              required: existing.images.length === 0,
            })
          : undefined;

      const kind = input.kind ?? existing.kind;
      const allowsExtraSaya = input.allowsExtraSaya ?? existing.allowsExtraSaya;
      const extraSayaPrice =
        input.extraSayaPrice !== undefined
          ? input.extraSayaPrice
          : existing.extraSayaPrice != null
            ? Number(existing.extraSayaPrice)
            : null;

      if (input.variants) {
        validateProductVariants(
          kind,
          allowsExtraSaya,
          extraSayaPrice,
          input.variants,
        );
      } else if (
        kind === ProductKind.SAREE &&
        allowsExtraSaya &&
        extraSayaPrice == null
      ) {
        badRequest('Set extraSayaPrice when allowsExtraSaya is enabled');
      } else if (kind === ProductKind.STANDARD && allowsExtraSaya) {
        badRequest('Extra saya is only available for saree products');
      }

      if (input.categoryId) {
        const category = await ctx.prisma.category.findUnique({
          where: { id: input.categoryId },
        });
        if (!category) notFound('Category');
      }

      const slug = input.slug;
      if (slug) {
        const clash = await ctx.prisma.product.findFirst({
          where: { slug, NOT: { id: input.id } },
        });
        if (clash) badRequest('Slug already in use');
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: input.id },
          data: {
            name: input.name,
            slug,
            description: input.description,
            categoryId: input.categoryId,
            kind: input.kind,
            netPrice: input.netPrice,
            discountPercent: input.discountPercent,
            allowsExtraSaya,
            extraSayaPrice:
              allowsExtraSaya && extraSayaPrice != null ? extraSayaPrice : null,
          },
        });

        if (input.variants) {
          await tx.productVariant.deleteMany({
            where: { productId: input.id },
          });
          await tx.productVariant.createMany({
            data: input.variants.map((v) => ({
              productId: input.id,
              color: v.color,
              size: kind === ProductKind.STANDARD ? v.size! : null,
              sizeKey: variantSizeKey(kind, v.size),
              stockQty: v.stockQty,
              sku: v.sku,
            })),
          });
        }

        if (imageUrls !== undefined) {
          const oldImages = await tx.productImage.findMany({
            where: { productId: input.id },
          });
          for (const img of oldImages) {
            if (img.publicId) {
              try {
                await ctx.cloudinary.deleteImage(img.publicId);
              } catch {
                /* ignore cloudinary cleanup errors */
              }
            }
          }
          await tx.productImage.deleteMany({ where: { productId: input.id } });
          if (imageUrls.length > 0) {
            await tx.productImage.createMany({
              data: imageUrls.map((img, i) => ({
                productId: input.id,
                url: img.url,
                publicId: img.publicId,
                sortOrder: img.sortOrder ?? i,
              })),
            });
          }
        }
      });

      const product = await ctx.prisma.product.findUnique({
        where: { id: input.id },
        include: productInclude,
      });
      return mapProduct(product!);
    }),

  delete: staffProcedure
    .input(z.object({ id: z.string(), hard: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.product.findUnique({
        where: { id: input.id },
      });
      if (!existing) notFound('Product');

      if (input.hard) {
        await ctx.prisma.product.delete({ where: { id: input.id } });
        return { success: true };
      }

      await ctx.prisma.product.update({
        where: { id: input.id },
        data: { isActive: false },
      });
      return { success: true };
    }),

  setActive: staffProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.product.findUnique({
        where: { id: input.id },
      });
      if (!existing) notFound('Product');
      return ctx.prisma.product.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),

  upsertVariant: staffProcedure
    .input(
      z.object({
        productId: z.string(),
        variantId: z.string().optional(),
        color: z.string().min(1),
        size: garmentSizeSchema.optional(),
        stockQty: z.number().int().min(0),
        sku: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
      });
      if (!product) notFound('Product');

      if (product.kind === ProductKind.SAREE && input.size) {
        badRequest('Saree variants cannot have a size');
      }
      if (product.kind === ProductKind.STANDARD && !input.size) {
        badRequest('Standard variants require a size');
      }

      const sizeKey = variantSizeKey(product.kind, input.size);

      if (input.variantId) {
        const variant = await ctx.prisma.productVariant.update({
          where: { id: input.variantId },
          data: {
            color: input.color,
            size: input.size ?? null,
            sizeKey,
            stockQty: input.stockQty,
            sku: input.sku,
          },
        });
        return variant;
      }

      return ctx.prisma.productVariant.create({
        data: {
          productId: input.productId,
          color: input.color,
          size: input.size ?? null,
          sizeKey,
          stockQty: input.stockQty,
          sku: input.sku,
        },
      });
    }),

  deleteVariant: staffProcedure
    .input(z.object({ variantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const variant = await ctx.prisma.productVariant.findUnique({
        where: { id: input.variantId },
      });
      if (!variant) notFound('Variant');
      await ctx.prisma.productVariant.delete({
        where: { id: input.variantId },
      });
      return { success: true };
    }),

  adjustStock: staffProcedure
    .input(
      z.object({
        variantId: z.string(),
        delta: z.number().int(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const variant = await ctx.prisma.productVariant.findUnique({
        where: { id: input.variantId },
      });
      if (!variant) notFound('Variant');

      const stockQty = Math.max(0, variant.stockQty + input.delta);
      return ctx.prisma.productVariant.update({
        where: { id: input.variantId },
        data: { stockQty },
      });
    }),

  uploadImage: staffProcedure
    .input(
      z.object({
        dataUri: z.string().min(10),
        folder: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.cloudinary.uploadImage(input.dataUri, input.folder);
    }),

  addImage: staffProcedure
    .input(
      z.object({
        productId: z.string(),
        url: z.string().url(),
        publicId: z.string().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
      });
      if (!product) notFound('Product');

      const count = await ctx.prisma.productImage.count({
        where: { productId: input.productId },
      });
      if (count >= MAX_PRODUCT_IMAGES) {
        badRequest(`Maximum ${MAX_PRODUCT_IMAGES} images per product`);
      }

      return ctx.prisma.productImage.create({
        data: {
          productId: input.productId,
          url: input.url,
          publicId: input.publicId,
          sortOrder: input.sortOrder ?? count,
        },
      });
    }),

  removeImage: staffProcedure
    .input(
      z.object({
        imageId: z.string(),
        deleteFromCloudinary: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.prisma.productImage.findUnique({
        where: { id: input.imageId },
      });
      if (!image) notFound('Image');

      if (input.deleteFromCloudinary && image.publicId) {
        await ctx.cloudinary.deleteImage(image.publicId);
      }

      await ctx.prisma.productImage.delete({ where: { id: input.imageId } });
      return { success: true };
    }),
});
