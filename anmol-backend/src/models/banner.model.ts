import { z } from 'zod';

export const BannerPlacementEnum = z.enum(['HERO', 'PROMO', 'CATEGORY']);

export const CreateBannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional().or(z.literal('')),
  buttonText: z.string().optional().or(z.literal('')),
  imageData: z.string().min(1, 'Image data is required'), // Base64 string for upload
  placement: BannerPlacementEnum.default('HERO'),
  linkUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const UpdateBannerSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required').optional(),
  subtitle: z.string().optional().or(z.literal('')),
  buttonText: z.string().optional().or(z.literal('')),
  imageData: z.string().optional(), // Base64 string for updating image
  placement: BannerPlacementEnum.optional(),
  linkUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});
