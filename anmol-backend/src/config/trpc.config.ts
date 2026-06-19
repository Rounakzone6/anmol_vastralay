import { initTRPC, TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';
import type { AuthService, AuthUser } from '../services/auth.service';
import type { CloudinaryService } from '../services/cloudinary.service';
import type { CategoryService } from '../services/category.service';
import type { ProductService } from '../services/product.service';
import type { CartService } from '../services/cart.service';
import type { OrderService } from '../services/order.service';
import type { PaymentService } from '../services/payment.service';
import type { UserService } from '../services/user.service';
import type { CustomerService } from '../services/customer.service';
import type { BannerService } from '../services/banner.service';
import type { TrackingService } from '../services/tracking.service';

export interface TRPCContext {
  prisma: PrismaClient;
  cloudinary: CloudinaryService;
  auth: AuthService;
  user: AuthUser | null;
  services: {
    category: CategoryService;
    product: ProductService;
    cart: CartService;
    order: OrderService;
    payment: PaymentService;
    user: UserService;
    customer: CustomerService;
    banner: BannerService;
    tracking: TrackingService;
  };
}

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
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

export const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'STAFF' && ctx.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Staff access required' });
  }
  return next({ ctx });
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
