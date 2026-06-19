# Admin Panel Deployment Guide

Complete guide for deploying the Anmol Vastralay admin panel to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Deployment](#docker-deployment)
3. [Vercel Deployment](#vercel-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js v18+
- npm v9+
- Backend API running and accessible
- Git repository (for CI/CD)
- Deployment platform account (Vercel, Netlify, AWS, etc.)

---

## Docker Deployment

### Build Docker Image

```bash
docker build -t anmol-admin:latest .
```

### Run Locally

```bash
docker run -p 3002:3002 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3001/trpc \
  -e NEXT_PUBLIC_SITE_URL=http://localhost:3002 \
  anmol-admin:latest
```

### Docker Compose (Development)

From root directory:

```bash
docker-compose up admin
```

This starts:
- Admin panel on `http://localhost:3002`
- Backend API on `http://localhost:3001`
- PostgreSQL database on `localhost:5432`

### Push to Docker Registry

#### DockerHub

```bash
docker login
docker tag anmol-admin:latest yourusername/anmol-admin:latest
docker push yourusername/anmol-admin:latest
```

#### AWS ECR

```bash
aws ecr create-repository --repository-name anmol-admin

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker tag anmol-admin:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/anmol-admin:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/anmol-admin:latest
```

---

## Vercel Deployment (Recommended)

### Option 1: GitHub Integration (Easiest)

1. **Connect Repository**
   - Push code to GitHub
   - Go to [Vercel](https://vercel.com/new)
   - Import the repository
   - Select `anmol-admin` as the root directory

2. **Configure Environment Variables**
   In Vercel Dashboard → Project Settings → Environment Variables:

   ```
   NEXT_PUBLIC_API_URL = https://api.anmolvastralay.com/trpc
   NEXT_PUBLIC_SITE_URL = https://admin.anmolvastralay.com
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = your-cloudinary-name
   ```

3. **Deploy**
   - Click "Deploy"
   - Vercel auto-deploys on every push to main branch

### Option 2: CLI Deployment

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Custom Domain Setup

1. In Vercel Dashboard, go to Project Settings → Domains
2. Add your domain (e.g., `admin.anmolvastralay.com`)
3. Update DNS records to point to Vercel
4. SSL certificate auto-generates

### Environment Variables in Vercel

For different environments (preview vs production):

```bash
# Production
NEXT_PUBLIC_API_URL = https://api.anmolvastralay.com/trpc

# Preview/Staging
NEXT_PUBLIC_API_URL = https://api-staging.anmolvastralay.com/trpc
```

---

## Netlify Deployment

### GitHub Integration

1. Go to [Netlify](https://netlify.com) → New site from Git
2. Connect GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Add environment variables (same as Vercel)
6. Deploy

### Build Settings

```
Build command: npm run build
Publish directory: .next
Node version: 20.x
```

### Environment Variables

In Netlify Dashboard → Site settings → Build & deploy → Environment:

```
NEXT_PUBLIC_API_URL = https://api.anmolvastralay.com/trpc
NEXT_PUBLIC_SITE_URL = https://admin.anmolvastralay.com
```

---

## AWS Deployment

### Option 1: AWS Amplify (Easy)

```bash
npm install -g @aws-amplify/cli
amplify init
amplify hosting add
amplify publish
```

### Option 2: ECS + CloudFront (Advanced)

#### 1. Create ECR Repository

```bash
aws ecr create-repository --repository-name anmol-admin
```

#### 2. Build and Push Image

```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
docker build -t anmol-admin:latest .
docker tag anmol-admin:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/anmol-admin:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/anmol-admin:latest
```

#### 3. Create ECS Task Definition

```json
{
  "family": "anmol-admin",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "anmol-admin",
      "image": "YOUR_ECR_URI:latest",
      "portMappings": [
        {
          "containerPort": 3002,
          "hostPort": 3002,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NEXT_PUBLIC_API_URL",
          "value": "https://api.anmolvastralay.com/trpc"
        },
        {
          "name": "NEXT_PUBLIC_SITE_URL",
          "value": "https://admin.anmolvastralay.com"
        }
      ]
    }
  ]
}
```

#### 4. Create ECS Service

```bash
aws ecs create-service \
  --cluster anmol-prod \
  --service-name anmol-admin \
  --task-definition anmol-admin:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

#### 5. Setup CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name admin-alb.us-east-1.elb.amazonaws.com \
  --default-root-object /
```

---

## Environment Configuration

### Production Environment Variables

```bash
# API Endpoint
NEXT_PUBLIC_API_URL=https://api.anmolvastralay.com/trpc

# Admin Panel URL (for redirects/CORS)
NEXT_PUBLIC_SITE_URL=https://admin.anmolvastralay.com

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=anmol-prod

# Build Environment
NODE_ENV=production

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Log Level
NEXT_PUBLIC_LOG_LEVEL=warn
```

### Staging Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://api-staging.anmolvastralay.com/trpc
NEXT_PUBLIC_SITE_URL=https://admin-staging.anmolvastralay.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=anmol-staging
NODE_ENV=production
NEXT_PUBLIC_LOG_LEVEL=info
```

---

## Security Best Practices

### 1. API Security

- ✅ Always use HTTPS in production
- ✅ Backend must validate JWT tokens
- ✅ Implement CORS with specific allowed origins
- ✅ Add rate limiting on backend

### 2. Authentication

- ✅ Store JWT tokens in HTTP-only cookies
- ✅ Set `Secure` flag on cookies (HTTPS only)
- ✅ Set `SameSite=Strict` on cookies
- ✅ Implement token refresh mechanism

### 3. Environment Variables

- ❌ Never commit `.env.local` to Git
- ✅ Use secrets manager for sensitive values
- ✅ Rotate API keys regularly
- ✅ Different keys for each environment

### 4. Headers & Security

Add security headers in `next.config.js`:

```javascript
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains'
      }
    ]
  }
]
```

### 5. Redirects

Add redirect in `next.config.js` to force HTTPS:

```javascript
redirects: async () => [
  {
    source: '/:path*',
    destination: 'https://:host/:path*',
    permanent: true
  }
]
```

---

## Performance Optimization

### 1. Image Optimization

- Use `next/image` component (already implemented)
- Cloudinary handles image optimization
- Cache headers set automatically

### 2. Code Splitting

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const ProductForm = dynamic(() => import('@/components/product-form'), {
  loading: () => <p>Loading...</p>
});
```

