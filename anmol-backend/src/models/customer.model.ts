import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(), // ISO date string
});

export const UploadProfileImageSchema = z.object({
  image: z.string().min(1), // base64 data URI
});

export const AddAddressSchema = z.object({
  label: z.string().default('Home'),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  zipCode: z.string().min(1),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  isDefault: z.boolean().optional(),
});

export const UpdateAddressSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  fullName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  isDefault: z.boolean().optional(),
});

export const DeleteAddressSchema = z.object({
  id: z.string(),
});

export const SetDefaultAddressSchema = z.object({
  id: z.string(),
});

export const SendOtpSchema = z.object({
  type: z.enum(['EMAIL', 'PHONE']),
  target: z.string().min(1),
});

export const VerifyOtpSchema = z.object({
  type: z.enum(['EMAIL', 'PHONE']),
  code: z.string().length(6),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export const DeleteAccountSchema = z.object({
  password: z.string().min(1),
  confirmText: z.string().refine((v) => v === 'DELETE', {
    message: 'Please type DELETE to confirm',
  }),
});
