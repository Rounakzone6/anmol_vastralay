# Horizontal vs. Vertical Scaling Guide - Anmol Vastralay

This guide documents the architecture, configuration, and operational runbooks for scaling the Anmol Vastralay platform.

---

## 1. Executive Overview: Horizontal vs. Vertical Scaling

| Dimension | Vertical Scaling ("Scale Up") | Horizontal Scaling ("Scale Out") |
| :--- | :--- | :--- |
| **Concept** | Adding more CPU, RAM, or Disk I/O to a single server/container. | Running multiple stateless server instances behind a Load Balancer. |
| **Database Application** | **Primary Database (Writes & Transactions)**. Master databases require vertical resources for locks, WAL logs, and ACID transactions. | **Database Read Replicas (Reads)**. Scaling read queries (findMany, findUnique, count) across N replica instances. |
| **Node.js Application** | **Cluster Mode (`src/cluster.ts` / PM2)**. Utilizing all CPU cores on a multi-core machine (Node event loops are single-threaded). | **Multiple Backend Containers (`--scale backend=3`)**. Routing requests through Nginx / AWS ALB with zero-downtime rolling updates. |
| **Fault Tolerance** | Low. If the single machine fails or undergoes maintenance, the system is offline. | High. If 1 container fails, remaining instances handle traffic seamlessly. |
| **Ceiling** | Hard hardware and cost limit. | Virtually unlimited elastic scaling. |

---

## 2. Hybrid Scaling Architecture in Anmol Vastralay

```
                                [ Incoming Client Traffic ]
                                             │
                                             ▼
                             [ Nginx Reverse Proxy / Load Balancer ]
                             (least_conn, keepalive, rate-limiting)
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    ▼                        ▼                        ▼
           [ Backend Node 1 ]       [ Backend Node 2 ]       [ Backend Node 3 ]
           (Cluster Workers)        (Cluster Workers)        (Cluster Workers)
                    │                        │                        │
         ┌──────────┴────────────────────────┼────────────────────────┴──────────┐
         │                                   │                                   │
         ▼ (Writes & Txns)                   ▼ (Read Queries)                    ▼ (Read Queries)
[ PostgreSQL Primary (5432) ]     [ Read Replica 1 (5433) ]           [ Read Replica 2 (5434) ]
   (Vertical Scaled)                 (Horizontal Scaled)                 (Horizontal Scaled)
```

---

## 3. Operational Runbooks

### Runbook A: Scaling Horizontally with Docker Compose

Scale the backend API to 3 (or N) instances behind the Nginx load balancer:

```bash
# 1. Start full stack with 3 backend instances
docker compose up -d --scale backend=3

# 2. View load-balancer distributing traffic
docker compose logs -f load-balancer

# 3. View healthy workers
docker compose ps
```

All traffic hitting `http://localhost:80` or `http://localhost:8080` is load-balanced across the 3 backend instances via Nginx `least_conn`.

---

### Runbook B: Scaling Vertically with Node.js Multi-Core Cluster

If you run on a multi-core VPS, dedicated server, or large container:

```bash
# Start cluster mode (automatically forks workers matching available CPU cores)
npm run start:cluster

# Or specify a custom worker count:
WORKERS=4 npm run start:cluster
```

**Features of Cluster Mode:**
- Automatically detects CPU cores (`os.availableParallelism()`).
- Primary manager forks worker processes on the same port.
- **Self-Healing:** If any worker crashes, the primary automatically spawns a replacement worker immediately.

---

### Runbook C: Production Scaling with PM2 Cluster

On production Linux servers:

```bash
# Start backend in cluster mode across all CPU cores
pm2 start ecosystem.config.js

# Monitor live cluster CPU and memory usage
pm2 monit

# Scale workers dynamically on the fly
pm2 scale anmol-backend 4

# Zero-downtime rolling reload
pm2 reload anmol-backend
```

---

### Runbook D: Database Read/Write Scaling

Configure in `anmol-backend/.env`:

```env
# Primary (Vertical Scaling - Master writes & transactions)
DATABASE_URL=postgresql://user:password@primary-host:5432/anmol_db

# Read Replica (Horizontal Scaling - Load-balanced reads)
DATABASE_READ_URL=postgresql://user:password@replica-host:5433/anmol_db

# Optional: Multiple replicas (comma-separated)
DATABASE_READ_REPLICAS=postgresql://user:pwd@replica1:5432/db,postgresql://user:pwd@replica2:5432/db
```
