import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { AppModule } from '@backend/modules/app.module';
import { AuthService } from '@backend/services/auth.service';
import { CloudinaryService } from '@backend/services/cloudinary.service';
import { PrismaService } from '@backend/services/prisma.service';
import { CategoryService } from '@backend/services/category.service';
import { ProductService } from '@backend/services/product.service';
import { CartService } from '@backend/services/cart.service';
import { OrderService } from '@backend/services/order.service';
import { PaymentService } from '@backend/services/payment.service';
import { UserService } from '@backend/services/user.service';
import { CustomerService } from '@backend/services/customer.service';
import { BannerService } from '@backend/services/banner.service';
import { ReviewService } from '@backend/services/review.service';

import { createAppRouter } from '@backend/routers';

const logger = new Logger('Bootstrap');

function getBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice(7);
}

// Request logging middleware
function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const method = req.method;
  const path = req.path;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusColor = statusCode >= 400 ? '❌' : '✓';
    if (process.env.NODE_ENV !== 'production' || statusCode >= 400) {
      logger.log(
        `${statusColor} ${method} ${path} → ${statusCode} (${duration}ms)`,
      );
    }
  });

  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const prisma = app.get(PrismaService);
  const cloudinary = app.get(CloudinaryService);
  const auth = app.get(AuthService);

  const services = {
    category: app.get(CategoryService),
    product: app.get(ProductService),
    cart: app.get(CartService),
    order: app.get(OrderService),
    payment: app.get(PaymentService),
    user: app.get(UserService),
    customer: app.get(CustomerService),
    banner: app.get(BannerService),
    review: app.get(ReviewService),
  };

  const appRouter = createAppRouter(auth);

  app.use(helmet());
  app.use(requestLogger);

  // Apply Rate Limiting (to prevent brute-force and IP-based DDoS)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // limit each IP to 500 requests per windowMs
      message: { message: 'Too many requests from this IP, please try again later.' },
    })
  );

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3002',
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
      ].filter(Boolean);

      // Allow if it matches explicit URLs, or if it's a Vercel preview URL for frontend or admin
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (origin.startsWith('https://anmol-vastralay') &&
          origin.endsWith('.vercel.app')) ||
        (origin.startsWith('https://anmol-admin') &&
          origin.endsWith('.vercel.app'))
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: async ({ req }) => {
        const token = getBearerToken(req);
        const user = await auth.getUserFromToken(token);
        return { prisma, cloudinary, auth, user, services };
      },
    }),
  );

  const http = app.getHttpAdapter().getInstance();

  // Health check endpoint
  http.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Root endpoint with API info
  http.get('/', (_req, res) => {
    res.json({
      message: 'Anmol Vastralay API',
      version: '0.0.1',
      endpoints: {
        health: '/health',
        trpc: '/trpc',
      },
      services: {
        storefront: process.env.FRONTEND_URL || 'http://localhost:3000',
        admin: process.env.ADMIN_URL || 'http://localhost:3002',
      },
      documentation: '/docs (if available)',
    });
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  logger.log(`✓ API Server running on port ${port}`);
  logger.log(`✓ tRPC Playground: http://localhost:${port}/trpc`);
  logger.log(`✓ Health Check: http://localhost:${port}/health`);
  logger.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(
    `✓ Database: ${process.env.DATABASE_URL?.split('@')[1] || 'not configured'}`,
  );
}

void bootstrap();
