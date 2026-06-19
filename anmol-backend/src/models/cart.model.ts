import { z } from 'zod';

export const AddToCartSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().default(1),
});

export const UpdateCartQuantitySchema = z.object({
  cartItemId: z.string(),
  quantity: z.number().int().min(0),
});

export const RemoveFromCartSchema = z.object({
  cartItemId: z.string(),
});
