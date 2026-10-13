-- ============================================================================
-- PostgreSQL Declarative Table Partitioning (Alternative to Sharding)
-- Purpose: Partition append-heavy, high-volume tables by time range (monthly)
-- Allows millions of analytics and history rows without degrading index performance
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Example: Partitioning "ProductInteraction" by Created Date (Range Partitioning)
-- ----------------------------------------------------------------------------

-- Step 1: Create the partitioned master table
CREATE TABLE IF NOT EXISTS "ProductInteraction_Partitioned" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "action" "InteractionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductInteraction_Partitioned_pkey" PRIMARY KEY ("id", "createdAt")
) PARTITION BY RANGE ("createdAt");

-- Step 2: Create monthly partitions for 2026
CREATE TABLE IF NOT EXISTS "ProductInteraction_2026_q1" PARTITION OF "ProductInteraction_Partitioned"
    FOR VALUES FROM ('2026-01-01 00:00:00') TO ('2026-04-01 00:00:00');

CREATE TABLE IF NOT EXISTS "ProductInteraction_2026_q2" PARTITION OF "ProductInteraction_Partitioned"
    FOR VALUES FROM ('2026-04-01 00:00:00') TO ('2026-07-01 00:00:00');

CREATE TABLE IF NOT EXISTS "ProductInteraction_2026_q3" PARTITION OF "ProductInteraction_Partitioned"
    FOR VALUES FROM ('2026-07-01 00:00:00') TO ('2026-10-01 00:00:00');

CREATE TABLE IF NOT EXISTS "ProductInteraction_2026_q4" PARTITION OF "ProductInteraction_Partitioned"
    FOR VALUES FROM ('2026-10-01 00:00:00') TO ('2027-01-01 00:00:00');

-- Default partition for dates beyond the configured ranges
CREATE TABLE IF NOT EXISTS "ProductInteraction_default" PARTITION OF "ProductInteraction_Partitioned"
    DEFAULT;

-- Step 3: Indexes are automatically propagated to all underlying child partitions
CREATE INDEX IF NOT EXISTS "idx_interaction_part_product" ON "ProductInteraction_Partitioned" ("productId", "action");
CREATE INDEX IF NOT EXISTS "idx_interaction_part_user" ON "ProductInteraction_Partitioned" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_interaction_part_session" ON "ProductInteraction_Partitioned" ("sessionId", "createdAt");


-- ----------------------------------------------------------------------------
-- 2. Cold Data Archival Routine (Detaching Old Partitions)
-- ----------------------------------------------------------------------------

-- To archive historical data older than 2 years without locking the live database:
-- 1. Detach partition concurrently:
--    ALTER TABLE "ProductInteraction_Partitioned" DETACH PARTITION "ProductInteraction_2024_q1" CONCURRENTLY;
-- 2. Dump detached partition to S3 or Parquet:
--    COPY "ProductInteraction_2024_q1" TO PROGRAM 'gzip > /backups/interaction_2024_q1.csv.gz' WITH CSV HEADER;
-- 3. Drop the detached table:
--    DROP TABLE "ProductInteraction_2024_q1";
