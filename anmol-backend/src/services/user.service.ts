import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthService } from './auth.service';
import { notFound } from '../config/trpc.config';
import { z } from 'zod';
import { CreateUserSchema } from '../models/user.model';

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
}
