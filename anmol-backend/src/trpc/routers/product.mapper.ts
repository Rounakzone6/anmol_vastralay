import type {
  GarmentSize,
  Prisma,
  Product,
  ProductImage,
  ProductVariant,
} from '@prisma/client';
import { withProductPricing } from '../../common/pricing';

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
  size?: GarmentSize | null,
): string {
  if (kind === 'SAREE') return '';
  return size ?? '';
}

export const productInclude = {
  images: true,
  variants: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductInclude;
