# Anmol Vastralay - Complete Deployment Guide

Complete guide for deploying the entire Anmol Vastralay e-commerce platform (Frontend, Admin, Backend).

## Project Structure

```
anmol_vastralay/
├── anmol-frontend/        # Customer-facing storefront (Next.js)
├── anmol-admin/           # Admin dashboard (Next.js)  
├── anmol-backend/         # REST/tRPC API (NestJS)
└── docker-compose.yml     # Full stack orchestration
```

## Quick Start (Development)

### Using Docker Compose

```bash
# Start entire stack: PostgreSQL, Backend, Admin, Frontend
docker-compose up

# Services:
# - Frontend:  http://localhost:3000
# - Admin:     http://localhost:3002
# - API:       http://localhost:3001
# - Database:  localhost:5432
```

### Local Development

```bash
# Terminal 1: Backend
cd anmol-backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev  # http://localhost:3001

# Terminal 2: Admin
cd anmol-admin
npm install
npm run dev        # http://localhost:3002

# Terminal 3: Frontend
cd anmol-frontend
npm install
npm run dev        # http://localhost:3000
```

---

## Production Deployment

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  CDN (Cloudflare)                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │   Frontend   │  │     Admin    │  │ Backend  │ │
│  │ (Vercel)     │  │ (Vercel)     │  │ (AWS)    │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                            │       │
│  ┌─────────────────────────────────────────┴──────┐│
│  │        AWS RDS (PostgreSQL)                    ││
│  │        AWS S3 (Images via Cloudinary)          ││
│  └──────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────┘
```

### 1. Backend Deployment

#### Option A: AWS ECS + RDS (Recommended)

**Step 1: Setup RDS Database**

```bash
# Create PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier anmol-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password 'SecurePassword123!' \
  --allocated-storage 20 \
  --publicly-accessible false
```

**Step 2: Build Docker Image**

```bash
cd anmol-backend
docker build -t anmol-backend:latest .

# Push to ECR
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
aws ecr create-repository --repository-name anmol-backend
aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker tag anmol-backend:latest $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/anmol-backend:latest
docker push $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/anmol-backend:latest
```

**Step 3: Create ECS Service** (see [anmol-backend/DEPLOYMENT.md](anmol-backend/DEPLOYMENT.md) for details)

**Step 4: Setup Application Load Balancer**

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name anmol-alb \
  --subnets subnet-xxx subnet-yyy

# Create target group
aws elbv2 create-target-group \
  --name anmol-backend-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id vpc-xxx
```

#### Environment Variables for Backend

```bash
# Database
DATABASE_URL=postgresql://admin:password@anmol-prod.rdsamerica.rds.amazonaws.com:5432/anmol_prod

# Server
NODE_ENV=production
PORT=3001

# JWT
JWT_SECRET=<generated-secret-key>
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://anmolvastralay.com
ADMIN_URL=https://admin.anmolvastralay.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=anmol-prod
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>

# Razorpay (Live Mode)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=<secret>

# Google OAuth
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<secret>

# Logging
LOG_LEVEL=info
```

#### Option B: Railway.app (Simpler)

```bash
# Sign up at railway.app
# Connect GitHub repository
# Set environment variables
# Deploy (auto-deploys on push to main)
```

---

### 2. Admin Panel Deployment

#### Option A: Vercel (Recommended)

**Step 1: Connect to GitHub**
```
1. Go to vercel.com/new
2. Select anmol-admin repository
3. Set root directory to "anmol-admin"
```

**Step 2: Configure Environment Variables**
```
NEXT_PUBLIC_API_URL = https://api.anmolvastralay.com/trpc
NEXT_PUBLIC_SITE_URL = https://admin.anmolvastralay.com
```

**Step 3: Deploy**
- Click Deploy
- Vercel auto-deploys on push to main

**Custom Domain:**
```
1. Add domain in Vercel dashboard
2. Update DNS records to Vercel nameservers
3. SSL auto-configures
```

#### Option B: Docker + AWS ECS

