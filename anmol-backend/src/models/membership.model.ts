import { z } from 'zod';

export const UpdateMembershipPlanSchema = z.object({
  name: z.string().min(2).optional(),
  price: z.number().min(0), // Dynamic membership fee (e.g. ₹1)
  durationDays: z.number().int().min(1).optional(), // Default: 365
  deliveryCharge: z.number().min(0).optional(), // Non-member delivery fee (e.g. ₹20)
  benefits: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const VerifyMembershipPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});
