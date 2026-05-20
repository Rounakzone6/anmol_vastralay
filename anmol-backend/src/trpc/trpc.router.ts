import type { AuthService } from '../auth/auth.service';
import { router } from './trpc';
import { createAuthRouter } from './routers/auth.router';
import { categoryRouter } from './routers/category.router';
import { productRouter } from './routers/product.router';
import { userRouter } from './routers/user.router';

export function createAppRouter(auth: AuthService) {
  return router({
    auth: createAuthRouter(auth),
    category: categoryRouter,
    product: productRouter,
    user: userRouter,
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