```bash
# Build image
cd anmol-admin
docker build -t anmol-admin:latest .

# Push to ECR (same process as backend)
# Create ECS service (same process as backend)
```

#### Environment Variables for Admin

```bash
NEXT_PUBLIC_API_URL=https://api.anmolvastralay.com/trpc
NEXT_PUBLIC_SITE_URL=https://admin.anmolvastralay.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=anmol-prod
NODE_ENV=production
```

See [anmol-admin/DEPLOYMENT.md](anmol-admin/DEPLOYMENT.md) for detailed instructions.

---

### 3. Frontend Deployment

#### Option A: Vercel (Recommended)

Same process as admin panel:

```
1. Connect GitHub repo (anmol-frontend)
2. Set environment variables:
   - NEXT_PUBLIC_API_URL = https://api.anmolvastralay.com/trpc
   - NEXT_PUBLIC_SITE_URL = https://anmolvastralay.com
3. Deploy
```

**Custom Domain:**
```
1. Add anmolvastralay.com in Vercel dashboard
2. Update DNS to Vercel
3. SSL auto-configures
```

#### Option B: Docker + AWS Amplify

```bash
# Build image
cd anmol-frontend
docker build -t anmol-frontend:latest .

# Push to ECR or DockerHub
# Deploy via Amplify
```

#### Environment Variables for Frontend

```bash
NEXT_PUBLIC_API_URL=https://api.anmolvastralay.com/trpc
NEXT_PUBLIC_SITE_URL=https://anmolvastralay.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=anmol-prod
NODE_ENV=production
```

---

## DNS Configuration

### Domain: anmolvastralay.com

```dns
# Nameservers (for Vercel)
ns1.vercel.com
ns2.vercel.com

# Or use CNAME records
www.anmolvastralay.com     CNAME  cname.vercel.sh
api.anmolvastralay.com     CNAME  <AWS ALB DNS>
admin.anmolvastralay.com   CNAME  cname.vercel.sh
```

### SSL/TLS Setup

```
Frontend:   Auto via Vercel
Admin:      Auto via Vercel
API:        Auto via AWS ACM + ALB
```

---

## Environment Files

### Backend (.env)
```bash
# See anmol-backend/.env.example
# Production values from AWS Secrets Manager
```

### Admin (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.anmolvastralay.com/trpc
NEXT_PUBLIC_SITE_URL=https://admin.anmolvastralay.com
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.anmolvastralay.com/trpc
NEXT_PUBLIC_SITE_URL=https://anmolvastralay.com
```

---

## Database Setup

### Initial Setup

```bash
# Run migrations
cd anmol-backend
npm run prisma:migrate -- --name init

# Seed data (optional)
npm run prisma:seed
```

### Backup Strategy

```bash
# AWS RDS automated backups
# Retention: 30 days
# Backup window: 03:00 UTC

# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier anmol-prod \
  --db-snapshot-identifier anmol-prod-$(date +%Y-%m-%d-%H%M%S)

# Export to S3
aws rds start-export-task \
  --export-task-identifier anmol-export-$(date +%s) \
  --source-arn arn:aws:rds:us-east-1:ACCOUNT:db:anmol-prod \
  --s3-bucket-name anmol-backups \
  --iam-role-arn arn:aws:iam::ACCOUNT:role/RDSExportRole
```

---

## Monitoring & Alerts

### Infrastructure Monitoring

**CloudWatch Dashboards**
- API response times
- Database CPU/Memory
- Container health
- Error rates

**Alarms**
```bash
# High error rate
aws cloudwatch put-metric-alarm \
  --alarm-name api-5xx-errors \
  --metric-name HTTPCode_Target_5XX_Count \
  --threshold 10

# High latency
aws cloudwatch put-metric-alarm \
  --alarm-name api-latency \
  --metric-name TargetResponseTime \
  --threshold 1.0
