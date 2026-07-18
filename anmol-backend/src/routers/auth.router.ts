import { TRPCError } from '@trpc/server';
import type { AuthService } from '@backend/services/auth.service';
import {
  publicProcedure,
  router,
  protectedProcedure,
} from '@backend/config/trpc.config';
import {
  LoginSchema,
  RegisterSchema,
  GoogleAuthSchema,
} from '@backend/models/auth.model';

export const createAuthRouter = (auth: AuthService) =>
  router({
    login: publicProcedure.input(LoginSchema).mutation(async ({ input }) => {
      try {
        return await auth.login(input.identifier, input.password);
      } catch (error: any) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message || 'Invalid credentials',
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

    googleAuth: publicProcedure
      .input(GoogleAuthSchema)
      .mutation(async ({ input }) => {
        try {
          return await auth.googleAuth(input.credential);
        } catch (error: any) {
          const message = error.message || 'Google authentication failed';
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message,
          });
        }
      }),

    me: protectedProcedure.query(({ ctx }) => ctx.user),
  });
