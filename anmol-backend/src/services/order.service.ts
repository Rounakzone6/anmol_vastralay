import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import Razorpay from 'razorpay';
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
} from '@backend/models/order.model';
import { WhatsappService } from '@backend/services/whatsapp.service';
import { WhatsappWebService } from '@backend/services/whatsapp-web.service';
import { InvoiceService } from '@backend/services/invoice.service';

@Injectable()
export class OrderService {
  private razorpay: Razorpay;

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
    private readonly whatsappWebService: WhatsappWebService,
    private readonly invoiceService: InvoiceService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
    });
  }

  async createOrder(userId: string, input: z.infer<typeof CreateOrderSchema>) {
    // 1. Get user cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });
    }

    // 2. Calculate total amount
    let totalAmount = 0;
    for (const item of cart.items) {
      // using product netPrice
      const price = Number(item.product.netPrice);
      totalAmount += price * item.quantity;
    }

    // 3. Create order in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          shippingAddress: input.shippingAddress,
          status: input.paymentMethod === 'COD' ? 'PROCESSING' : 'PENDING',
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.product.netPrice,
            })),
          },
          statusHistory: {
            create: {
              status: input.paymentMethod === 'COD' ? 'PROCESSING' : 'PENDING',
              note: 'Order placed successfully',
            },
          },
        },
      });

      // 4. Create Payment record and Razorpay Order if needed
      let razorpayOrderId: string | null = null;
      if (input.paymentMethod === 'RAZORPAY') {
        const rpOrder = await this.razorpay.orders.create({
          amount: Math.round(totalAmount * 100), // amount in paise
          currency: 'INR',
          receipt: order.id,
        });
        razorpayOrderId = rpOrder.id;

        await tx.payment.create({
          data: {
            orderId: order.id,
            userId,
            amount: totalAmount,
            status: 'PENDING',
            paymentMethod: 'RAZORPAY',
            transactionId: razorpayOrderId,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            userId,
            amount: totalAmount,
            status: 'PENDING',
            paymentMethod: 'COD',
          },
        });

        // Deduct inventory for COD orders immediately
        for (const item of cart.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQty: { decrement: item.quantity } },
            });
          }
        }
      }

      // 5. Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return {
        orderId: order.id,
        method: input.paymentMethod,
        razorpayOrderId,
        amount: totalAmount,
      };
    });
    
    // Emit event if order status is PROCESSING
    if (input.paymentMethod === 'COD') {
      this.eventEmitter.emit('order.processing', { orderId: result.orderId });
    }

    // 6. Handle post-order confirmations asynchronously
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (input.paymentMethod === 'COD') {
      // 6a. Send Email Invoice
      this.invoiceService.emailOrderInvoice(result.orderId).catch((error) =>
        console.error('Failed to send order invoice email', error),
      );

      // 6b. Send WhatsApp Confirmation with Invoice using Baileys
      (async () => {
        try {
          // Find phone fallback if user profile doesn't have it
          let phone = user?.phone;
          if (!phone) {
            const address = await this.prisma.address.findFirst({
              where: { userId },
              orderBy: { isDefault: 'desc' },
            });
            phone = address?.phone;
          }

          if (phone) {
            // Ensure invoice is generated and uploaded so we can fetch its URL
            const invoice = await this.invoiceService.generateInvoice(undefined, result.orderId);
            
            const message = `🛍️ *Order Confirmed!* 🛍️\n\nThank you for shopping at Anmol Vastralay!\nYour order *#${result.orderId.slice(-8).toUpperCase()}* for ₹${result.amount} has been placed successfully.\n\nAttached is your invoice. 🧾`;
            
            await this.whatsappWebService.sendDocument(
              phone,
              { url: invoice.invoiceUrl },
              `${invoice.invoiceNumber}.pdf`,
              message
            );
          }
        } catch (err) {
          console.error('Failed to send WA order confirmation with invoice', err);
        }
      })();
    }

    return result;
  }

  async getOrderHistory(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        shippingAddress: true,
        invoiceUrl: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  take: 1,
                  select: { url: true, altText: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
            variant: {
              select: { id: true, color: true, size: true },
            },
          },
        },
        statusHistory: {
          select: { id: true, status: true, note: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async getOrderDetails(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        userId: true,
        status: true,
        totalAmount: true,
        shippingAddress: true,
        invoiceUrl: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  take: 1,
                  select: { url: true, altText: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
            variant: {
              select: { id: true, color: true, size: true },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            createdAt: true,
          },
        },
        user: { select: { name: true, email: true, phone: true } },
        statusHistory: {
          select: { id: true, status: true, note: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order || (userId && order.userId !== userId)) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
    }

    return order;
  }

  async generateInvoice(userId: string | undefined, orderId: string) {
    return this.invoiceService.generateInvoice(userId, orderId);
  }

  async adminGetOrders() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        invoiceUrl: true,
        user: { select: { name: true, phone: true } },
        _count: { select: { items: true } },
      },
    });
  }

  async adminUpdateOrderStatus(input: z.infer<typeof UpdateOrderStatusSchema>) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: input.orderId },
        select: { status: true },
      });
      if (!current) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
      }

      if (current.status === input.status) {
        return tx.order.findUnique({ where: { id: input.orderId } });
      }

      return tx.order.update({
        where: { id: input.orderId },
        data: {
          status: input.status,
          statusHistory: {
            create: {
              status: input.status,
              note: `Order marked ${input.status.toLowerCase()}`,
            },
          },
        },
      });
    });
  }

  // After the transaction completes, emit events based on the new status
  async adminUpdateOrderStatusWithEvents(input: z.infer<typeof UpdateOrderStatusSchema>) {
    const order = await this.adminUpdateOrderStatus(input);
    
    if (!order) return order;

    if (input.status === 'PROCESSING') {
      this.eventEmitter.emit('order.processing', { orderId: order.id });
    } else if (['DELIVERED', 'CANCELLED', 'RETURNED', 'REPLACED'].includes(input.status)) {
      this.eventEmitter.emit('order.completed', { orderId: order.id });
    }
    
    return order;
  }
}
