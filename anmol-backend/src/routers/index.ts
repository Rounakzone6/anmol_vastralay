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
import { bannerRouter } from './banner.router';
import { reviewRouter } from './review.router';


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
    banner: bannerRouter,
    review: reviewRouter,
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

