import { PrismaService } from '@backend/services/prisma.service';
import { notFound } from '@backend/config/trpc.config';
import { z } from 'zod';
import {
  ListProductSchema,
  mapProduct,
  productInclude,
} from '@backend/models/product.model';

export class ProductQueries {
  constructor(private readonly prisma: PrismaService) {}

  async list(input?: z.infer<typeof ListProductSchema>) {
    const page = input?.cursor || input?.page || 1;
    const pageSize = input?.pageSize ?? 20;
    const where = {
      ...(input?.includeInactive ? {} : { isActive: true }),
      ...(input?.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input?.subcategoryId ? { subcategoryId: input.subcategoryId } : {}),
      ...(input?.itemTypeId ? { itemTypeId: input.itemTypeId } : {}),
      ...(input?.categorySlug
        ? { category: { slug: input.categorySlug } }
        : {}),
      ...(input?.kind ? { kind: input.kind } : {}),
      ...(input?.search
        ? { name: { contains: input.search, mode: 'insensitive' as const } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map(mapProduct),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) notFound('Product');
    return mapProduct(product);
  }

  async getBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    if (!product) notFound('Product');
    return mapProduct(product);
  }
}
