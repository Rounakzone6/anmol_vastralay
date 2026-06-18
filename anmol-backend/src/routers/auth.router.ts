import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { AuthService } from '../services/auth.service';
import { badRequest, publicProcedure, router, protectedProcedure } from '../config/trpc.config';

export const createAuthRouter = (auth: AuthService) =>
  router({
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await auth.login(input.email, input.password);
        } catch {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }
      }),

    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().min(2),
          password: z.string().min(6),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const hashedPassword = await ctx.auth.hashPassword(input.password);
          const user = await ctx.prisma.user.create({
            data: {
              email: input.email,
              name: input.name,
              password: hashedPassword,
              role: 'CUSTOMER',
              cart: { create: {} }
            },
            select: { id: true, email: true, name: true, role: true },
          });
          return await auth.login(input.email, input.password);
        } catch (error: any) {
          if (error.code === 'P2002') {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Email already exists',
            });
          }
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message || 'Registration failed',
          });
        }
      }),

    me: protectedProcedure.query(({ ctx }) => ctx.user),
  });
