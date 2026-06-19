import { z } from 'zod';

export const InteractionTypeEnum = z.enum(['VIEW', 'ADD_TO_CART', 'PURCHASE']);

export const RecordVisitSchema = z.object({
  sessionId: z.string(),
  userAgent: z.string().optional(),
});

export const RecordInteractionSchema = z.object({
  productId: z.string(),
  sessionId: z.string().optional(),
  action: InteractionTypeEnum,
});
