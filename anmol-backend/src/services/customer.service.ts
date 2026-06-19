import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { z } from 'zod';
import { UpdateProfileSchema, AddAddressSchema } from '../models/customer.model';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, input: z.infer<typeof UpdateProfileSchema>) {
    return this.prisma.user.update({
      where: { id: userId },
      data: input,
      select: { id: true, email: true, name: true, role: true },
    });
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addAddress(userId: string, input: z.infer<typeof AddAddressSchema>) {
    if (input.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({
      data: {
        ...input,
        userId,
      },
    });
  }
}
