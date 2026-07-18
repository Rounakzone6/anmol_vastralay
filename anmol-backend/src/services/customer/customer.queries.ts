import { PrismaService } from '@backend/services/prisma.service';
import { notFound } from '@backend/config/trpc.config';

export class CustomerQueries {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
        role: true,
        createdAt: true,
        _count: { select: { orders: true, addresses: true } },
      },
    });
    if (!user) notFound('User');
    return user;
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
