import type { AuthService } from '@backend/services/auth.service';
import { router } from '@backend/config/trpc.config';
import { createAuthRouter } from '@backend/routers/auth.router';
import { categoryRouter } from '@backend/routers/category.router';
import { productRouter } from '@backend/routers/product.router';
import { userRouter } from '@backend/routers/user.router';
import { customerRouter } from '@backend/routers/customer.router';
import { cartRouter } from '@backend/routers/cart.router';
import { orderRouter } from '@backend/routers/order.router';
import { paymentRouter } from '@backend/routers/payment.router';
import { bannerRouter } from '@backend/routers/banner.router';
import { reviewRouter } from '@backend/routers/review.router';
import { deliveryPersonRouter } from '@backend/routers/delivery-person.router';
import { whatsappRouter } from '@backend/routers/whatsapp.router';
import { dashboardRouter } from '@backend/routers/dashboard.router';
import { posRouter } from '@backend/routers/pos.router';

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
    deliveryPerson: deliveryPersonRouter,
    whatsapp: whatsappRouter,
    dashboard: dashboardRouter,
    pos: posRouter,
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
