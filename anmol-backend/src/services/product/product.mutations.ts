import { PrismaService } from '@backend/services/prisma.service';
import { CloudinaryService } from '@backend/services/cloudinary.service';
import { badRequest, notFound } from '@backend/config/trpc.config';
import { uniqueSlug } from '@backend/utils/slug';
import { ProductKind } from '@prisma/client';
import { z } from 'zod';
import {
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
  mapProduct,
  productInclude,
  variantSizeKey,
  variantInputSchema,
} from '@backend/models/product.model';
import {
  MAX_PRODUCT_IMAGES,
  validateProductImages,
} from '@backend/utils/product-images';

export class ProductMutations {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private validateProductVariants(
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

  async create(input: z.infer<typeof productBaseSchema>, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) notFound('Category');

    const allowsExtraSaya =
      input.allowsExtraSaya ?? input.kind === ProductKind.SAREE;
    this.validateProductVariants(
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
        const row = await this.prisma.product.findUnique({
          where: { slug: s },
        });
        return Boolean(row);
      }));

    let authorId: string | null = null;
    if (userId) {
      const validUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      authorId = validUser?.id ?? null;
    }

    const product = await this.prisma.product.create({
      data: {
        name: input.name,
        slug,
        brand: input.brand,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId || null,
        description: input.description,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,

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
        createdById: authorId,
        updatedById: authorId,
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
  }

  async update(input: z.infer<typeof UpdateProductSchema>, userId: string) {
    const existing = await this.prisma.product.findUnique({
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
      this.validateProductVariants(
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
      const category = await this.prisma.category.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) notFound('Category');
    }

    const slug = input.slug;
    if (slug) {
      const clash = await this.prisma.product.findFirst({
        where: { slug, NOT: { id: input.id } },
      });
      if (clash) badRequest('Slug already in use');
    }

    let updaterId: string | null = null;
    if (userId) {
      const validUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      updaterId = validUser?.id ?? null;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: input.id },
        data: {
          name: input.name,
          slug,
          brand: input.brand,
          categoryId: input.categoryId,
          subcategoryId:
            input.subcategoryId !== undefined ? input.subcategoryId : undefined,
          description: input.description,
          metaTitle: input.metaTitle,
          metaDescription: input.metaDescription,

          kind: input.kind,
          netPrice: input.netPrice,
          discountPercent: input.discountPercent,
          allowsExtraSaya,
          extraSayaPrice:
            allowsExtraSaya && extraSayaPrice != null ? extraSayaPrice : null,
          updatedById: updaterId,
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
              await this.cloudinary.deleteImage(img.publicId);
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

    const product = await this.prisma.product.findUnique({
      where: { id: input.id },
      include: productInclude,
    });
    return mapProduct(product!);
  }

  async delete(input: z.infer<typeof DeleteProductSchema>) {
    const existing = await this.prisma.product.findUnique({
      where: { id: input.id },
      include: { images: true },
    });
    if (!existing) notFound('Product');

    if (input.hard) {
      // Clean up images from Cloudinary to save space on free tier
      if (existing.images && existing.images.length > 0) {
        for (const img of existing.images) {
          if (img.publicId) {
            try {
              await this.cloudinary.deleteImage(img.publicId);
            } catch {
              // ignore cloudinary cleanup errors if image is already deleted
            }
          }
        }
      }
      
      await this.prisma.product.delete({ where: { id: input.id } });
      return { success: true };
    }

    await this.prisma.product.update({
      where: { id: input.id },
      data: { isActive: false },
    });
    return { success: true };
  }

  async setActive(input: z.infer<typeof SetProductActiveSchema>) {
    const existing = await this.prisma.product.findUnique({
      where: { id: input.id },
    });
    if (!existing) notFound('Product');
    return this.prisma.product.update({
      where: { id: input.id },
      data: { isActive: input.isActive },
    });
  }

  async upsertVariant(input: z.infer<typeof UpsertVariantSchema>) {
    const product = await this.prisma.product.findUnique({
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
      return this.prisma.productVariant.update({
        where: { id: input.variantId },
        data: {
          color: input.color,
          size: input.size ?? null,
          sizeKey,
          stockQty: input.stockQty,
          sku: input.sku,
        },
      });
    }

    return this.prisma.productVariant.create({
      data: {
        productId: input.productId,
        color: input.color,
        size: input.size ?? null,
        sizeKey,
        stockQty: input.stockQty,
        sku: input.sku,
      },
    });
  }

  async deleteVariant(input: z.infer<typeof DeleteVariantSchema>) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: input.variantId },
    });
    if (!variant) notFound('Variant');
    await this.prisma.productVariant.delete({
      where: { id: input.variantId },
    });
    return { success: true };
  }

  async adjustStock(input: z.infer<typeof AdjustStockSchema>) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: input.variantId },
    });
    if (!variant) notFound('Variant');

    const stockQty = Math.max(0, variant.stockQty + input.delta);
    return this.prisma.productVariant.update({
      where: { id: input.variantId },
      data: { stockQty },
    });
  }

  async uploadImage(input: z.infer<typeof UploadImageSchema>) {
    return this.cloudinary.uploadImage(input.dataUri, input.folder);
  }

  async addImage(input: z.infer<typeof AddImageSchema>) {
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
    });
    if (!product) notFound('Product');

    const count = await this.prisma.productImage.count({
      where: { productId: input.productId },
    });
    if (count >= MAX_PRODUCT_IMAGES) {
      badRequest(`Maximum ${MAX_PRODUCT_IMAGES} images per product`);
    }

    return this.prisma.productImage.create({
      data: {
        productId: input.productId,
        url: input.url,
        publicId: input.publicId,
        sortOrder: input.sortOrder ?? count,
      },
    });
  }

  async removeImage(input: z.infer<typeof RemoveImageSchema>) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: input.imageId },
    });
    if (!image) notFound('Image');

    if (input.deleteFromCloudinary && image.publicId) {
      await this.cloudinary.deleteImage(image.publicId);
    }

    await this.prisma.productImage.delete({ where: { id: input.imageId } });
    return { success: true };
  }
}
