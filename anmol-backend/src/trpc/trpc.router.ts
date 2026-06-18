import type { AuthService } from '../auth/auth.service';
import { router } from './trpc';
import { createAuthRouter } from './routers/auth.router';
import { categoryRouter } from './routers/category.router';
import { productRouter } from './routers/product.router';
import { userRouter } from './routers/user.router';
import { customerRouter } from './routers/customer.router';
import { cartRouter } from './routers/cart.router';
import { orderRouter } from './routers/order.router';
import { paymentRouter } from './routers/payment.router';

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
