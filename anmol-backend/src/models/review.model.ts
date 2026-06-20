import { z } from 'zod';

export const AddReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
});

export const ListReviewsSchema = z.object({
  productId: z.string(),
  limit: z.number().optional().default(10),
  cursor: z.string().optional(),
});

export type AddReviewInput = z.infer<typeof AddReviewSchema>;
export type ListReviewsInput = z.infer<typeof ListReviewsSchema>;