```

### Application Monitoring

**Sentry** (Error tracking)
```bash
npm install @sentry/nextjs
```

**Datadog** (Full APM)
- Infrastructure monitoring
- Application performance
- Log aggregation
- Real user monitoring

**New Relic** (Performance)
- End-to-end tracing
- Error tracking
- Alerts

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy All Services

on:
  push:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd anmol-backend && npm ci && npm run build
      - run: cd anmol-backend && npm run test

  test-admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd anmol-admin && npm ci && npm run build && npm run lint:check

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd anmol-frontend && npm ci && npm run build && npm run lint:check

  deploy:
    needs: [test-backend, test-admin, test-frontend]
    runs-on: ubuntu-latest
    if: success()
    steps:
      - uses: actions/checkout@v3
      
      # Deploy Backend
      - name: Deploy Backend
        run: |
          # AWS deployment script
          aws ecr get-login-password | docker login ...
          docker push anmol-backend:latest
          # Update ECS service
          
      # Deploy Admin (Vercel)
      - name: Deploy Admin
        run: |
          npx vercel deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          
      # Deploy Frontend (Vercel)
      - name: Deploy Frontend
        run: |
          npx vercel deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## Maintenance Tasks

### Daily
- Monitor error rates
- Check API health
- Review database performance

### Weekly
- Review CloudWatch metrics
- Check disk space on servers
- Review security logs

### Monthly
- Update dependencies: `npm audit fix`
- Test disaster recovery
- Review cost optimization
- Update security patches

### Quarterly
- Performance audit
- Security audit
- Capacity planning

---

## Troubleshooting

### API Down

```bash
# Check health
curl https://api.anmolvastralay.com/health

# Check logs
aws logs tail /ecs/anmol-backend --follow

# Check database connection
psql -h <RDS-endpoint> -U admin -d anmol_prod -c "SELECT 1;"
```

### Admin Not Responding

```bash
# Check Vercel deployment
vercel list deployments

# View logs
vercel logs

# Check CORS headers
curl -I https://admin.anmolvastralay.com
```

### Database Connection Issues

```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier anmol-prod

# Check security group
aws ec2 describe-security-groups --group-ids sg-xxx

# Test connection
nc -zv <rds-endpoint> 5432
```

---

## Rollback Procedure

### Complete Rollback

1. **Database**
   ```bash
   # Restore from snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier anmol-rollback \
     --db-snapshot-identifier anmol-prod-backup
   ```

2. **Backend**
   ```bash
   # Restart with previous ECS task definition
   aws ecs update-service \
     --cluster anmol-prod \
     --service anmol-backend \
     --task-definition anmol-backend:5  # previous version
   ```

3. **Admin & Frontend**
   ```bash
   # Vercel: Click "Promote to Production" on previous deployment
   ```

---

## Security Checklist

- [ ] Enable HTTPS on all endpoints
- [ ] Setup WAF (AWS WAF or Cloudflare)
- [ ] Enable VPC with private subnets for RDS
- [ ] Setup VPN for admin database access
- [ ] Rotate API keys monthly
- [ ] Enable CloudTrail logging
- [ ] Setup CloudWatch alarms for suspicious activity
- [ ] Use AWS Secrets Manager for sensitive values
- [ ] Enable MFA on AWS console
- [ ] Implement CORS correctly
- [ ] Setup rate limiting on API
- [ ] Regular security audits

---

## Support & Resources

### Documentation
- [Backend README](anmol-backend/README.md)
- [Backend Deployment](anmol-backend/DEPLOYMENT.md)
- [Admin README](anmol-admin/README.md)
- [Admin Deployment](anmol-admin/DEPLOYMENT.md)
- [Frontend README](anmol-frontend/README.md)

### Tools
- **Monitoring**: CloudWatch, Datadog, New Relic
- **Error Tracking**: Sentry, Rollbar
- **Analytics**: Vercel Analytics, Google Analytics
- **CDN**: Cloudflare, AWS CloudFront

### External Services
- **Database**: AWS RDS PostgreSQL
- **Storage**: AWS S3 + Cloudinary
- **Payment**: Razorpay
- **Authentication**: JWT (custom)
- **Email**: AWS SES or SendGrid
