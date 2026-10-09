import { Injectable } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import crypto from 'crypto';
import { VerifyRazorpayPaymentSchema } from '@backend/models/payment.model';
import { InvoiceService } from '@backend/services/invoice.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceService: InvoiceService,
  ) {}

  async getPaymentHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderId: true,
        amount: true,
        status: true,
        paymentMethod: true,
        transactionId: true,
        createdAt: true,
        order: {
          select: { id: true, status: true, totalAmount: true },
        },
      },
    });
  }

  async adminGetPayments() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
    });
  }

  async verifyRazorpayPayment(
    userId: string,
    input: z.infer<typeof VerifyRazorpayPaymentSchema>,
  ) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Payment verification is not configured',
      });
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(input.razorpay_order_id + '|' + input.razorpay_payment_id)
      .digest('hex');

    const suppliedSignature = Buffer.from(input.razorpay_signature, 'utf8');
    const expectedSignature = Buffer.from(generatedSignature, 'utf8');
    if (
      suppliedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(suppliedSignature, expectedSignature)
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid payment signature',
      });
    }

    const payment = await this.prisma.payment.findUnique({
      where: { transactionId: input.razorpay_order_id },
    });

    if (!payment || payment.userId !== userId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Payment record not found',
      });
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const claimedPayment = await tx.payment.updateMany({
        where: { id: payment.id, status: 'PENDING' },
        data: { status: 'COMPLETED' },
      });

      if (claimedPayment.count === 0) {
        return tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
      }

      const order = await tx.order.updateMany({
        where: { id: payment.orderId, status: 'PENDING' },
        data: {
          status: 'PROCESSING',
        },
      });

      if (order.count > 0) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            status: 'PROCESSING',
            note: 'Payment confirmed and order is being prepared',
          },
        });

        const orderItems = await tx.orderItem.findMany({
          where: { orderId: payment.orderId, variantId: { not: null } },
          select: { variantId: true, quantity: true },
        });

        for (const item of orderItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQty: { decrement: item.quantity } },
            });
          }
        }
      }

      return tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
    });
    this.invoiceService.emailOrderInvoice(payment.orderId).catch((error) =>
      console.error('Failed to send paid order invoice email', error),
    );
    return result;
  }
}
