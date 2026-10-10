import { Injectable } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { AuthService } from '@backend/services/auth.service';
import { notFound } from '@backend/config/trpc.config';
import { z } from 'zod';
import { CreateUserSchema } from '@backend/models/user.model';
import { NotificationQueueService } from '@backend/services/notification-queue.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly notificationQueue: NotificationQueueService,
  ) {}

  async getUsers() {
    return this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'STAFF'] },
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCustomers() {
    const customers = await this.prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
        orders: {
          where: { status: { notIn: ['CANCELLED', 'RETURNED'] } },
          select: { totalAmount: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map(c => {
      // Calculate Lifetime Value (LTV)
      const ltv = c.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      
      // Determine Segment
      let segment = 'NEW';
      if (ltv > 10000) {
        segment = 'VIP'; // Spent more than 10k
      } else if (c.orders.length > 0) {
        const lastOrderDate = Math.max(...c.orders.map(o => o.createdAt.getTime()));
        const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
        if (lastOrderDate < threeMonthsAgo) {
          segment = 'DORMANT'; // No orders in 3 months
        } else {
          segment = 'REGULAR'; // Active buyer but not VIP
        }
      }

      // We remove the raw orders array to keep the payload small
      const { orders, ...rest } = c;
      return { ...rest, ltv, segment };
    });
  }

  async createUser(input: z.infer<typeof CreateUserSchema>) {
    const hashedPassword = await this.auth.hashPassword(input.password);
    return this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: hashedPassword,
        role: input.role ?? 'STAFF',
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) notFound('User');
    return user;
  }

  async getCustomerDetails(id: string) {
    const customer = await this.prisma.user.findFirst({
      // The customer list already scopes this link to customers. Resolving by
      // id alone also keeps historical customer records viewable if their role
      // was changed later by an administrator.
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        profileImage: true,
        gender: true,
        dateOfBirth: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: { select: { name: true, slug: true } },
                variant: { select: { color: true, size: true, sku: true } },
              },
            },
            payments: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        cart: {
          include: {
            items: {
              include: {
                product: { select: { name: true, slug: true, netPrice: true } },
                variant: { select: { color: true, size: true, sku: true } },
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            product: { select: { name: true, slug: true } },
          },
        },
      },
    });

    if (!customer) notFound('Customer');
    return customer;
  }

  async sendMarketingCampaign(input: { segment: 'ALL' | 'VIP' | 'DORMANT' | 'REGULAR' | 'NEW'; message: string }) {
    const customers = await this.getCustomers();
    
    // Filter customers by segment
    const targetCustomers = input.segment === 'ALL' 
      ? customers 
      : customers.filter(c => c.segment === input.segment);

    // Filter out customers without phones
    const validCustomers = targetCustomers.filter(c => !!c.phone);

    if (validCustomers.length === 0) {
      return { success: true, count: 0, message: 'No customers found with valid phone numbers in this segment.' };
    }

    // Enqueue jobs with progressive delay (1.5 seconds apart) to prevent WhatsApp spam bans
    const BASE_DELAY_MS = 1500;
    for (let i = 0; i < validCustomers.length; i++) {
      const c = validCustomers[i];
      await this.notificationQueue.enqueueMarketingMessage({
        phone: c.phone!,
        message: input.message,
        delayMs: i * BASE_DELAY_MS,
      });
    }

    return { 
      success: true, 
      count: validCustomers.length, 
      message: `Successfully enqueued ${validCustomers.length} messages. They will be sent over the next ${(validCustomers.length * BASE_DELAY_MS) / 1000} seconds.` 
    };
  }
}
