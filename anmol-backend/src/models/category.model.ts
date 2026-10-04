import { z } from 'zod';

export const ListCategorySchema = z.object({
  includeInactive: z.boolean().optional(),
  search: z.string().optional(),
});

export const CategoryIdSchema = z.object({ id: z.string() });
export const CategorySlugSchema = z.object({ slug: z.string() });

export const CreateCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const UpdateCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const DeleteCategorySchema = z.object({
  id: z.string(),
  hard: z.boolean().optional(),
});

export const ReorderCategorySchema = z.array(
  z.object({
    id: z.string(),
    sortOrder: z.number(),
  }),
);

export const CreateSubcategorySchema = z.object({
  name: z.string().min(2),
  categoryId: z.string(),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const UpdateSubcategorySchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const CreateItemTypeSchema = z.object({
  name: z.string().min(2),
  subcategoryId: z.string(),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const UpdateItemTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});
