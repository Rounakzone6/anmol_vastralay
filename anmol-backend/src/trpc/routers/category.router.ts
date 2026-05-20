import { z } from 'zod';
import { DEFAULT_CATEGORIES } from '../../common/default-categories';
import { slugify, uniqueSlug } from '../../common/slug';
import { badRequest, notFound, router, staffProcedure } from '../trpc';

export const categoryRouter = router({
  list: staffProcedure
    .input(
      z
        .object({
          includeInactive: z.boolean().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input?.includeInactive ? {} : { isActive: true }),
        ...(input?.search
          ? { name: { contains: input.search, mode: 'insensitive' as const } }
          : {}),
      };

      return ctx.prisma.category.findMany({
        where,
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
      });
    }),

  getById: staffProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findUnique({
        where: { id: input.id },
        include: { _count: { select: { products: true } } },
      });
      if (!category) notFound('Category');
      return category;
    }),

  getBySlug: staffProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findUnique({
        where: { slug: input.slug },
      });
      if (!category) notFound('Category');
      return category;
    }),

  create: staffProcedure
    .input(
      z.object({
        name: z.string().min(2),
        slug: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const slug =
        input.slug?.trim() ||
        (await uniqueSlug(input.name, async (s) => {
          const row = await ctx.prisma.category.findUnique({
            where: { slug: s },
          });
          return Boolean(row);
        }));

      if (input.slug && slugify(input.slug) !== input.slug) {
        badRequest('Slug must be lowercase letters, numbers, and hyphens only');
      }

      return ctx.prisma.category.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          imageUrl: input.imageUrl,
        },
      });
    }),

  update: staffProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2).optional(),
        slug: z.string().optional(),
        description: z.string().nullable().optional(),
        imageUrl: z.string().url().nullable().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.category.findUnique({
        where: { id: input.id },
      });
      if (!existing) notFound('Category');

      let slug = input.slug;
      if (slug) {
        slug = slugify(slug);
        const clash = await ctx.prisma.category.findFirst({
          where: { slug, NOT: { id: input.id } },
        });
        if (clash) badRequest('Slug already in use');
      }

      return ctx.prisma.category.update({
        where: { id: input.id },
        data: {
          name: input.name,
          slug,
          description: input.description,
          imageUrl: input.imageUrl,
          isActive: input.isActive,
        },
      });
    }),

  delete: staffProcedure
    .input(z.object({ id: z.string(), hard: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.category.findUnique({
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
        await ctx.prisma.category.delete({ where: { id: input.id } });
        return { success: true, mode: 'deleted' as const };
      }

      await ctx.prisma.category.update({
        where: { id: input.id },
        data: { isActive: false },
      });
      return { success: true, mode: 'hidden' as const };
    }),

  seedDefaults: staffProcedure.mutation(async ({ ctx }) => {
    for (const cat of DEFAULT_CATEGORIES) {
      await ctx.prisma.category.upsert({
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
  }),
});
