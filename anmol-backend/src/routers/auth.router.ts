import { TRPCError } from '@trpc/server';
import type { AuthService } from '../services/auth.service';
import { publicProcedure, router, protectedProcedure } from '../config/trpc.config';
import { LoginSchema, RegisterSchema } from '../models/auth.model';

export const createAuthRouter = (auth: AuthService) =>
  router({
    login: publicProcedure
      .input(LoginSchema)
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
      .input(RegisterSchema)
      .mutation(async ({ input }) => {
        try {
          return await auth.register(input);
        } catch (error: any) {
          const message = error.message as string;
          if (message.startsWith('CONFLICT:')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: message.replace('CONFLICT:', ''),
            });
          }
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: message.replace('BAD_REQUEST:', ''),
          });
        }
      }),

    me: protectedProcedure.query(({ ctx }) => ctx.user),
  });
