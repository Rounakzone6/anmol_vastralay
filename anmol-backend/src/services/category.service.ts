import { Injectable } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { badRequest, notFound } from '@backend/config/trpc.config';
import { slugify, uniqueSlug } from '@backend/utils/slug';
import { DEFAULT_CATEGORIES } from '@backend/utils/default-categories';
import { z } from 'zod';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  DeleteCategorySchema,
  ListCategorySchema,
} from '@backend/models/category.model';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(input?: z.infer<typeof ListCategorySchema>) {
    const where = {
      ...(input?.includeInactive ? {} : { isActive: true }),
      ...(input?.search
        ? { name: { contains: input.search, mode: 'insensitive' as const } }
        : {}),
    };

    if (!input?.includeInactive) {
      return this.prisma.category.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          subcategories: true,
        },
      });
    }

    return this.prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true } },
        subcategories: true,
      },
    });
  }

  async getById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        isActive: true,
        sortOrder: true,
        _count: { select: { products: true } },
        subcategories: true,
      },
    });
    if (!category) notFound('Category');
    return category;
  }

  async getBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
      },
    });
    if (!category) notFound('Category');
    return category;
  }

  async create(input: z.infer<typeof CreateCategorySchema>, userId: string) {
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

    let authorId: string | null = null;
    if (userId) {
      const validUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      authorId = validUser?.id ?? null;
    }

    return this.prisma.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        imageUrl: input.imageUrl,
        createdById: authorId,
        updatedById: authorId,
      },
    });
  }

  async update(input: z.infer<typeof UpdateCategorySchema>, userId: string) {
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

    let updaterId: string | null = null;
    if (userId) {
      const validUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      updaterId = validUser?.id ?? null;
    }

    return this.prisma.category.update({
      where: { id: input.id },
      data: {
        name: input.name,
        slug,
        description: input.description,
        imageUrl: input.imageUrl,
        isActive: input.isActive,
        updatedById: updaterId,
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

  async reorder(
    input: z.infer<
      typeof import('../models/category.model').ReorderCategorySchema
    >,
  ) {
    await this.prisma.$transaction(
      input.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    return { success: true };
  }

  // --- SUBCATEGORY ---
  async createSubcategory(
    input: z.infer<
      typeof import('../models/category.model').CreateSubcategorySchema
    >,
  ) {
    const slug = await uniqueSlug(input.name, async (s) => {
      const row = await this.prisma.subcategory.findUnique({
        where: { slug: s },
      });
      return Boolean(row);
    });
    return this.prisma.subcategory.create({
      data: {
        name: input.name,
        slug,
        categoryId: input.categoryId,
        description: input.description,
      },
    });
  }

  async updateSubcategory(
    input: z.infer<
      typeof import('../models/category.model').UpdateSubcategorySchema
    >,
  ) {
    return this.prisma.subcategory.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description,
        isActive: input.isActive,
      },
    });
  }

  async deleteSubcategory(id: string) {
    await this.prisma.subcategory.delete({ where: { id } });
    return { success: true };
  }
}
