import { z } from 'zod';
import { adminProcedure, notFound, router, staffProcedure } from '../config/trpc.config';

export const userRouter = router({
  getUsers: staffProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  getCustomers: staffProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  createUser: adminProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email address'),
        name: z.string().min(2, 'Name must be at least 2 characters'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        role: z.enum(['ADMIN', 'STAFF']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hashedPassword = await ctx.auth.hashPassword(input.password);
      return ctx.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          password: hashedPassword,
          role: input.role ?? 'STAFF',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
    }),

  getUserById: staffProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
      if (!user) notFound('User');
      return user;
    }),
});
