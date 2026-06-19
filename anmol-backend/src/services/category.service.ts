import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { badRequest, notFound } from '../config/trpc.config';
import { slugify, uniqueSlug } from '../utils/slug';
import { DEFAULT_CATEGORIES } from '../utils/default-categories';
import { z } from 'zod';
import { CreateCategorySchema, UpdateCategorySchema, DeleteCategorySchema, ListCategorySchema } from '../models/category.model';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(input?: z.infer<typeof ListCategorySchema>) {
    const where = {
      ...(input?.includeInactive ? {} : { isActive: true }),
      ...(input?.search ? { name: { contains: input.search, mode: 'insensitive' as const } } : {}),
    };

    return this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { 
        _count: { select: { products: true } },
        subcategories: {
          include: {
            itemTypes: true
          }
        }
      },
    });
  }

  async getById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) notFound('Category');
    return category;
  }

  async getBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (!category) notFound('Category');
    return category;
  }

  async create(input: z.infer<typeof CreateCategorySchema>) {
    const slug =
      input.slug?.trim() ||
      (await uniqueSlug(input.name, async (s) => {
        const row = await this.prisma.category.findUnique({
          where: { slug: s },
        });
        return Boolean(row);
      }));

    if (input.slug && slugify(input.slug) !== input.slug) {
      badRequest('Slug must be lowercase letters, numbers, and hyphens only');
    }

    return this.prisma.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        imageUrl: input.imageUrl,
      },
    });
  }

  async update(input: z.infer<typeof UpdateCategorySchema>) {
    const existing = await this.prisma.category.findUnique({
      where: { id: input.id },
    });
    if (!existing) notFound('Category');

    let slug = input.slug;
    if (slug) {
      slug = slugify(slug);
      const clash = await this.prisma.category.findFirst({
        where: { slug, NOT: { id: input.id } },
      });
      if (clash) badRequest('Slug already in use');
    }

    return this.prisma.category.update({
      where: { id: input.id },
      data: {
        name: input.name,
        slug,
        description: input.description,
        imageUrl: input.imageUrl,
        isActive: input.isActive,
      },
    });
  }

  async delete(input: z.infer<typeof DeleteCategorySchema>) {
    const existing = await this.prisma.category.findUnique({
      where: { id: input.id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) notFound('Category');

    if (input.hard) {
      if (existing._count.products > 0) {
        badRequest(
          `Cannot delete "${existing.name}" — ${existing._count.products} product(s) still use it. Hide the category or move those products first.`,
        );
      }
      await this.prisma.category.delete({ where: { id: input.id } });
      return { success: true, mode: 'deleted' as const };
    }

    await this.prisma.category.update({
      where: { id: input.id },
      data: { isActive: false },
    });
    return { success: true, mode: 'hidden' as const };
  }

  async seedDefaults() {
    for (const cat of DEFAULT_CATEGORIES) {
      await this.prisma.category.upsert({
        where: { slug: cat.slug },
        create: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
        },
        update: {
          name: cat.name,
          description: cat.description,
          isActive: true,
        },
      });
    }
    return { count: DEFAULT_CATEGORIES.length };
  }

  // --- SUBCATEGORY ---
  async createSubcategory(input: z.infer<typeof import('../models/category.model').CreateSubcategorySchema>) {
    const slug = await uniqueSlug(input.name, async (s) => {
      const row = await this.prisma.subcategory.findUnique({ where: { slug: s } });
      return Boolean(row);
    });
    return this.prisma.subcategory.create({
      data: {
        name: input.name,
        slug,
        categoryId: input.categoryId,
        description: input.description,
      }
    });
  }

  async updateSubcategory(input: z.infer<typeof import('../models/category.model').UpdateSubcategorySchema>) {
    return this.prisma.subcategory.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description,
        isActive: input.isActive,
      }
    });
  }

  async deleteSubcategory(id: string) {
    await this.prisma.subcategory.delete({ where: { id } });
    return { success: true };
  }

  // --- ITEMTYPE ---
  async createItemType(input: z.infer<typeof import('../models/category.model').CreateItemTypeSchema>) {
    const slug = await uniqueSlug(input.name, async (s) => {
      const row = await this.prisma.itemType.findUnique({ where: { slug: s } });
      return Boolean(row);
    });
    return this.prisma.itemType.create({
      data: {
        name: input.name,
        slug,
        subcategoryId: input.subcategoryId,
        description: input.description,
      }
    });
  }

  async updateItemType(input: z.infer<typeof import('../models/category.model').UpdateItemTypeSchema>) {
    return this.prisma.itemType.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description,
        isActive: input.isActive,
      }
    });
  }

  async deleteItemType(id: string) {
    await this.prisma.itemType.delete({ where: { id } });
    return { success: true };
  }
}

