import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import Razorpay from 'razorpay';
import { CreateOrderSchema, OrderIdSchema, UpdateOrderStatusSchema } from '../models/order.model';

@Injectable()
export class OrderService {
  private razorpay: Razorpay;

  constructor(private readonly prisma: PrismaService) {
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
    return this.prisma.$transaction(async (tx) => {
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
  }

  async getOrderHistory(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
  }

  async getOrderDetails(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        payments: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
    }

    return order;
  }

  async adminGetOrders() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        items: true,
      },
    });
  }

  async adminUpdateOrderStatus(input: z.infer<typeof UpdateOrderStatusSchema>) {
    return this.prisma.order.update({
      where: { id: input.orderId },
      data: { status: input.status },
    });
  }
}
