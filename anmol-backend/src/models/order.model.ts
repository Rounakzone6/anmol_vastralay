import { z } from 'zod';

export const CreateOrderSchema = z.object({
  shippingAddress: z.string(),
  paymentMethod: z.enum(['COD', 'RAZORPAY']),
  couponCode: z.string().optional(),
});

export const ValidateCouponSchema = z.object({
  code: z.string().min(1),
});

export const OrderIdSchema = z.object({ orderId: z.string() });

export const GenerateInvoiceSchema = OrderIdSchema;

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum([
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
  ]),
});
