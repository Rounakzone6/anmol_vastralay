import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import Razorpay from 'razorpay';
import { redis } from '@backend/config/redis.config';
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
} from '@backend/models/order.model';
import { WhatsappService } from '@backend/services/whatsapp.service';
import { WhatsappWebService } from '@backend/services/whatsapp-web.service';
import { InvoiceService } from '@backend/services/invoice.service';
import { CartService } from '@backend/services/cart.service';
import { NotificationQueueService } from '@backend/services/notification-queue.service';

function computeItemSellingPrice(netPrice: any, discountPercent: any): number {
  const net = Number(netPrice);
  const discount = Number(discountPercent || 0);
  if (discount <= 0) return Math.round(net * 100) / 100;
  return Math.round(net * (1 - discount / 100) * 100) / 100;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private razorpay: Razorpay;

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
    private readonly whatsappWebService: WhatsappWebService,
    private readonly invoiceService: InvoiceService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cartService: CartService,
    private readonly notificationQueue: NotificationQueueService,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
    });
  }

  async createOrder(userId: string, input: z.infer<typeof CreateOrderSchema>) {
    // 0. Idempotency Check
    const idempotencyKey = input.idempotencyKey?.trim();
    if (idempotencyKey) {
      try {
        const cached = await redis.get(
          `order:idempotency:${userId}:${idempotencyKey}`,
        );
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {}
    }

    // 1. Get user cart from Redis via CartService
    const cart = await this.cartService.getCart(userId);

    if (!cart || cart.items.length === 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });
    }

    // 2. Calculate total amount and verify stock availability on Primary DB (CP Consistency)
    let totalAmount = 0;
    for (const item of cart.items) {
      if (item.variantId) {
        const variant = await this.prisma.$primary().productVariant.findUnique({
          where: { id: item.variantId },
          select: { stockQty: true, product: { select: { name: true } } },
        });
        if (!variant || variant.stockQty < item.quantity) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Insufficient stock for "${variant?.product?.name || 'Item'}". Available: ${variant?.stockQty ?? 0}, Requested: ${item.quantity}`,
          });
        }
      }

      // Canonical server-side selling price calculation honoring discountPercent
      const price = computeItemSellingPrice(
        item.product.netPrice,
        item.product.discountPercent,
      );
      totalAmount += price * item.quantity;
    }

    // 2.0 Apply Coupon Discount if provided
    let discountAmount = 0;
    let appliedCoupon: string | null = null;
    if (input.couponCode) {
      const normCoupon = input.couponCode.trim().toUpperCase();
      if (normCoupon === 'COMEBACK15') {
        discountAmount = Math.round(((totalAmount * 15) / 100) * 100) / 100;
        appliedCoupon = 'COMEBACK15';
      } else if (normCoupon === 'COMEBACK5') {
        discountAmount = Math.round(((totalAmount * 5) / 100) * 100) / 100;
        appliedCoupon = 'COMEBACK5';
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid or expired coupon code: ${input.couponCode}`,
        });
      }
    }

    totalAmount = Math.max(0, totalAmount - discountAmount);

    // 2.1 Check customer membership status:
    // Members get Free Delivery (₹0).
    // Non-members pay delivery fee configured in MembershipPlan (default ₹20).
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isMember: true, membershipExpiresAt: true },
    });

    const isMember = Boolean(
      user?.isMember &&
      user.membershipExpiresAt &&
      user.membershipExpiresAt > new Date(),
    );

    let deliveryFee = 0;
    if (!isMember) {
      const plan = await this.prisma.membershipPlan.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      deliveryFee = Number(plan?.deliveryCharge ?? 20);
    }

    totalAmount += deliveryFee;

    // 3. Create order in transaction without holding external gateway calls
    const createdOrder = await this.prisma.$transaction(async (tx) => {
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
              price: computeItemSellingPrice(
                item.product.netPrice,
                item.product.discountPercent,
              ),
            })),
          },
          statusHistory: {
            create: {
              status: input.paymentMethod === 'COD' ? 'PROCESSING' : 'PENDING',
              note: appliedCoupon
                ? `Order placed with coupon ${appliedCoupon} (-₹${discountAmount})`
                : 'Order placed successfully',
            },
          },
        },
      });

      // Payment record initially created inside transaction
      await tx.payment.create({
        data: {
          orderId: order.id,
          userId,
          amount: totalAmount,
          status: 'PENDING',
          paymentMethod: input.paymentMethod,
        },
      });

      // Deduct inventory for COD orders atomically with conditional stock check (Strict CP)
      if (input.paymentMethod === 'COD') {
        for (const item of cart.items) {
          if (item.variantId) {
            const updated = await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                stockQty: { gte: item.quantity },
              },
              data: { stockQty: { decrement: item.quantity } },
            });

            if (updated.count === 0) {
              throw new TRPCError({
                code: 'CONFLICT',
                message: `Stock was claimed by another customer for "${item.product.name}". Order aborted.`,
              });
            }
          }
        }
      }

      return order;
    });

    // 4. Handle Razorpay order creation OUTSIDE database transaction
    let razorpayOrderId: string | null = null;
    if (input.paymentMethod === 'RAZORPAY') {
      try {
        const rpOrder = await this.razorpay.orders.create({
          amount: Math.round(totalAmount * 100), // amount in paise
          currency: 'INR',
          receipt: createdOrder.id,
        });
        razorpayOrderId = rpOrder.id;

        await this.prisma.payment.updateMany({
          where: { orderId: createdOrder.id, paymentMethod: 'RAZORPAY' },
          data: { transactionId: razorpayOrderId },
        });
      } catch (err: any) {
        this.logger.error(
          `Razorpay order creation failed for order ${createdOrder.id}: ${err?.message || err}`,
        );
        await this.prisma.order.update({
          where: { id: createdOrder.id },
          data: { status: 'CANCELLED' },
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            'Unable to initiate payment with payment gateway. Please try again.',
        });
      }
    }

    const result = {
      orderId: createdOrder.id,
      method: input.paymentMethod,
      razorpayOrderId,
      amount: totalAmount,
    };

    // Save result to idempotency cache (TTL: 5 minutes)
    if (idempotencyKey) {
      try {
        await redis.set(
          `order:idempotency:${userId}:${idempotencyKey}`,
          JSON.stringify(result),
          'EX',
          300,
        );
      } catch {}
    }

    // 5. Clear cart in Redis
    await this.cartService.clearCart(userId);

    // Emit event if order status is PROCESSING
    if (input.paymentMethod === 'COD') {
      this.eventEmitter.emit('order.processing', { orderId: result.orderId });
    }

    // 6. Handle post-order confirmations asynchronously via BullMQ
    if (input.paymentMethod === 'COD') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      await this.notificationQueue.enqueueOrderEmail({
        orderId: result.orderId,
      });

      await this.notificationQueue.enqueueOrderWhatsApp({
        orderId: result.orderId,
        userId: userId,
        amount: result.amount,
        phone: user?.phone,
      });
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
  async adminUpdateOrderStatusWithEvents(
    input: z.infer<typeof UpdateOrderStatusSchema>,
  ) {
    const order = await this.adminUpdateOrderStatus(input);

    if (!order) return order;

    if (input.status === 'PROCESSING') {
      this.eventEmitter.emit('order.processing', { orderId: order.id });
    } else if (
      ['DELIVERED', 'CANCELLED', 'RETURNED', 'REPLACED'].includes(input.status)
    ) {
      this.eventEmitter.emit('order.completed', { orderId: order.id });
    }

    return order;
  }

  validateCoupon(code: string) {
    const norm = (code || '').trim().toUpperCase();
    if (norm === 'COMEBACK15') {
      return {
        valid: true,
        code: 'COMEBACK15',
        discountPercent: 15,
        description: '15% Welcome Back Special Discount',
      };
    }
    if (norm === 'COMEBACK5') {
      return {
        valid: true,
        code: 'COMEBACK5',
        discountPercent: 5,
        description: '5% Cart Recovery Discount',
      };
    }
    return {
      valid: false,
      code: norm,
      discountPercent: 0,
      description: 'Invalid or expired coupon code',
    };
  }
}
