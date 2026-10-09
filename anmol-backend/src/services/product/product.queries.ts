import { PrismaService } from '@backend/services/prisma.service';
import { notFound } from '@backend/config/trpc.config';
import { z } from 'zod';
import {
  ListProductSchema,
  mapProduct,
  productPublicSelect,
} from '@backend/models/product.model';

export class ProductQueries {
  constructor(private readonly prisma: PrismaService) {}

  async list(input?: z.infer<typeof ListProductSchema>) {
    const page = input?.cursor ?? input?.page ?? 1;
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
        select: productPublicSelect,
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
      select: productPublicSelect,
    });
    if (!product) notFound('Product');
    return mapProduct(product);
  }

  async getBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: productPublicSelect,
    });
    if (!product) notFound('Product');
    return mapProduct(product);
  }

  async getOutOfStockVariants() {
    const variants = await this.prisma.productVariant.findMany({
      where: { stockQty: { lte: 0 } },
      include: {
        product: {
          select: { name: true, slug: true, isActive: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return variants;
  }

  async getRecommendations(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, categoryId: true, subcategoryId: true, name: true, description: true }
    });
    
    if (!product) notFound('Product');

    // 1. Fetch products in the same category, excluding current product
    const similarProducts = await this.prisma.product.findMany({
      where: {
        id: { not: productId },
        categoryId: product.categoryId,
        isActive: true,
      },
      select: productPublicSelect,
      take: 20,
    });

    // 2. Simple Content-Based Scoring using keyword overlap
    const getKeywords = (text: string) => (text || '').toLowerCase().split(/\\W+/).filter(w => w.length > 3);
    const sourceKeywords = new Set([...getKeywords(product.name), ...getKeywords(product.description || '')]);

    const scoredProducts = similarProducts.map(p => {
      const pKeywords = [...getKeywords(p.name), ...getKeywords(p.description || '')];
      let score = 0;
      pKeywords.forEach(kw => {
        if (sourceKeywords.has(kw)) score += 1;
      });
      // Boost score if same subcategory
      if (p.subcategoryId === product.subcategoryId) score += 5;
      
      return { product: p, score };
    });

    // Sort by score descending, take top 4
    scoredProducts.sort((a, b) => b.score - a.score);
    
    const recommendations = scoredProducts.slice(0, 4).map(sp => mapProduct(sp.product));
    
    return recommendations;
  }
}
