# Anmol Vastralay - Backend API

A high-performance NestJS backend for the Anmol Vastralay e-commerce platform. Provides REST/tRPC endpoints for product management, authentication, payments, and order processing.

## Features

- **tRPC & Express**: Type-safe RPC framework with Express integration
- **PostgreSQL + Prisma**: Robust relational database with migrations
- **JWT Authentication**: Secure token-based auth with role-based access (admin, staff, customer)
- **Product Management**: Support for sarees (color variants) and standard garments (color + size)
- **Image Hosting**: Cloudinary integration for product images with auto-optimization
- **Payments**: Razorpay integration for secure payment processing
- **Google OAuth**: Customer sign-in via Google
- **CORS & Helmet**: Security headers and CORS configuration
- **Rate Limiting**: Throttle requests to prevent abuse
- **Comprehensive Validation**: tRPC + Zod schema validation

## Database Query Safety

Application database access must use Prisma's typed query builders (`findMany`,
`findUnique`, `create`, `update`, and related methods). Prisma parameterizes
values supplied through these APIs, including search text and filter values, so
they are not concatenated into SQL statements.

When a database operation cannot be expressed with the query builder, use a
tagged Prisma template:

```ts
await prisma.$queryRaw`SELECT "id" FROM "Product" WHERE "slug" = ${slug}`;
```

Never concatenate user-controlled values into SQL and never use
`$queryRawUnsafe` or `$executeRawUnsafe`. The backend ESLint configuration
rejects both unsafe Prisma APIs.

## Prerequisites

- **Node.js** v18+ (check with `node --version`)
- **npm** v9+ (check with `npm --version`)
- **PostgreSQL** v12+ (local or remote instance)
- Environment variables properly set (see `.env.example`)

## Quick Start (Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env` with your:
- Database connection string
- JWT secret (generate with `openssl rand -hex 32`)
- Cloudinary, Razorpay, and Google OAuth credentials

### 3. Database Setup

Initialize and migrate the database:

```bash
npm run prisma:generate   # Generate Prisma Client
npm run prisma:migrate    # Run migrations
npm run prisma:seed       # (Optional) Seed demo data
```

### 4. Start Development Server

```bash
npm run start:dev
```

Server runs at `http://localhost:3001`

tRPC playground available at `http://localhost:3001/trpc`

## Project Structure

```
src/
├── main.ts                    # Entry point
├── config/
│   └── trpc.config.ts         # tRPC router & middleware setup
├── models/
│   ├── product.model.ts       # Product schemas & types
│   ├── auth.model.ts          # Auth schemas
│   └── ...
├── services/
│   ├── product.service.ts     # Product business logic
│   ├── auth.service.ts        # Authentication & JWT
│   ├── prisma.service.ts      # Database client wrapper
│   ├── cloudinary.service.ts  # Image upload/deletion
│   ├── payment.service.ts     # Razorpay integration
│   └── ...
├── routers/
│   ├── product.router.ts      # Product tRPC routes
│   ├── auth.router.ts         # Auth tRPC routes
│   └── ...
├── modules/
│   └── app.module.ts          # NestJS module configuration
└── utils/
    ├── slug.ts                # URL-friendly slugs
    ├── pricing.ts             # Price calculations
    └── ...

prisma/
├── schema.prisma              # Database schema
├── seed.ts                    # Demo data seeder
└── migrations/                # Database migrations
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build for production (`dist/` folder) |
| `npm run start:dev` | Watch mode (development) |
| `npm run start:prod` | Run production build |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run prisma:seed` | Seed demo data |

## API Endpoints

### Base URL
- Development: `http://localhost:3001`
- Health: `GET /` → Returns API info

### tRPC Routes
All routes are under `/trpc` with the following namespaces:

#### **Auth**
- `auth.register` (POST) - Customer registration
- `auth.login` (POST) - Login with email/phone
- `auth.googleSignIn` (POST) - Google OAuth sign-in
- `auth.logout` (POST) - Invalidate token

#### **Products**
- `product.list` (GET) - List products with filters
  - Supports: `page`, `pageSize`, `categoryId`, `categorySlug`, `search`, `kind`, `includeInactive`
- `product.getById` (GET) - Get single product by ID
- `product.getBySlug` (GET) - Get single product by URL slug
- `product.create` (POST) - Create product (staff only)
- `product.update` (PATCH) - Update product (staff only)
- `product.delete` (DELETE) - Delete product (staff only)
- `product.uploadImage` (POST) - Upload image to Cloudinary

