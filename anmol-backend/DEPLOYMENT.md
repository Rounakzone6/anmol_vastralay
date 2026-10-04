# Deployment Guide - Anmol Backend

This guide covers deploying the Anmol Vastralay backend API to production environments.

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [Vercel/Netlify](#vercelnetlify)
3. [AWS Deployment](#aws-deployment)
4. [Database Migration](#database-migration)
5. [Environment Setup](#environment-setup)
6. [Monitoring & Health Checks](#monitoring--health-checks)

---

## Docker Deployment

### Build Docker Image

```bash
docker build -t anmol-backend:latest .
```

### Run Container Locally

```bash
docker run -p 3001:3001 \
  --env-file .env \
  anmol-backend:latest
```

### Docker Compose (with PostgreSQL)

```bash
docker-compose up -d
```

Services:
- API: `http://localhost:3001`
- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`

### Push to Docker Registry

```bash
# DockerHub
docker tag anmol-backend:latest yourname/anmol-backend:latest
docker push yourname/anmol-backend:latest

# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag anmol-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/anmol-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/anmol-backend:latest
```

---

## Vercel/Netlify

NestJS applications can be deployed as serverless functions, but Vercel/Netlify is better suited for frontend apps. For backend, use **Railway** or **AWS**.

### Alternative: Deploy to Railway (Recommended for NestJS)

1. Push code to GitHub
2. Connect repository on [railway.app](https://railway.app)
3. Set environment variables in Railway dashboard
4. Deploy automatically on push

---

## AWS Deployment

### Option 1: ECS + RDS (Recommended)

#### 1. Create RDS PostgreSQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier anmol-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password 'YourSecurePassword!' \
  --allocated-storage 20 \
  --publicly-accessible false
```

#### 2. Create ECR Repository

```bash
aws ecr create-repository --repository-name anmol-backend
```

#### 3. Push Docker Image to ECR

```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker build -t anmol-backend:latest .
docker tag anmol-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/anmol-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/anmol-backend:latest
```

#### 4. Create ECS Cluster & Service

```bash
# Create cluster
aws ecs create-cluster --cluster-name anmol-prod

# Create task definition (replace values)
cat > task-definition.json << 'EOF'
{
  "family": "anmol-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "anmol-backend",
      "image": "YOUR_ECR_URI:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "hostPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:anmol-db-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/anmol-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster anmol-prod \
  --service-name anmol-backend \
  --task-definition anmol-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

#### 5. Setup Load Balancer (ALB)

```bash
aws elbv2 create-load-balancer \
  --name anmol-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

aws elbv2 create-target-group \
  --name anmol-backend-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id vpc-xxx \
  --health-check-path /health

aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Option 2: EC2 + PM2

#### 1. SSH into EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### 2. Setup Node.js and Dependencies

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL client
sudo apt-get install -y postgresql-client
```

#### 3. Clone & Deploy

```bash
git clone https://github.com/your-org/anmol-backend.git
cd anmol-backend

# Copy env file
cp .env.example .env
nano .env  # Edit with production values

# Install dependencies
npm ci --only=production

# Build
npm run build

# Start with PM2
pm2 start dist/main.js --name "anmol-backend"
pm2 save
pm2 startup

# Enable log rotation
pm2 install pm2-logrotate
```

#### 4. Setup Nginx Reverse Proxy

```bash
sudo apt-get install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/anmol-backend
```

```nginx
upstream anmol_backend {
  server localhost:3001;
  keepalive 64;
}

server {
  listen 80;
  server_name api.anmolvastralay.com;

  client_max_body_size 10M;

  location / {
    proxy_pass http://anmol_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }

  # SSL configuration (add after setting up Let's Encrypt)
  # listen 443 ssl http2;
  # ssl_certificate /etc/letsencrypt/live/api.anmolvastralay.com/fullchain.pem;
  # ssl_certificate_key /etc/letsencrypt/live/api.anmolvastralay.com/privkey.pem;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/anmol-backend /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Certbot
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.anmolvastralay.com
```

#### 5. Enable Auto-Restart on Boot

```bash
pm2 startup
# Run the command output by the above

pm2 save
```

---

## Database Migration

### Production Database Setup

```bash
# 1. Create AWS Secrets Manager entries for sensitive values
aws secretsmanager create-secret \
  --name anmol-db-url \
  --secret-string "postgresql://user:pass@host:5432/anmol_db"

aws secretsmanager create-secret \
  --name jwt-secret \
  --secret-string "your-generated-secret"

# 2. Run migrations
npm run prisma:migrate

# 3. Seed initial data (optional)
npm run prisma:seed

# 4. Verify connection
psql -h your-rds-endpoint -U postgres -d anmol_db -c "SELECT version();"
```

### Backup Strategy

```bash
# Automated daily backup (AWS RDS)
# Enable automated backups in RDS console:
# - Backup retention period: 30 days
# - Backup window: 03:00 UTC

# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier anmol-db \
  --db-snapshot-identifier anmol-db-$(date +%Y-%m-%d)

# Export to S3
aws rds start-export-task \
  --export-task-identifier anmol-export-$(date +%s) \
  --source-arn arn:aws:rds:us-east-1:ACCOUNT_ID:db:anmol-db \
  --s3-bucket-name anmol-backups \
  --s3-prefix db-exports/ \
  --iam-role-arn arn:aws:iam::ACCOUNT_ID:role/service-role/RDSExportRole
```

---

## Environment Setup

### Production `.env` Template

```bash
# Server
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@anmol-prod-db.rdsamerica.rds.amazonaws.com:5432/anmol_prod

# JWT (generate with: openssl rand -hex 32)
JWT_SECRET=<generated-secret-key>
JWT_EXPIRES_IN=7d

# Frontend & Admin
FRONTEND_URL=https://anmolvastralay.com
ADMIN_URL=https://admin.anmolvastralay.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=anmol-prod
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>

# Google OAuth (Production App)
GOOGLE_CLIENT_ID=<prod-google-client-id>
GOOGLE_CLIENT_SECRET=<prod-secret>

# Razorpay (Live Mode)
RAZORPAY_KEY_ID=rzp_live_<your-key>
RAZORPAY_KEY_SECRET=<your-secret>

# Rate Limiting
THROTTLE_LIMIT=100
THROTTLE_TTL=60

# Logging
LOG_LEVEL=info
```

---

## Monitoring & Health Checks

### Application Health Endpoint

The API includes a health check endpoint:

```bash
curl http://api.anmolvastralay.com/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-06-19T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### CloudWatch Monitoring (AWS)

```bash
# Create CloudWatch alarm for CPU
aws cloudwatch put-metric-alarm \
  --alarm-name anmol-backend-cpu \
  --alarm-description "Alert if CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts

# Create alarm for high error rate
aws cloudwatch put-metric-alarm \
  --alarm-name anmol-backend-errors \
  --alarm-description "Alert if 5xx errors > 1%" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### Log Aggregation

```bash
# View CloudWatch logs
aws logs tail /ecs/anmol-backend --follow

# Filter for errors
aws logs filter-log-events \
  --log-group-name /ecs/anmol-backend \
  --filter-pattern "ERROR"
```

### Uptime Monitoring

Use services like:
- **UptimeRobot**: Monitor `/health` endpoint every 5 minutes
- **DataDog**: Full APM and infrastructure monitoring
- **New Relic**: Error tracking and performance insights
- **Sentry**: Application error tracking

---

## Troubleshooting

### Application won't start

```bash
# Check logs
docker logs <container-id>

# Or with PM2
pm2 logs anmol-backend

# Verify environment variables
docker exec <container-id> env | grep DATABASE_URL
```

### Database connection errors

```bash
# Test connection
psql -h <host> -U postgres -d anmol_db -c "SELECT 1;"

# Check security groups (AWS)
aws ec2 describe-security-groups --filters "Name=group-id,Values=sg-xxx"

# Verify DNS resolution
nslookup anmol-prod-db.rds.amazonaws.com
```

### High memory usage

```bash
# Check heap size
node --max-old-space-size=512 dist/main.js

# Monitor with PM2
pm2 monit

# Check for memory leaks in application logs
```

---

## Rollback & Zero-Downtime Deployment

### ECS Rolling Update

```bash
# Update task definition
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json

# Update service (auto-rolls out new tasks)
aws ecs update-service \
  --cluster anmol-prod \
  --service anmol-backend \
  --task-definition anmol-backend:2 \
  --force-new-deployment
```

### Database Migration Rollback

```bash
# List migrations
prisma migrate resolve --rolled-back <migration-name>

# Or revert manually
psql -h <host> -U postgres -d anmol_db < backup.sql
```

---

## Support & Maintenance

- Monitor API response times and error rates
- Set up automated backups (daily, 30-day retention)
- Plan scaling: Add more ECS tasks/containers if load increases
- Update dependencies monthly: `npm audit` and `npm update`
- Review CloudWatch logs weekly for errors or anomalies
