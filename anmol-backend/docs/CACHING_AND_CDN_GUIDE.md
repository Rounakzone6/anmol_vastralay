# Caching & CDN Architecture Guide - Anmol Vastralay

This document details the multi-tier caching and CDN topology implemented for the Anmol Vastralay e-commerce platform.

---

## 1. Multi-Tier Caching & CDN Topology

```
[ User Browser ]
       │
       ▼  (Tier 1: Client Query Cache - 60s staleTime, 10m gcTime)
[ Next.js Storefront / Admin ]
       │
       ▼  (Tier 2: Edge CDN & Reverse Proxy - Cloudinary & Nginx)
[ Cloudinary Image CDN ] ── (AVIF/WebP, 30d immutable cache for media)
[ Nginx Reverse Proxy  ] ── (Gzip, Brotli, HTTP/1.1 keepalive, static asset caching)
       │
       ▼  (Tier 3: In-Memory Application Cache - Redis CacheService)
[ NestJS Backend API   ]
       ├── Cache Hit (0.5ms) ──► Return JSON immediately
       └── Cache Miss ─────────► Query Database & store in Redis (Cache-Aside)
       │
       ▼  (Tier 4: Distributed Database Layer)
[ PostgreSQL Read Replicas ] ── (Load-balanced reads)
[ PostgreSQL Primary       ] ── (Writes & Transactions)
```

---

## 2. Tier Details & Implementation

### Tier 1: Client-Side React Query Caching
Configured in `anmol-frontend/app/providers.tsx` and `anmol-admin/components/providers.tsx`:
- **`staleTime: 60 * 1000` (60s)**: Queries remain fresh for 1 minute. Prevents redundant API requests when users click around the same screen.
- **`gcTime: 10 * 60 * 1000` (10m)**: Previously visited pages and collections remain cached in client memory for instant back/forward navigation.
- **`refetchOnWindowFocus: false`**: Eliminates sudden background refetches and UI flicker when switching browser tabs.
- **`retry: 1`**: Fast single retry on transient network drops.

### Tier 2: Edge CDN & Reverse Proxy
- **Cloudinary / ImageKit Media CDN**:
  - All banner and product images are served with automatic format negotiation (`image/avif`, `image/webp`) via Next.js `remotePatterns` in `next.config.js`.
  - Image URLs have long-term immutable caching.
- **Nginx Edge Caching & Headers (`anmol-backend/nginx/nginx.conf`)**:
  - Static files, fonts, and assets served with `Cache-Control: public, max-age=2592000, immutable` (30 days).
  - Gzip compression enabled for all text, json, and svg payloads.
  - Rate limiting zone (`50r/s` with burst 100) at proxy boundary protects application servers.

### Tier 3: In-Memory Application Cache (`CacheService`)
Implemented in `anmol-backend/src/services/cache.service.ts`:
- **Circuit Breaker / Resilient Fallback**: If Redis experiences an outage, `CacheService` catches the error, logs a warning, and executes the database query directly. The storefront never crashes if Redis goes down.
- **Non-Blocking SCAN Pattern Invalidation**: Uses Redis `scanStream` and pipeline batch deletes instead of dangerous blocking `KEYS *` commands.
- **Cache-Aside Helper (`remember`)**:
  ```typescript
  return this.cache.remember(cacheKey, ttlSeconds, async () => {
    return this.prisma.category.findMany(...);
  });
  ```

| Entity / Key Pattern | TTL Duration | Invalidation Triggers |
| :--- | :--- | :--- |
| `category:list:*` | 30 minutes | Category creation, update, deletion, reordering |
| `category:id:*` & `category:slug:*` | 30 minutes | Category update, deletion |
| `banner:list:*` | 30 minutes | Banner creation, update, deletion, seeding |
| `product:list:*` | 10 minutes | Product creation, update, stock change, deletion |
| `product:id:*` & `product:slug:*` | 10 minutes | Product/variant update, price change, deletion |
| `dashboard:demand_forecast:*` | 24 hours | Daily scheduled refresh |

---

## 3. Docker Compose Cache Setup

Both `docker-compose.yml` and `anmol-backend/docker-compose.yml` include Redis:
```yaml
  redis:
    image: redis:7-alpine
    container_name: anmol-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
```

To run the full stack with caching and load balancing:
```bash
docker compose up -d
```
