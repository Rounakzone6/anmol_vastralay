# Observability & Monitoring Architecture Guide

## 1. Executive Summary & Why It Is Needed

For a production e-commerce platform like **Anmol Vastralay**, observability goes far beyond simple server uptime. During festive sales, seasonal campaigns, and flash traffic surges, systems fail in complex and subtle ways:
- **Silent Database Bottlenecks**: Connection pool exhaustion or slow queries stalling checkout queues.
- **Cache Eviction Storms**: Degraded Redis hit rates causing read traffic to cascade directly onto the primary PostgreSQL database.
- **Cascading Micro-hangs**: Event loop starvation in Node.js leading to elevated HTTP latency while CPU metrics look deceptively normal.
- **Untraceable Customer Complaints**: Inability to connect an order failure reported by a shopper to the exact backend error log.

To address these challenges, we have engineered an enterprise-grade **Three Pillars Observability Stack** (Metrics, Health Probes, and Distributed Tracing) directly into `anmol-backend` without adding heavy external dependencies or introducing performance overhead.

---

## 2. High-Level Architecture

```mermaid
flowchart TD
    Client["Client / Mobile Browser"] -->|HTTP Request + x-correlation-id| Nginx["Nginx Reverse Proxy / Ingress"]
    Nginx -->|X-Request-ID / X-Correlation-ID| NodeCluster["Node.js Cluster Workers"]

    subgraph "anmol-backend Observability Subsystem"
        NodeCluster --> TraceMW["Correlation ID Middleware"]
        NodeCluster --> MetricsMW["Prometheus Metrics Middleware (RED)"]
        MetricsMW --> AppRouter["tRPC Procedures & REST Endpoints"]

        AppRouter --> CacheService["CacheService (Hit/Miss Counter)"]
        AppRouter --> PrismaService["Prisma ORM (Primary + Replicas)"]

        HealthService["HealthService"] -->|SELECT 1| PostgresPrim["PostgreSQL Primary"]
        HealthService -->|SELECT 1| PostgresRepl["PostgreSQL Read Replica"]
        HealthService -->|PING| RedisCache["Redis Instance"]
    end

    Prometheus["Prometheus Scraper"] -->|Scrapes /metrics (every 15s)| NodeCluster
    Prometheus --> Grafana["Grafana Dashboards"]
    Prometheus --> Alertmanager["Alertmanager (Slack / PagerDuty)"]
    K8sOrALB["Kubernetes / AWS ALB"] -->|Polls /health/live & /health/ready| HealthService
```

---

## 3. Implemented Components

### A. Real-Time Prometheus Metrics (`GET /metrics`)
Implemented in `MetricsService` (`src/services/metrics.service.ts`) using `prom-client`:

| Metric Name | Type | Labels | Description |
| :--- | :--- | :--- | :--- |
| `anmol_http_requests_total` | Counter | `method`, `route`, `status_code` | Total HTTP requests processed (Request Rate & Errors). |
| `anmol_http_request_duration_seconds` | Histogram | `method`, `route`, `status_code` | Latency distribution buckets (5ms to 10s) for p50, p90, p99. |
| `anmol_http_active_requests` | Gauge | — | Real-time gauge of in-flight requests currently executing. |
| `anmol_cache_hits_total` | Counter | `namespace` | Redis cache hits (e.g. `categories`, `banners`, `products`). |
| `anmol_cache_misses_total` | Counter | `namespace` | Redis cache misses triggering database reads. |
| `anmol_db_query_duration_seconds` | Histogram | `operation`, `model` | Prisma/PostgreSQL query latency breakdown. |
| `anmol_process_cpu_user_seconds_total` | Counter | — | Default Node.js system CPU consumption. |
| `anmol_nodejs_eventloop_lag_seconds` | Gauge | — | Event loop lag measurement to detect thread-blocking code. |
| `anmol_nodejs_heap_size_used_bytes` | Gauge | — | Node V8 memory consumption and garbage collection trends. |

### B. Multi-Tier Health Probes (`/health`, `/health/live`, `/health/ready`)
Implemented in `HealthService` (`src/services/health.service.ts`):

