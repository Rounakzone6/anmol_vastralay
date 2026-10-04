import { Injectable } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { AuthService } from '@backend/services/auth.service';
import { notFound } from '@backend/config/trpc.config';
import { z } from 'zod';
import { CreateUserSchema } from '@backend/models/user.model';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
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
    return this.prisma.user.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
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
}
