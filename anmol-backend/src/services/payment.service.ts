import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import crypto from 'crypto';
import { VerifyRazorpayPaymentSchema } from '../models/payment.model';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async getPaymentHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: true,
      },
    });
  }

  async verifyRazorpayPayment(userId: string, input: z.infer<typeof VerifyRazorpayPaymentSchema>) {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(input.razorpay_order_id + '|' + input.razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== input.razorpay_signature) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid payment signature' });
    }

    // Find the payment record
    const payment = await this.prisma.payment.findUnique({
      where: { transactionId: input.razorpay_order_id },
    });

    if (!payment || payment.userId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Payment record not found' });
    }

    // Update payment and order in transaction
    return this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'PROCESSING' },
      });

      return updatedPayment;
    });
  }
}
