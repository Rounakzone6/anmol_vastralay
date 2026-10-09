import { z } from 'zod';

export const LoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(6),
});

export const RegisterSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
    name: z.string().min(2),
    password: z.string().min(6),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Either email or phone number is required',
  });

export const GoogleAuthSchema = z.object({
  credential: z.string().min(1),
});

export const VerifyOtpSchema = z.object({
  email: z.string().min(1),
  code: z.string().min(6).max(6),
  type: z.enum(['LOGIN', 'REGISTER']),
});
