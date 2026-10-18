import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { AppModule } from './modules/app.module';
import { AuthService } from './services/auth.service';
import { CloudinaryService } from './services/cloudinary.service';
import { PrismaService } from './services/prisma.service';
import { CategoryService } from './services/category.service';
import { ProductService } from './services/product.service';
import { CartService } from './services/cart.service';
import { OrderService } from './services/order.service';
import { PaymentService } from './services/payment.service';
import { UserService } from './services/user.service';
import { CustomerService } from './services/customer.service';
import { BannerService } from './services/banner.service';
import { ReviewService } from './services/review.service';
import { WhatsappWebService } from './services/whatsapp-web.service';
import { AiService } from './services/ai.service';
import { MembershipService } from './services/membership.service';
import { HealthService } from './services/health.service';
import { MetricsService } from './services/metrics.service';
import { randomUUID } from 'node:crypto';

import { createAppRouter } from './routers';

const logger = new Logger('Bootstrap');
const backendurl = process.env.BACKEND_URL || 'http://localhost:3001';

function getBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice(7);
}

// Request logging middleware with Correlation ID
function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const method = req.method;
  const path = req.path;
  const correlationId =
    (req as any).correlationId ||
    (req.headers['x-correlation-id'] as string) ||
    '-';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusColor = statusCode >= 400 ? '❌' : '✓';
    if (process.env.NODE_ENV !== 'production' || statusCode >= 400) {
      logger.log(
        `${statusColor} [${correlationId}] ${method} ${path} → ${statusCode} (${duration}ms)`,
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
  const healthService = app.get(HealthService);
  const metricsService = app.get(MetricsService);

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
    whatsapp: app.get(WhatsappWebService),
    ai: app.get(AiService),
    membership: app.get(MembershipService),
  };

  const appRouter = createAppRouter(auth);

  // Trust reverse proxy headers (Nginx, ALB, Cloudflare) for accurate client IP tracking and rate limiting
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  app.use(helmet());

  // 1. Correlation ID Middleware (Distributed Tracing across client/proxy/backend)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const incomingId = (req.headers['x-correlation-id'] ||
      req.headers['x-request-id']) as string | undefined;
    const correlationId = incomingId || randomUUID();
    (req as any).correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    res.setHeader('x-request-id', correlationId);
    next();
  });

  // 2. Prometheus HTTP Metrics Middleware (RED Method: Rate, Errors, Duration)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/metrics') {
      return next();
    }

    metricsService.httpActiveRequests.inc();
    const start = process.hrtime();

    res.on('finish', () => {
      metricsService.httpActiveRequests.dec();

      const diff = process.hrtime(start);
      const durationInSeconds = diff[0] + diff[1] / 1e9;

      let route = req.baseUrl || req.path || 'unknown';
      if (route.startsWith('/trpc')) {
        route = '/trpc';
      } else if (route.startsWith('/admin')) {
        route = '/admin';
      }

      const statusCode = res.statusCode.toString();
      metricsService.httpRequestsTotal.inc({
        method: req.method,
        route,
        status_code: statusCode,
      });

      metricsService.httpRequestDurationSeconds.observe(
        {
          method: req.method,
          route,
          status_code: statusCode,
        },
        durationInSeconds,
      );
    });

    next();
  });

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
        'http://localhost:3001',
        'http://localhost:3002',
        'https://anmolvastralay.vercel.app',
        'https://admin-anmolvastralay.vercel.app',
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
      ].filter(Boolean);

      const isVercelPreview =
        origin &&
        /^https:\/\/(anmolvastralay|admin-anmolvastralay)(-[a-zA-Z0-9-]+)?\.vercel\.app$/.test(
          origin,
        );

      if (!origin || allowedOrigins.includes(origin) || isVercelPreview) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy blocked access from origin: ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-trpc-source',
    ],
    credentials: true,
    maxAge: 86400, // Cache preflight requests for 24 hours
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

  // Observability: Prometheus Metrics Scraping Endpoint
  http.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', metricsService.getContentType());
      res.end(await metricsService.getMetrics());
    } catch (err: any) {
      res.status(500).end(err?.message || 'Failed to collect Prometheus metrics');
    }
  });

  // Observability: Deep Health Check (Probes Primary DB, Read Replicas, Redis, Memory)
  http.get('/health', async (_req, res) => {
    const report = await healthService.getDeepHealth();
    const statusCode = report.status === 'unhealthy' ? 503 : 200;
    res.status(statusCode).json(report);
  });

  // Observability: Fast Kubernetes/Docker Liveness Probe
  http.get('/health/live', (_req, res) => {
    res.status(200).json(healthService.getLiveness());
  });

  // Observability: Kubernetes/Load Balancer Readiness Probe
  http.get('/health/ready', async (_req, res) => {
    const report = await healthService.getDeepHealth();
    const isReady = report.components.primaryDatabase.status === 'up';
    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      details: report.components,
    });
  });

  // Root endpoint with API info
  http.get('/', (_req, res) => {
    res.json({
      message: 'Anmol Vastralay API',
      version: '0.0.1',
      endpoints: {
        health: '/health',
        liveness: '/health/live',
        readiness: '/health/ready',
        metrics: '/metrics',
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
  logger.log(`✓ tRPC Playground: ${backendurl}/trpc`);
  logger.log(`✓ Prometheus Metrics: ${backendurl}/metrics`);
  logger.log(`✓ Deep Health Check: ${backendurl}/health`);
  logger.log(`✓ Liveness Probe: ${backendurl}/health/live`);
  logger.log(`✓ Readiness Probe: ${backendurl}/health/ready`);
  logger.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(
    `✓ Database: ${process.env.DATABASE_URL?.split('@')[1] || 'not configured'}`,
  );
}

void bootstrap();
