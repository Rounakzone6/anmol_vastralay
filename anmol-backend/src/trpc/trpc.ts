import { initTRPC, TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';
import type { AuthService, AuthUser } from '../auth/auth.service';
import type { CloudinaryService } from '../cloudinary/cloudinary.service';

export interface TRPCContext {
  prisma: PrismaClient;
  cloudinary: CloudinaryService;
  auth: AuthService;
  user: AuthUser | null;
}

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const staffProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Please sign in' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const adminProcedure = staffProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export function notFound(entity: string): never {
  throw new TRPCError({ code: 'NOT_FOUND', message: `${entity} not found` });
}

export function badRequest(message: string): never {
  throw new TRPCError({ code: 'BAD_REQUEST', message });
}
