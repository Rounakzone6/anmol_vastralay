import { z } from 'zod';
import { router, adminProcedure, publicProcedure } from '@backend/config/trpc.config';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

export const deliveryPersonRouter = router({
  // Admin routes
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1, "Name is required"),
      phone: z.string().min(1, "Phone is required"),
      status: z.enum(['AVAILABLE', 'BUSY', 'OFF_DUTY']).optional().default('AVAILABLE'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const deliveryPerson = await ctx.prisma.deliveryPerson.create({
          data: input,
        });
        return deliveryPerson;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new TRPCError({ code: 'CONFLICT', message: 'Phone number already exists' });
        }
        throw error;
      }
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      phone: z.string().optional(),
      status: z.enum(['AVAILABLE', 'BUSY', 'OFF_DUTY']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      try {
        const deliveryPerson = await ctx.prisma.deliveryPerson.update({
          where: { id },
          data,
        });
        return deliveryPerson;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Delivery person not found' });
        }
        throw error;
      }
    }),

  delete: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.deliveryPerson.delete({
          where: { id: input.id },
        });
        return { success: true };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Delivery person not found' });
        }
        throw error;
      }
    }),

  getAll: adminProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.deliveryPerson.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              orders: {
                where: {
                  status: 'DELIVERED',
                },
              },
            },
          },
        },
      });
    }),

  getAvailable: adminProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.deliveryPerson.findMany({
        where: { status: 'AVAILABLE' },
        select: { id: true, name: true, status: true },
      });
    }),
});
