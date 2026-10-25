import { PrismaService } from '@backend/services/prisma.service';
import { notFound } from '@backend/config/trpc.config';
import { redis } from '@backend/config/redis.config';
import { z } from 'zod';
import {
  ListProductSchema,
  mapProduct,
  productPublicSelect,
} from '@backend/models/product.model';
import { withProductPricing } from '@backend/utils/pricing';
import type { SearchBloomService } from '@backend/services/search-bloom.service';

async function safeCacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

async function safeCacheSet(key: string, data: any, ttl = 600): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch {}
}

export class ProductQueries {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bloomFilter?: SearchBloomService,
  ) {}

  async list(input?: z.infer<typeof ListProductSchema>, isStaff = false) {
    const canIncludeInactive = Boolean(isStaff && input?.includeInactive);

    // 0. Bloom Filter Fast Path: If search term is definitely not present, skip DB completely
    if (
      !canIncludeInactive &&
      input?.search &&
      input.search.trim().length >= 2 &&
      this.bloomFilter
    ) {
      const mightMatch = this.bloomFilter.mightMatchQuery(input.search);
      if (!mightMatch) {
        return {
          items: [],
          total: 0,
          page: input?.page ?? 1,
          pageSize: input?.pageSize ?? 20,
          totalPages: 0,
          bloomFilterRejected: true,
        };
      }
    }

    const cacheKey = `product:list:${canIncludeInactive ? 'staff:' : 'pub:'}${JSON.stringify(input || {})}`;
    const cachedData = await safeCacheGet<any>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const page = input?.cursor ?? input?.page ?? 1;
    const pageSize = input?.pageSize ?? 20;
    const where = {
      ...(canIncludeInactive ? {} : { isActive: true }),
      ...(input?.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input?.subcategoryId ? { subcategoryId: input.subcategoryId } : {}),
      ...(input?.categorySlug
        ? { category: { slug: input.categorySlug } }
        : {}),
      ...(input?.kind ? { kind: input.kind } : {}),
      ...(input?.search
        ? {
            OR: [
              {
                name: { contains: input.search, mode: 'insensitive' as const },
              },
              {
                description: {
                  contains: input.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                brand: { contains: input.search, mode: 'insensitive' as const },
              },
              {
                category: {
                  name: {
                    contains: input.search,
                    mode: 'insensitive' as const,
                  },
                },
              },
              { variants: { some: { sku: { equals: input.search } } } },
            ],
          }
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

    const result = {
      items: items.map(mapProduct),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    // Cache for 10 minutes
    await safeCacheSet(cacheKey, result, 600);

    return result;
  }

  async getById(id: string, isStaff = false) {
    const cacheKey = `product:id:${isStaff ? 'staff:' : 'pub:'}${id}`;
    const cachedData = await safeCacheGet<any>(cacheKey);
    if (cachedData) return cachedData;

    const product = await this.prisma.product.findFirst({
      where: {
        id,
        ...(isStaff ? {} : { isActive: true }),
      },
      select: productPublicSelect,
    });
    if (!product) notFound('Product');
    const result = mapProduct(product);
    await safeCacheSet(cacheKey, result, 600);
    return result;
  }

  async getBySlug(slug: string, isStaff = false) {
    const cacheKey = `product:slug:${isStaff ? 'staff:' : 'pub:'}${slug}`;
    const cachedData = await safeCacheGet<any>(cacheKey);
    if (cachedData) return cachedData;

    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        ...(isStaff ? {} : { isActive: true }),
      },
      select: productPublicSelect,
    });
    if (!product) notFound('Product');
    const result = mapProduct(product);
    await safeCacheSet(cacheKey, result, 600);
    return result;
  }

  async getOutOfStockVariants() {
    const variants = await this.prisma.productVariant.findMany({
      where: { stockQty: { lte: 0 } },
      include: {
        product: {
          select: { name: true, slug: true, isActive: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return variants;
  }

  async getRecommendations(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        categoryId: true,
        subcategoryId: true,
        name: true,
        description: true,
      },
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
    const getKeywords = (text: string) =>
      (text || '')
        .toLowerCase()
        .split(/\\W+/)
        .filter((w) => w.length > 3);
    const sourceKeywords = new Set([
      ...getKeywords(product.name),
      ...getKeywords(product.description || ''),
    ]);

    const scoredProducts = similarProducts.map((p) => {
      const pKeywords = [
        ...getKeywords(p.name),
        ...getKeywords(p.description || ''),
      ];
      let score = 0;
      pKeywords.forEach((kw) => {
        if (sourceKeywords.has(kw)) score += 1;
      });
      // Boost score if same subcategory
      if (p.subcategoryId === product.subcategoryId) score += 5;

      return { product: p, score };
    });

    // Sort by score descending, take top 4
    scoredProducts.sort((a, b) => b.score - a.score);

    const recommendations = scoredProducts
      .slice(0, 4)
      .map((sp) => mapProduct(sp.product));

    return recommendations;
  }

  async searchSuggestions(query: string, limit = 6) {
    const trimmed = (query || '').trim();
    if (!trimmed || trimmed.length < 2) {
      return {
        products: [],
        categories: [],
        query: trimmed,
        bloomFilterVerified: true,
        shortCircuited: false,
      };
    }

    // 1. Bloom Filter Gate: Verify if this prefix or term exists in catalog
    if (this.bloomFilter) {
      const mightMatch = this.bloomFilter.mightMatchQuery(trimmed);
      if (!mightMatch) {
        // Guaranteed 0 items in catalog! Save database load completely.
        return {
          products: [],
          categories: [],
          query: trimmed,
          bloomFilterVerified: true,
          shortCircuited: true,
        };
      }
    }

    const cacheKey = `search:suggestions:${trimmed.toLowerCase()}:${limit}`;
    const cached = await safeCacheGet<any>(cacheKey);
    if (cached) return cached;

    // 2. Fetch matching active products and categories
    const [matchingProducts, matchingCategories] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: trimmed, mode: 'insensitive' as const } },
            {
              category: {
                name: { contains: trimmed, mode: 'insensitive' as const },
              },
            },
            { brand: { contains: trimmed, mode: 'insensitive' as const } },
          ],
        },
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          netPrice: true,
          discountPercent: true,
          category: { select: { name: true, slug: true } },
          images: {
            take: 1,
            orderBy: { sortOrder: 'asc' as const },
            select: { url: true, altText: true },
          },
        },
      }),
      this.prisma.category.findMany({
        where: {
          isActive: true,
          name: { contains: trimmed, mode: 'insensitive' as const },
        },
        take: 3,
        select: {
          id: true,
          name: true,
          slug: true,
        },
      }),
    ]);

    const formattedProducts = matchingProducts.map((p) => {
      const priced = withProductPricing(p);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        netPrice: priced.netPrice,
        discountPercent: priced.discountPercent,
        sellingPrice: priced.sellingPrice,
        categoryName: p.category?.name || null,
        categorySlug: p.category?.slug || null,
        image: p.images[0]?.url || null,
      };
    });

    const result = {
      products: formattedProducts,
      categories: matchingCategories,
      query: trimmed,
      bloomFilterVerified: true,
      shortCircuited: false,
    };

    await safeCacheSet(cacheKey, result, 300); // 5 min cache
    return result;
  }

  async getSitemapProducts(page: number = 1, pageSize: number = 500) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          updatedAt: true,
        },
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.product.count({ where: { isActive: true } }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
