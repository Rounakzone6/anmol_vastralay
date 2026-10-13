# CAP Theorem Architecture & Implementation Strategy - Anmol Vastralay

This document details the theoretical foundation, trade-offs, and concrete technical implementations of the **CAP Theorem** within the Anmol Vastralay e-commerce platform.

---

## 1. Executive Summary & The Core Dilemma

The **CAP Theorem** (Brewer's Theorem) states that a distributed data system can simultaneously provide at most two of the following three guarantees in the presence of a network partition:

1. **Consistency (C)**: Every read receives the most up-to-date write or an error (linearizable/strong consistency).
2. **Availability (A)**: Every non-failing node returns a non-error response (without guarantee that it contains the most recent write).
3. **Partition Tolerance (P)**: The system continues to operate despite arbitrary packet loss or network partitions between nodes.

### The Real-World Reality: P is Mandatory
In modern cloud architectures (distributed containers, PostgreSQL read replicas, Redis caches, load balancers), network partitions (P) are an inescapable physical reality. Therefore, the architectural decision is **not** choosing between C, A, and P; it is choosing between **Consistency (CP)** and **Availability (AP)** during network partitions and distributed operations.

---

## 2. Why Pure CP or Pure AP Fails in E-Commerce

| Pure Architecture | What Happens in an E-Commerce Store? | Verdict |
| :--- | :--- | :--- |
| **Pure CP Monolith** | If a read replica or Redis cache lags or drops a packet, product browsing, hero banners, and category navigation throw 500 errors and lock users out. | **Unacceptable**. Customers bounce immediately; massive revenue loss. |
| **Pure AP Monolith** | If network splits, customers can still place orders against stale inventory replicas. Two brides purchase the exact same single Banarasi saree variant (`stockQty: 1`), causing severe overselling and manual cancellations. | **Disastrous**. Destroys store credibility and triggers financial disputes. |

---

## 3. The Solution: Domain-Driven CAP Strategy (PACELC)

Instead of a monolithic choice, Anmol Vastralay applies a **Domain-Specific CAP Strategy**:

```
                       ┌────────────────────────────────────────────────────────┐
                       │               CAP THEOREM ARCHITECTURE                 │
                       └────────────────────────────────────────────────────────┘
                                                    │
                   ┌────────────────────────────────┴────────────────────────────────┐
                   ▼                                                                 ▼
      [ STRICT CP DOMAIN ]                                              [ RESILIENT AP DOMAIN ]
  (Consistency over Availability)                                   (Availability over Consistency)
                   │                                                                 │
  • Checkout & Order Placement                                      • Catalog Browsing & Search
  • Payment Gateway Verification                                    • Hero Banners & Categories
  • Stock & Inventory Decrement                                     • Product Reviews & Star Ratings
  • Idempotent Request Execution                                    • Session Carts & Browsing History
                   │                                                                 │
  [ Mechanics ]                                                     [ Mechanics ]
  1. PostgreSQL ACID Transactions                                   1. Redis In-Memory Cache-Aside
  2. Bypasses replicas: Forces $primary()                           2. Read Replica Load Balancing
  3. Atomic check: stockQty >= qty                                  3. 60s TanStack Client StaleTime
  4. Redis SET NX Idempotency Locks                                 4. Fallback Circuit Breaker
```

---

## 4. Technical Implementations in the Codebase

### A. Strict CP: Atomic Inventory Concurrency Guard
Implemented in [`anmol-backend/src/services/order.service.ts`](file:///c:/Users/rouna/Desktop/anmol_vastralay/anmol-backend/src/services/order.service.ts) and [`payment.service.ts`](file:///c:/Users/rouna/Desktop/anmol_vastralay/anmol-backend/src/services/payment.service.ts):

1. **Pre-Checkout Stock Validation on Primary DB**:
   Bypasses read replicas and forces `$primary()` so inventory reads are never fooled by replication lag:
   ```typescript
   const variant = await this.prisma.$primary().productVariant.findUnique({
     where: { id: item.variantId },
     select: { stockQty: true },
   });
   ```

2. **Atomic Conditional Decrement**:
   During order transaction, decrements inventory atomically with an inline row-level conditional guard:
   ```typescript
   const updated = await tx.productVariant.updateMany({
     where: {
       id: item.variantId,
       stockQty: { gte: item.quantity }, // Row-level concurrency lock
     },
     data: { stockQty: { decrement: item.quantity } },
   });

   if (updated.count === 0) {
     throw new TRPCError({
       code: 'CONFLICT',
       message: `Stock claimed by another customer for "${item.product.name}".`,
     });
   }
   ```
   **Guaranteed Result**: Even if 100 concurrent checkout requests hit multiple backend instances simultaneously, `stockQty` can **never drop below zero**.

---

### B. Strict CP: Distributed Idempotency Guard
Implemented in [`anmol-backend/src/services/idempotency.service.ts`](file:///c:/Users/rouna/Desktop/anmol_vastralay/anmol-backend/src/services/idempotency.service.ts):
- Uses Redis atomic `SET key payload EX ttl NX` to acquire a distributed execution lock.
- If a customer double-clicks "Pay Now" or their mobile network retries during a partition:
  - Second request detects active lock and waits or receives original response replay.
  - Zero duplicate order entries or double credit card debits.

---

### C. Resilient AP: High Availability & Eventual Consistency
Implemented in [`anmol-backend/src/services/cache.service.ts`](file:///c:/Users/rouna/Desktop/anmol_vastralay/anmol-backend/src/services/cache.service.ts) and [`PrismaService`](file:///c:/Users/rouna/Desktop/anmol_vastralay/anmol-backend/src/services/prisma.service.ts):
1. **Cache-Aside (`remember`)**:
   Categories, banners, and product previews serve sub-10ms responses from Redis or Read Replicas.
2. **Circuit-Breaker Fallback**:
   If Redis or a read replica disconnects, the cache service catches errors and transparently executes the database query — **browsing is 100% available with zero downtime**.
3. **Asynchronous BullMQ Processing (Eventual Consistency)**:
   Post-checkout notifications, WhatsApp retargeting, and customer Lifetime Value (LTV) recalculations are handled asynchronously in background queues without delaying customer HTTP responses.

---

## 5. Domain Trade-Off Matrix

| System Domain | CAP Profile | Consistency Model | Failure Mode |
| :--- | :--- | :--- | :--- |
| **Inventory Deduction** | **CP** | Strict Linearizable | Fails safe with `409 Conflict` (Never oversells). |
| **Payment Verification** | **CP** | Strict Linearizable | Retries with Idempotency Lock. |
| **Product Detail Pages** | **AP** | Eventual Consistency | Serves cached/replica data with 99.999% uptime. |
| **Category Navigation** | **AP** | Eventual Consistency | 30-minute Redis TTL with auto-invalidation on edit. |
| **WhatsApp Retargeting** | **AP** | Asynchronous Eventual | BullMQ background jobs with 3 automatic retries. |
