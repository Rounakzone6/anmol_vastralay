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
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(input.razorpay_order_id + '|' + input.razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== input.razorpay_signature) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid payment signature',
      });
    }

    // Find the payment record
    const payment = await this.prisma.payment.findUnique({
      where: { transactionId: input.razorpay_order_id },
    });

    if (!payment || payment.userId !== userId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Payment record not found',
      });
    }
    if (payment.status === 'COMPLETED') {
      return payment;
    }

    // Update payment and order in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      });

      const order = await tx.order.findUnique({
        where: { id: payment.orderId },
        include: { items: true },
      });

      if (order && order.status === 'PENDING') {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'PROCESSING',
            statusHistory: {
              create: {
                status: 'PROCESSING',
                note: 'Payment confirmed and order is being prepared',
              },
            },
          },
        });

        // Deduct inventory for online payments exactly once
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQty: { decrement: item.quantity } },
            });
          }
        }
      }

      return updatedPayment;
    });
    this.invoiceService.emailOrderInvoice(payment.orderId).catch((error) =>
      console.error('Failed to send paid order invoice email', error),
    );
    return result;
  }
}
