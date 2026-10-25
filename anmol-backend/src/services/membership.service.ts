import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { TRPCError } from '@trpc/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { redis } from '@backend/config/redis.config';
import { z } from 'zod';
import {
  UpdateMembershipPlanSchema,
  VerifyMembershipPaymentSchema,
} from '@backend/models/membership.model';

export const DEFAULT_VIP_BENEFITS = [
  'Free Delivery on ALL orders (Save ₹20/order)',
  'Priority 24h Express Dispatch & Packaging',
  'VIP Early Access to Festive Sales & New Drops',
  'Dedicated VIP WhatsApp Styling & Support',
  'Special Birthday Surprise Gift Voucher',
];

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);
  private readonly razorpay: Razorpay;

  constructor(private readonly prisma: PrismaService) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
    });
  }

  /**
   * Get current active membership plan (Public)
   */
  async getPlan() {
    let plan = await this.prisma.membershipPlan.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!plan) {
      if (process.env.NODE_ENV === 'production') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active VIP membership plan configured. Please configure a plan in Admin settings.',
        });
      }

      // Safe non-production seed: ₹499 instead of ₹1
      plan = await this.prisma.membershipPlan.create({
        data: {
          name: 'Anmol VIP Royal Club',
          price: 499.0,
          durationDays: 365,
          deliveryCharge: 20.0,
          benefits: DEFAULT_VIP_BENEFITS,
          isActive: true,
        },
      });
    }

    return {
      id: plan.id,
      name: plan.name,
      price: Number(plan.price),
      durationDays: plan.durationDays,
      deliveryCharge: Number(plan.deliveryCharge),
      benefits: plan.benefits,
      isActive: plan.isActive,
    };
  }

  /**
   * Check membership status for a user
   */
  async getMyMembership(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isMember: true,
        membershipExpiresAt: true,
      },
    });

    if (!user) {
      return { isMember: false, expiresAt: null, daysLeft: 0 };
    }

    const now = new Date();
    const isMember = Boolean(
      user.isMember &&
        user.membershipExpiresAt &&
        user.membershipExpiresAt > now,
    );

    let daysLeft = 0;
    if (isMember && user.membershipExpiresAt) {
      daysLeft = Math.ceil(
        (user.membershipExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    return {
      isMember,
      expiresAt: user.membershipExpiresAt,
      daysLeft: Math.max(0, daysLeft),
    };
  }

  /**
   * Create Razorpay order to purchase membership subscription
   */
  async createMembershipOrder(userId: string) {
    const plan = await this.getPlan();
    const amountInPaise = Math.round(plan.price * 100);

    const rpOrder = await this.razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `mb_${userId.slice(-6)}_${Date.now().toString().slice(-6)}`,
      notes: {
        type: 'MEMBERSHIP',
        userId,
        planId: plan.id,
      },
    });

    // Persist pending transaction intent in Redis to validate original transaction
    try {
      await redis.set(
        `membership:pending:${rpOrder.id}`,
        JSON.stringify({
          userId,
          planId: plan.id,
          amount: plan.price,
          durationDays: plan.durationDays,
          createdAt: Date.now(),
        }),
        'EX',
        7200,
      );
    } catch (err) {
      this.logger.warn(`Failed to cache pending membership transaction in Redis: ${err}`);
    }

    return {
      razorpayOrderId: rpOrder.id,
      amount: plan.price,
      currency: 'INR',
      plan,
    };
  }

  /**
   * Verify Razorpay payment and activate VIP membership
   */
  async verifyMembershipPayment(
    userId: string,
    input: z.infer<typeof VerifyMembershipPaymentSchema>,
  ) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Payment verification secret is not configured',
      });
    }

    // 1. Verify cryptographic signature
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

    // 2. Validate original transaction ownership and plan
    try {
      const cachedPending = await redis.get(`membership:pending:${input.razorpay_order_id}`);
      if (cachedPending) {
        const pending = JSON.parse(cachedPending);
        if (pending.userId && pending.userId !== userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Payment transaction was not initiated by the authenticated user',
          });
        }
      }
    } catch (err: any) {
      if (err instanceof TRPCError) throw err;
    }

    // 3. Enforce idempotency: prevent replaying valid payment callback
    const existingMembership = await this.prisma.userMembership.findFirst({
      where: { transactionId: input.razorpay_payment_id },
    });
    if (existingMembership) {
      this.logger.log(`Membership already activated for transaction ${input.razorpay_payment_id}`);
      return {
        success: true,
        message: 'VIP membership is already activated for this transaction.',
        expiresAt: existingMembership.endDate,
        transactionId: input.razorpay_payment_id,
      };
    }

    const plan = await this.getPlan();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Save UserMembership and update User atomically
    await this.prisma.$transaction(async (tx) => {
      await tx.userMembership.create({
        data: {
          userId,
          planId: plan.id,
          amount: plan.price,
          paymentMethod: 'RAZORPAY',
          transactionId: input.razorpay_payment_id,
          status: 'ACTIVE',
          startDate: now,
          endDate: expiresAt,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          isMember: true,
          membershipExpiresAt: expiresAt,
        },
      });
    });

    // Clean up pending transaction cache
    try {
      await redis.del(`membership:pending:${input.razorpay_order_id}`);
    } catch {}

    this.logger.log(`User ${userId} activated VIP membership until ${expiresAt.toISOString()}`);

    return {
      success: true,
      message: 'Congratulations! You are now a member of Anmol VIP Royal Club.',
      expiresAt,
      transactionId: input.razorpay_payment_id,
    };
  }

  /**
   * Admin: Update membership plan & delivery charge dynamically
   */
  async adminUpdatePlan(input: z.infer<typeof UpdateMembershipPlanSchema>) {
    let plan = await this.prisma.membershipPlan.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (plan) {
      plan = await this.prisma.membershipPlan.update({
        where: { id: plan.id },
        data: {
          ...(input.name ? { name: input.name } : {}),
          price: input.price,
          ...(input.durationDays ? { durationDays: input.durationDays } : {}),
          ...(input.deliveryCharge !== undefined ? { deliveryCharge: input.deliveryCharge } : {}),
          ...(input.benefits ? { benefits: input.benefits } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });
    } else {
      plan = await this.prisma.membershipPlan.create({
        data: {
          name: input.name || 'Anmol VIP Royal Club',
          price: input.price,
          durationDays: input.durationDays || 365,
          deliveryCharge: input.deliveryCharge !== undefined ? input.deliveryCharge : 20.0,
          benefits: input.benefits || DEFAULT_VIP_BENEFITS,
          isActive: input.isActive ?? true,
        },
      });
    }


    return {
      success: true,
      message: 'Membership plan updated successfully',
      plan: {
        id: plan.id,
        name: plan.name,
        price: Number(plan.price),
        durationDays: plan.durationDays,
        deliveryCharge: Number(plan.deliveryCharge),
        benefits: plan.benefits,
        isActive: plan.isActive,
      },
    };
  }

  /**
   * Admin: Get all members
   */
  async adminGetMembers() {
    const members = await this.prisma.userMembership.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      userName: m.user?.name || 'N/A',
      userEmail: m.user?.email || 'N/A',
      userPhone: m.user?.phone || 'N/A',
      planName: m.plan?.name || 'VIP Club',
      amount: Number(m.amount),
      transactionId: m.transactionId,
      status: m.status,
      startDate: m.startDate,
      endDate: m.endDate,
      createdAt: m.createdAt,
    }));
  }
}
