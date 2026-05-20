import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { AuthService } from '../../auth/auth.service';
import { badRequest, publicProcedure, router, staffProcedure } from '../trpc';

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

    me: staffProcedure.query(({ ctx }) => ctx.user),

    bootstrapAdmin: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().min(2),
          password: z.string().min(6),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await auth.bootstrapAdmin(input);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Bootstrap failed';
          throw new TRPCError({ code: 'BAD_REQUEST', message });
        }
      }),
  });
