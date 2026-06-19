import {
  Prisma,
  Product,
  ProductImage,
  ProductVariant,
  ProductKind,
} from '@prisma/client';
import { z } from 'zod';
import { withProductPricing } from '../utils/pricing';

export const variantInputSchema = z.object({
  color: z.string().min(1),
  size: z.string().optional(),
  stockQty: z.number().int().min(0).default(0),
  sku: z.string().optional(),
});

export const productBaseSchema = z.object({
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

export const ListProductSchema = z.object({
  categoryId: z.string().optional(),
  categorySlug: z.string().optional(),
  kind: z.nativeEnum(ProductKind).optional(),
  search: z.string().optional(),
  includeInactive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  cursor: z.number().nullish(),
});

export const ProductIdSchema = z.object({ id: z.string() });
export const ProductSlugSchema = z.object({ slug: z.string() });


export const UpdateProductSchema = productBaseSchema
  .partial()
  .extend({ id: z.string() })
  .required({ id: true });

export const DeleteProductSchema = z.object({ id: z.string(), hard: z.boolean().optional() });
export const SetProductActiveSchema = z.object({ id: z.string(), isActive: z.boolean() });

export const UpsertVariantSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  color: z.string().min(1),
  size: z.string().optional(),
  stockQty: z.number().int().min(0),
  sku: z.string().optional(),
});

export const DeleteVariantSchema = z.object({ variantId: z.string() });
export const AdjustStockSchema = z.object({
  variantId: z.string(),
  delta: z.number().int(),
});

export const UploadImageSchema = z.object({
  dataUri: z.string().min(10),
  folder: z.string().optional(),
});

export const AddImageSchema = z.object({
  productId: z.string(),
  url: z.string().url(),
  publicId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const RemoveImageSchema = z.object({
  imageId: z.string(),
  deleteFromCloudinary: z.boolean().optional(),
});

type ProductWithRelations = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
  category?: { id: string; name: string; slug: string };
};

export function mapVariant(variant: ProductVariant) {
  return {
    ...variant,
    stockQty: variant.stockQty,
  };
}

export function mapProduct(product: ProductWithRelations) {
  const priced = withProductPricing(product);
  const extraSayaPrice =
    product.extraSayaPrice != null ? Number(product.extraSayaPrice) : null;

  return {
    ...priced,
    extraSayaPrice,
    allowsExtraSaya: product.allowsExtraSaya,
    images: product.images.sort((a, b) => a.sortOrder - b.sortOrder),
    variants: product.variants.map(mapVariant),
    category: product.category,
  };
}

export function variantSizeKey(
  kind: 'SAREE' | 'STANDARD',
  size?: string | null,
): string {
  if (kind === 'SAREE') return '';
  return size ?? '';
}

export const productInclude = {
  images: true,
  variants: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductInclude;