1. **Fast Liveness Probe (`GET /health/live`)**:
   - Used by Docker/Kubernetes container orchestrators.
   - Non-blocking: returns instantly (`200 OK`) verifying the Node.js event loop is alive.
2. **Readiness Probe (`GET /health/ready`)**:
   - Used by Nginx / AWS ALB upstream routing.
   - Verifies Primary Database connectivity. If Primary DB is down, returns `503 Service Unavailable`, preventing the load balancer from sending user traffic to an instance that cannot fulfill transactions.
3. **Deep Diagnostic Probe (`GET /health`)**:
   - Returns a structured diagnostic report with component latencies:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-10-12T17:05:00.000Z",
     "uptimeSeconds": 1420,
     "environment": "production",
     "version": "0.0.1",
     "components": {
       "primaryDatabase": { "status": "up", "latencyMs": 2 },
       "readReplicaDatabase": { "status": "up", "latencyMs": 3 },
       "redisCache": { "status": "up", "latencyMs": 1 }
     },
     "system": {
       "heapUsedMB": 48,
       "heapTotalMB": 72,
       "rssMB": 110,
       "cpuCores": 8,
       "nodeVersion": "v22.14.0"
     }
   }
   ```

### C. Distributed Tracing & Correlation IDs
- **Ingress Generation**: Nginx assigns a unique `$request_id` to `X-Request-ID` and `X-Correlation-ID`.
- **Backend Propagation**: Express middleware ensures every request has a correlation ID (generating a fallback UUID with `node:crypto` if absent) and attaches it to response headers.
- **Log Correlation**: Application request logs output `[<correlation-id>]` prefix:
  ```text
  ✓ [e72b4c19-612a-4f51-b8ea-8b43821034f2] GET /trpc/category.getAll → 200 (12ms)
  ❌ [92a348dc-51a8-4c12-9c09-ef33917b2b01] POST /trpc/order.create → 500 (145ms)
  ```
  When a user contacts support with an error, engineers search for the correlation ID in log aggregators (Datadog, Grafana Loki, or CloudWatch) to inspect the exact transaction lifecycle.

---

## 4. Production Prometheus Configuration

Add this job snippet to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'anmol_backend'
    scrape_interval: 15s
    scrape_timeout: 10s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['backend:3001']
        labels:
          app: 'anmol-vastralay'
          tier: 'api'
```

---

## 5. Grafana Golden Signals Dashboard Setup

Create dashboard panels mapped to the **4 Golden Signals** (Google SRE):

1. **Traffic (Throughput)**:
   ```promql
   sum(rate(anmol_http_requests_total[1m])) by (route)
   ```
2. **Errors (Error Rate)**:
   ```promql
   sum(rate(anmol_http_requests_total{status_code=~"5.."}[1m])) 
   / 
   sum(rate(anmol_http_requests_total[1m])) * 100
   ```
3. **Latency (99th Percentile Response Time)**:
   ```promql
   histogram_quantile(0.99, sum(rate(anmol_http_request_duration_seconds_bucket[5m])) by (le))
   ```
4. **Saturation (Cache Hit Ratio & Event Loop Lag)**:
   ```promql
   sum(rate(anmol_cache_hits_total[5m])) 
   / 
   (sum(rate(anmol_cache_hits_total[5m])) + sum(rate(anmol_cache_misses_total[5m]))) * 100
   ```

---

## 6. Recommended Alerting Rules (Alertmanager)

```yaml
groups:
  - name: anmol_alerts
    rules:
      - alert: HighHttpErrorRate
        expr: (sum(rate(anmol_http_requests_total{status_code=~"5.."}[5m])) / sum(rate(anmol_http_requests_total[5m]))) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Anmol Backend HTTP 5xx error rate exceeds 5%"

      - alert: HighCheckoutLatency
        expr: histogram_quantile(0.95, sum(rate(anmol_http_request_duration_seconds_bucket{route="/trpc"}[5m])) by (le)) > 1.5
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "p95 API response time is above 1.5 seconds"

      - alert: PrimaryDatabaseDown
        expr: anmol_http_requests_total{route="/health/ready", status_code="503"} > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Anmol Primary Database is unreachable"
```
