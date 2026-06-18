import type { AuthService } from '../services/auth.service';
import { router } from '../config/trpc.config';
import { createAuthRouter } from './auth.router';
import { categoryRouter } from './category.router';
import { productRouter } from './product.router';
import { userRouter } from './user.router';
import { customerRouter } from './customer.router';
import { cartRouter } from './cart.router';
import { orderRouter } from './order.router';
import { paymentRouter } from './payment.router';

export function createAppRouter(auth: AuthService) {
  return router({
    auth: createAuthRouter(auth),
    category: categoryRouter,
    product: productRouter,
    user: userRouter,
    customer: customerRouter,
    cart: cartRouter,
    order: orderRouter,
    payment: paymentRouter,
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
