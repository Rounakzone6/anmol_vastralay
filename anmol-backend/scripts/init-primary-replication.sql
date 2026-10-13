-- ============================================================================
-- PostgreSQL Streaming Replication Initialization Script
-- Executed on the Primary database to configure replication user & permissions
-- ============================================================================

-- 1. Create a dedicated replication user with REPLICATION privileges
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'replicator') THEN
        CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'replicator_password';
        RAISE NOTICE 'Role "replicator" created successfully.';
    ELSE
        RAISE NOTICE 'Role "replicator" already exists.';
    END IF;
END
$$;

-- 2. Grant connection rights to the replication role
GRANT CONNECT ON DATABASE anmol_db TO replicator;

-- 3. Create a physical replication slot for the standby replica
SELECT pg_create_physical_replication_slot('replica_slot_1')
WHERE NOT EXISTS (
    SELECT 1 FROM pg_replication_slots WHERE slot_name = 'replica_slot_1'
);

-- Output status
SELECT slot_name, plugin, slot_type, active, wal_status 
FROM pg_replication_slots;
