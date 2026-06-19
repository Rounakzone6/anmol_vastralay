# Anmol Vastralay Admin Panel

Admin dashboard for managing Anmol Vastralay e-commerce platform. Built with Next.js 16, React 19, tRPC, and Tailwind CSS.

## Features

- **Staff Authentication**: JWT-based login for admin staff
- **Dashboard**: Real-time analytics and quick stats
- **Product Management**: 
  - Create, update, delete products (Sarees & standard items)
  - Manage product images via Cloudinary
  - Set pricing, inventory, and variants
- **Category Management**: Organize products into categories
- **Order Management**: View orders, update status, track payments
- **Customer Management**: View customer profiles and order history
- **Banner Management**: Create and manage promotional banners
- **Responsive Design**: Mobile-friendly admin interface
- **Type Safety**: Full TypeScript support with Zod validation
- **Real-time Data**: React Query for efficient data fetching

## Prerequisites

- Node.js v18+ 
- npm v9+
- Backend API running on `http://localhost:3001`
- Staff/Admin account created in the system

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/trpc
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) and login with your staff credentials.

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
anmol-admin/
├── app/
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Dashboard home
│   ├── login/
│   │   └── page.tsx         # Staff login page
│   ├── (admin)/             # Protected admin routes
│   │   ├── layout.tsx       # Admin shell layout
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── products/        # Product management
│   │   ├── categories/      # Category management
│   │   ├── orders/          # Order management
│   │   ├── customers/       # Customer management
│   │   ├── banners/         # Banner management
│   │   └── staff/           # Staff management
│
├── components/
│   ├── admin-shell.tsx      # Admin layout wrapper
│   ├── page-header.tsx      # Page title & actions
│   ├── image-upload.tsx     # Cloudinary uploader
│   ├── product-form.tsx     # Product form component
│   ├── product-image-upload.tsx  # Product image uploader
│   ├── providers.tsx        # Context/provider setup
│   └── ui.tsx               # Reusable UI components
│
├── lib/
│   ├── auth.ts              # Authentication utilities
│   ├── format.ts            # Formatting utilities
│   ├── images.ts            # Image handling
│   └── trpc.ts              # tRPC client setup
│
├── public/                  # Static assets
├── pages/                   # Legacy Pages Router (fallback)
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript config
```

## Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/trpc` | Backend tRPC endpoint |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3002` | Admin panel URL (for redirects) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `your-cloud` | Cloudinary for image uploads |
| `NEXT_PUBLIC_LOG_LEVEL` | `debug` | Console log level |

**Note**: All `NEXT_PUBLIC_*` variables are exposed in browser, so never put secrets here. Use the backend for sensitive data.

## Key Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (port 3002) |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Fix ESLint issues automatically |
| `npm run lint:check` | Check ESLint without fixing |
| `npm run type-check` | Verify TypeScript types |

## Authentication Flow

1. User visits admin panel (port 3002)
2. Redirects to `/login` if not authenticated
3. Enters staff credentials
4. Backend validates and returns JWT token
5. Token stored in browser (secure HTTP-only cookie recommended)
6. tRPC client automatically sends token in Authorization header
7. All subsequent requests authenticated via Bearer token

## API Integration

The admin panel communicates with the backend via tRPC:

### Example: Creating a Product

```typescript
// In a server action or API route
const product = await trpc.createProduct.mutate({
  name: 'Silk Saree',
  price: 5000,
  category_id: 'cat_123',
  images: ['https://res.cloudinary.com/...'],
  inventory: {
    color: 'Red',
    size: 'Free',
    sku: 'SKU-001',
    quantity: 10,
  },
});
```

All tRPC calls are:
- **Type-safe**: TypeScript validates request/response
- **Validated**: Zod schema validation on backend
- **Cached**: React Query handles caching

## Image Management

### Upload Images with Cloudinary

```typescript
import { uploadToCloudinary } from '@/lib/images';

const url = await uploadToCloudinary(file, {
  folder: 'anmol/products',
  resource_type: 'auto',
});
```

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="https://res.cloudinary.com/..."
  alt="Product"
  width={400}
  height={400}
  quality={85}
/>
```

## Deployment

### Docker

```bash
docker build -t anmol-admin:latest .
docker run -p 3002:3002 \
  -e NEXT_PUBLIC_API_URL=https://api.anmolvastralay.com/trpc \
  -e NEXT_PUBLIC_SITE_URL=https://admin.anmolvastralay.com \
  anmol-admin:latest
```

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` → `https://api.anmolvastralay.com/trpc`
   - `NEXT_PUBLIC_SITE_URL` → `https://admin.anmolvastralay.com`
4. Deploy automatically on push

### AWS Amplify / Netlify

Similar setup to Vercel - connect GitHub repo and configure environment variables.

## Performance Tips

1. **Image Optimization**: Use `next/image` component (already implemented)
2. **Code Splitting**: Dynamic imports for heavy components
3. **Caching**: React Query caches API responses (5 min default)
4. **Lazy Loading**: Routes load only when needed

## Security

- ✅ CORS configured for backend communication
- ✅ JWT authentication for all staff actions
- ✅ Zod schema validation on all inputs
- ✅ Environment variables never logged
- ✅ Secure HTTP-only cookies recommended for tokens
- ✅ CSRF protection via same-site cookies

## Troubleshooting

### Build Error: "next.config.ts is not supported"

**Solution**: This project uses `next.config.js`. If you see this error, make sure:
```bash
rm next.config.ts  # Remove TypeScript version
```

### "Can't resolve '@trpc/server'"

**Solution**: Install dependencies:
```bash
npm install
```

### Blank page after login

**Solution**: Check:
1. Backend API is running on `http://localhost:3001`
2. Environment variables in `.env.local` are correct
3. Browser DevTools → Network tab for failed requests

### Image uploads fail

**Solution**: Verify:
1. Cloudinary credentials in backend `.env`
2. Backend is running (handles image uploads)
3. Check backend logs for Cloudinary errors

## Development Workflow

### Adding a New Admin Page

1. Create folder in `app/(admin)/feature-name/`
2. Add `page.tsx` and optional `layout.tsx`
3. Fetch data via tRPC in server component or API route
4. Use client components for interactivity
5. Protect with staff authentication

Example:
```typescript
// app/(admin)/promotions/page.tsx
'use client';
import { trpc } from '@/lib/trpc';

export default function PromotionsPage() {
  const { data: promotions } = trpc.getPromotions.useQuery();
  
  return (
    <div>
      <h1>Promotions</h1>
      {promotions?.map(p => <PromotionCard key={p.id} {...p} />)}
    </div>
  );
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - Anmol Vastralay