### 3. Database Queries

- Implement pagination (50 items per page)
- Use React Query for caching (5 min default)
- Avoid N+1 queries on backend

### 4. Monitoring

Add monitoring to catch performance issues:

```bash
# Vercel Analytics (auto-enabled)
# Tracks Web Vitals: LCP, FID, CLS

# Or use external service:
npm install web-vitals
```

---

## Monitoring & Logging

### Health Checks

```bash
# Check admin panel health
curl https://admin.anmolvastralay.com/health 2>/dev/null || echo "Admin offline"

# Check API health
curl https://api.anmolvastralay.com/health | jq '.status'
```

### Error Tracking (Optional)

```bash
npm install @sentry/nextjs
```

Configure in `next.config.js`:

```javascript
withSentryConfig(nextConfig, {
  org: "your-org",
  project: "anmol-admin",
})
```

### Logging

Monitor logs from deployment platform:

```bash
# Vercel
vercel logs

# AWS CloudWatch
aws logs tail /ecs/anmol-admin --follow

# Netlify
netlify logs:functions
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Admin Panel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      
      - run: npm run lint:check
      
      - run: npm run type-check
      
      - run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: anmol-admin
```

---

## Rollback Procedure

### Vercel

1. Go to Vercel Dashboard → Deployments
2. Find previous stable deployment
3. Click the deployment → "Promote to Production"

### Docker / Manual

```bash
# Keep previous image tagged with version
docker tag anmol-admin:v1.2.3 anmol-admin:latest
docker push anmol-admin:latest

# Restart container with previous version
docker restart anmol-admin
```

---

## Troubleshooting

### Build Failures

**Error: "next.config.ts is not supported"**
- Solution: Use `next.config.js` (already configured)

**Error: "Module not found: '@trpc/server'"**
- Solution: Run `npm install`

**Error: "NEXT_PUBLIC_API_URL is not defined"**
- Solution: Set environment variable before building

### Runtime Issues

**Blank page after deployment**
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_API_URL` is correct
3. Check if backend API is online
4. Verify CORS headers in backend

**Authentication not working**
1. Ensure backend JWT validation is enabled
2. Check token expiration
3. Verify backend and admin panel are on same domain
4. Check cookie settings (SameSite, Secure flags)

**Images not loading**
1. Verify Cloudinary credentials in backend
2. Check image URLs in database
3. Verify CORS on Cloudinary

### Performance Issues

**Slow page load**
1. Check Network tab in DevTools
2. Verify API response times
3. Check database query performance
4. Monitor server resources

---

## Support & Maintenance

- Monitor error tracking service (Sentry, etc.)
- Review performance metrics weekly
- Update dependencies monthly: `npm audit`
- Test new versions before deploying to production
- Keep backups of database and images
- Document deployment procedure for team
