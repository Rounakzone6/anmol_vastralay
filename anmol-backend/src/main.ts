import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { Request } from 'express';
import helmet from 'helmet';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { AppModule } from './modules/app.module';
import { AuthService } from './services/auth.service';
import { CloudinaryService } from './services/cloudinary.service';
import { PrismaService } from './services/prisma.service';
import { createAppRouter } from './routers';

function getBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice(7);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prisma = app.get(PrismaService);
  const cloudinary = app.get(CloudinaryService);
  const auth = app.get(AuthService);
  const appRouter = createAppRouter(auth);

  app.use(helmet());
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
    ].filter((url): url is string => Boolean(url)),
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
        return { prisma, cloudinary, auth, user };
      },
    }),
  );

  const http = app.getHttpAdapter().getInstance();
  http.get('/', (_req, res) => {
    res.json({
      message: 'Anmol API',
      trpc: '/trpc',
      storefront: 'http://localhost:3000',
      admin: 'http://localhost:3002',
    });
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API:    http://localhost:${port}`);
  console.log(`tRPC:   http://localhost:${port}/trpc`);
  console.log(`Admin:  http://localhost:3002`);
}

void bootstrap();
