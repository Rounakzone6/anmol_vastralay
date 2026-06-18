import { badRequest } from '../config/trpc.config';

export const MAX_PRODUCT_IMAGES = 4;

export type ProductImageInput = {
  url: string;
  publicId?: string;
  sortOrder?: number;
};

export function validateProductImages(
  images: ProductImageInput[] | undefined,
  options: { required: boolean },
): ProductImageInput[] {
  const list = images ?? [];

  if (list.length > MAX_PRODUCT_IMAGES) {
    badRequest(`Maximum ${MAX_PRODUCT_IMAGES} images allowed per product`);
  }

  if (options.required && list.length === 0) {
    badRequest('Main product image is required (upload image 1)');
  }

  if (options.required && !list[0]?.url) {
    badRequest('Main product image is required (upload image 1)');
  }

  return list.map((img, i) => ({
    url: img.url,
    publicId: img.publicId,
    sortOrder: img.sortOrder ?? i,
  }));
}