#### **Categories**
- `category.list` (GET) - List all categories
- `category.create` (POST) - Create category (admin only)

#### **Cart**
- `cart.getCart` (GET) - Get customer cart
- `cart.addItem` (POST) - Add item to cart
- `cart.removeItem` (DELETE) - Remove item from cart
- `cart.clear` (POST) - Clear all items

#### **Orders**
- `order.list` (GET) - List customer orders
- `order.create` (POST) - Create order from cart
- `order.getDetails` (GET) - Get order details

#### **Payments**
- `payment.createRazorpayOrder` (POST) - Create Razorpay order
- `payment.verifyPayment` (POST) - Verify payment signature

See [PRODUCT_API.md](docs/PRODUCT_API.md) for detailed endpoint documentation.

## Database Schema

### Key Models
- **User**: Admin/Staff/Customer accounts with JWT tokens
- **Product**: Items with variants (color/size), images, pricing
- **Category**: Product categorization (Saree, Kurti, etc.)
- **Cart**: Shopping cart with items and quantities
- **Order**: Completed purchases with shipping & payment status
- **Payment**: Razorpay payment records with signature verification

Run `npm run prisma:studio` to visualize the schema.

## Authentication

### JWT Tokens
- Issued on login/registration
- Contains: `userId`, `role`, `email`
- Expires: 7 days (configurable via `JWT_EXPIRES_IN`)
- Sent via: `Authorization: Bearer <token>` header

### Roles
- **ADMIN**: Full system access (users, categories, payments)
- **STAFF**: Product management (create, update, delete)
- **CUSTOMER**: Purchase products, view orders, manage cart

## Deployment

### Production Build

```bash
# Build
npm run build

# Run
npm run start:prod
```

Output is in `dist/` folder.

### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist

EXPOSE 3001
CMD ["node", "dist/main"]
```

Build and run:
```bash
docker build -t anmol-backend .
docker run -p 3001:3001 --env-file .env anmol-backend
```

### Environment Variables (Production)

Required for production deployment:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/anmol_prod
JWT_SECRET=<generate-with-openssl-rand-hex-32>
FRONTEND_URL=https://anmolvastralay.com
ADMIN_URL=https://admin.anmolvastralay.com
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
RAZORPAY_KEY_ID=<your-production-key>
RAZORPAY_KEY_SECRET=<your-production-secret>
PORT=3001
```

### Database Backup

```bash
# Dump database
pg_dump -h localhost -U postgres anmol_db > backup.sql

# Restore database
psql -h localhost -U postgres anmol_db < backup.sql
```

## Performance Optimization

- **Database Indexing**: Indexed on `slug`, `email`, `phone` for faster lookups
- **Pagination**: Implements cursor-based pagination for list endpoints
- **Caching**: Consider adding Redis for session/cart caching (TODO)
- **Query Optimization**: Prisma includes relations selectively to reduce payload

## Security

- **Helmet**: Security headers (CSP, X-Frame-Options, etc.)
- **CORS**: Whitelisted origins (frontend, admin)
- **Rate Limiting**: 100 requests per 60 seconds per IP
- **Input Validation**: Zod schemas validate all inputs
- **Password Hashing**: bcryptjs with salt rounds = 10
- **JWT**: Signed with HS256, verified on all protected routes

## Monitoring & Logging

Logs are output to console. For production, integrate:
- **Winston** or **Pino** for structured logging
- **Sentry** for error tracking
- **New Relic** or **DataDog** for APM

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running: `psql -U postgres`
- Check `DATABASE_URL` in `.env`
- Run migrations: `npm run prisma:migrate`

### JWT/Auth Issues
- Ensure `JWT_SECRET` is set
- Check token expiry: `JWT_EXPIRES_IN`
- Verify token in `Authorization` header

### Cloudinary Errors
- Verify credentials in `.env`
- Check upload folder exists in Cloudinary console

### Payment Integration Issues
- Test with Razorpay test keys first
- Verify webhook signature verification

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -m "Add my feature"`
3. Push: `git push origin feature/my-feature`
4. Open a Pull Request

## Support

For issues or questions:
- Check [PRODUCT_API.md](docs/PRODUCT_API.md) for API details
- Review Prisma docs: https://www.prisma.io/docs
- NestJS docs: https://docs.nestjs.com

## License

UNLICENSED (Internal Use Only)
