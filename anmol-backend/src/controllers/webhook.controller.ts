import { Controller, Post, Req, Res, Headers, Logger } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { PrismaService } from '@backend/services/prisma.service';

@Controller('api/webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private prisma: PrismaService) {}

  @Post('razorpay')
  async handleRazorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

      // If no secret is configured, just warn and return 200 to prevent retries
      if (!secret) {
        this.logger.warn('RAZORPAY_WEBHOOK_SECRET is not configured');
        return res.status(200).send('OK');
      }

      if (!req.rawBody) {
        this.logger.error(
          'rawBody is missing. Ensure NestFactory is configured with { rawBody: true }',
        );
        return res.status(400).send('Bad Request');
      }

      if (!signature) {
        this.logger.error('Missing razorpay signature header');
        return res.status(400).send('Missing signature');
      }

      // Verify the signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(req.rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        this.logger.error('Invalid webhook signature');
        return res.status(400).send('Invalid signature');
      }

      const payload = req.body;
      const event = payload.event;
      this.logger.log(`Received Razorpay webhook event: ${event}`);

      // Handle specific payment events
      if (event === 'payment.captured' || event === 'payment.authorized') {
        const paymentEntity = payload.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;

        if (razorpayOrderId) {
          await this.prisma.$transaction(async (tx) => {
            // Update payment status to COMPLETED
            await tx.payment.updateMany({
              where: { transactionId: razorpayOrderId },
              data: { status: 'COMPLETED' },
            });

            // Safely update the parent order status to PROCESSING and deduct inventory
            const payments = await tx.payment.findMany({
              where: { transactionId: razorpayOrderId },
              select: { orderId: true },
            });

            for (const p of payments) {
              const order = await tx.order.findUnique({
                where: { id: p.orderId },
                include: { items: true },
              });

              if (order && order.status === 'PENDING') {
                await tx.order.update({
                  where: { id: order.id },
                  data: { status: 'PROCESSING' },
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
            }
          });
          this.logger.log(
            `Payment marked COMPLETED for Razorpay Order: ${razorpayOrderId}`,
          );
        }
      } else if (event === 'payment.failed') {
        const paymentEntity = payload.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;

        if (razorpayOrderId) {
          // Mark payment as FAILED
          await this.prisma.payment.updateMany({
            where: { transactionId: razorpayOrderId },
            data: { status: 'FAILED' },
          });
          this.logger.log(
            `Payment marked FAILED for Razorpay Order: ${razorpayOrderId}`,
          );
        }
      }

      // Always return 200 OK to Razorpay to acknowledge receipt
      return res.status(200).send('OK');
    } catch (error: any) {
      this.logger.error(`Webhook error: ${error.message}`);
      return res.status(500).send('Internal Server Error');
    }
  }
}
