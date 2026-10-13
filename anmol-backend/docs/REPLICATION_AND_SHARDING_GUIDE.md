# Replication & Sharding Architectural Guide - Anmol Vastralay

This document provides a technical evaluation and architectural runbook for **Database Replication** and **Database Sharding** in the Anmol Vastralay platform.

---

## 1. Executive Summary & Verdict

| Architecture Technique | Recommendation for Anmol Vastralay | Implementation Status |
| :--- | :--- | :--- |
| **Database Read Replication** | **YES (Essential & Recommended)** | **IMPLEMENTED** (Configured via `@prisma/extension-read-replicas`, `PrismaService`, and Docker Compose multi-node topology). |
| **Database Sharding** | **NO (Not Needed / Anti-Pattern at this stage)** | **REJECTED** (Replaced with Table Partitioning & Redis Caching). |

---

## 2. In-Depth Technical Evaluation: Why Replication YES, but Sharding NO

### A. Why Read Replication is Essential
E-commerce data traffic is fundamentally asymmetrical:
- **90% to 95% of traffic is READ-heavy**: Customers browsing categories, viewing product detail pages, searching festive sarees, loading reviews, checking delivery statuses, and browsing banners.
- **5% to 10% of traffic is WRITE-heavy**: Adding to cart, placing an order, updating inventory, processing payment status, and updating user profiles.

**Benefit of Replication:**
By offloading all read queries to one or more **PostgreSQL Read Replicas**, the **Primary Master Database** is completely freed from search and catalog browsing spikes, reserving its compute exclusively for ACID-critical checkout and inventory transactions.

---

### B. Why Database Sharding is NOT Recommended
Database sharding involves horizontally splitting tables across multiple separate physical databases based on a shard key (e.g. `user_id % 4`).

While necessary for hyperscale platforms like Meta or Uber (petabytes of data, 100,000+ writes/second), implementing sharding for Anmol Vastralay is a severe anti-pattern for four reasons:

1. **Loss of Relational Foreign Keys & ACID Joins**:
   - Anmol Vastralay is highly relational: an `Order` joins with `User`, `OrderItem`, `Product`, `ProductVariant`, and `Payment`.
   - In a sharded database, cross-shard joins are impossible in standard SQL. You cannot join an order on Shard A with a product on Shard B without distributed 2-Phase Commit (2PC), which adds massive latency and fragility.

2. **Prisma ORM Incompatibility**:
   - Prisma ORM is designed for single-schema relational integrity. It does not natively support distributed cross-shard routing across relational queries (`include`, `select`).

3. **Single PostgreSQL Instance Headroom**:
   - Modern PostgreSQL on standard cloud instances (e.g., AWS RDS `db.r6g.xlarge` or Neon) easily handles **terabytes of data and 10,000+ queries per second** with NVMe storage.
   - Hardware saturation is years away for this platform.

4. **The Shard Key Dilemma**:
   - If you shard by `userId`: Anonymous guest storefront users browsing products have no `userId`, making product queries impossible without querying every shard (scatter-gather penalty).
   - If you shard by `productId`: Placing an order containing products from 3 different shards requires a distributed multi-database transaction.

---

## 3. What to Use Instead of Sharding: Modern Scaling Alternatives

Instead of premature sharding, high-scale e-commerce platforms use this modern 3-step hierarchy:

```
Step 1: In-Memory Caching (Redis)
        └── Absorbs 80%+ of repetitive read traffic before reaching the DB.

Step 2: Read Replication (PostgreSQL Read Replicas)
        └── Distributes remaining database reads across replica instances.

Step 3: Declarative Table Partitioning (PostgreSQL)
        └── Divides append-heavy tables (ProductInteraction, OrderStatusHistory) by time range.
```

### PostgreSQL Declarative Partitioning
For high-volume tables that accumulate millions of rows over time (such as `ProductInteraction` and `OrderStatusHistory`), PostgreSQL natively supports **Range Partitioning by Date**:
- Queries remain standard SQL (`SELECT * FROM "ProductInteraction" WHERE ...`).
- PostgreSQL's query optimizer automatically performs **Partition Pruning** (only scanning the partition for the requested month/quarter).
- A sample partitioning migration script is provided in [`prisma/partitioning.sql`](file:///c:/Users/rouna/Desktop/anmol_vastralay/anmol-backend/prisma/partitioning.sql).

---

## 4. PostgreSQL Streaming Replication Architecture

```
[ Primary Database ] (Port 5432)
   ├── Handles: All writes (INSERT, UPDATE, DELETE), transactions, schema migrations
   ├── Generates: Write-Ahead Log (WAL) records
   │
   └──► [ WAL Streaming via physical replication slot ]
              │
              ▼
[ Standby Read Replica ] (Port 5433)
   ├── Receives: WAL stream from Primary
   ├── Mode: Hot Standby (Read-Only)
   └── Handles: findMany, findUnique, count, aggregate queries
```

### Primary Database Configuration (`postgresql.conf`)
```ini
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
wal_keep_size = 128MB
hot_standby = on
```

### Managed Cloud Replication (Neon / AWS RDS / Supabase)
In production cloud environments (Neon, AWS RDS, GCP Cloud SQL):
1. Create a Read Replica in the provider console with one click.
2. Copy the replica's read-only connection URI.
3. Paste it into `DATABASE_READ_URL` in `anmol-backend/.env`:
   ```env
   DATABASE_URL=postgresql://user:pwd@primary-host:5432/anmol_db
   DATABASE_READ_URL=postgresql://user:pwd@replica-host:5432/anmol_db
   ```
4. `PrismaService` automatically routes write operations to `DATABASE_URL` and read operations to `DATABASE_READ_URL`.

---

## 5. Failover & Promotion Runbook

If the primary database node experiences a hardware failure:

1. **Promote Standby Replica to Master**:
   ```bash
   # On the standby database server
   pg_ctl promote -D /var/lib/postgresql/data
   ```
2. **Update Environment Configuration**:
   Update `DATABASE_URL` in the backend environment to point to the promoted node.
3. **Restart Backend Workers**:
   ```bash
   pm2 reload anmol-backend
   ```
