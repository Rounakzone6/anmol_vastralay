import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { readReplicas } from '@prisma/extension-read-replicas';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly primaryPool: Pool;
  private readonly replicaPools: Pool[] = [];
  private readonly extendedClient: any;

  // TypeScript autocompletion helpers for read replica escape hatches
  $primary!: <T extends object>(this: T) => Omit<T, '$primary' | '$replica'>;
  $replica!: <T extends object>(this: T) => Omit<T, '$primary' | '$replica'>;

  constructor() {
    const primaryUrl = process.env.DATABASE_URL;
    const useSsl = process.env.DATABASE_SSL === 'true';

    const primaryPool = new Pool({
      connectionString: primaryUrl,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    });

    const primaryAdapter = new PrismaPg(primaryPool);
    super({ adapter: primaryAdapter });
    this.primaryPool = primaryPool;

    // Discover replica connection strings from DATABASE_READ_URL or DATABASE_READ_REPLICAS
    const replicaUrls: string[] = [];
    if (process.env.DATABASE_READ_URL) {
      replicaUrls.push(process.env.DATABASE_READ_URL.trim());
    }
    if (process.env.DATABASE_READ_REPLICAS) {
      replicaUrls.push(
        ...process.env.DATABASE_READ_REPLICAS.split(',')
          .map((u) => u.trim())
          .filter(Boolean),
      );
    }

    // If no external replicas are configured, split reads and writes on the same database server
    // by creating a dedicated read connection pool. This prevents heavy write locks/transactions
    // from starving read queries (product browsing, categories, etc.)
    if (replicaUrls.length === 0 && primaryUrl) {
      replicaUrls.push(primaryUrl);
    }

    const uniqueReplicaUrls = Array.from(new Set(replicaUrls.filter(Boolean)));

    if (uniqueReplicaUrls.length > 0) {
      const replicaClients: PrismaClient[] = [];
      for (const replicaUrl of uniqueReplicaUrls) {
        const replicaPool = new Pool({
          connectionString: replicaUrl,
          ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
        });
        this.replicaPools.push(replicaPool);
        const replicaAdapter = new PrismaPg(replicaPool);
        const replicaClient = new PrismaClient({ adapter: replicaAdapter });
        replicaClients.push(replicaClient);
      }

      this.extendedClient = this.$extends(
        readReplicas({
          replicas: replicaClients,
        }),
      );
    } else {
      this.extendedClient = this;
    }

    // Proxy delegates all model operations and methods to the extended client
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop === '$primary') {
          return () => {
            if (
              target.extendedClient &&
              typeof target.extendedClient.$primary === 'function'
            ) {
              return target.extendedClient.$primary();
            }
            return target;
          };
        }
        if (prop === '$replica') {
          return () => {
            if (
              target.extendedClient &&
              typeof target.extendedClient.$replica === 'function'
            ) {
              return target.extendedClient.$replica();
            }
            return target;
          };
        }
        if (target.extendedClient && prop in target.extendedClient) {
          const value = target.extendedClient[prop];
          if (typeof value === 'function') {
            return value.bind(target.extendedClient);
          }
          return value;
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  async onModuleInit() {
    if (
      this.extendedClient &&
      typeof this.extendedClient.$connect === 'function'
    ) {
      await this.extendedClient.$connect();
    } else {
      await this.$connect();
    }

    const hasExternalReplica =
      this.replicaPools.length > 0 &&
      Boolean(
        process.env.DATABASE_READ_URL || process.env.DATABASE_READ_REPLICAS,
      );

    if (hasExternalReplica) {
      this.logger.log(
        `✅ Database Load Balancer Active: 1 Write Pool (Primary) + ${this.replicaPools.length} External Read Replica(s)`,
      );
    } else if (this.replicaPools.length > 0) {
      this.logger.log(
        '✅ Database Read/Write Split Active: 1 Dedicated Write Pool + 1 Dedicated Read Pool (Same Database Server)',
      );
    } else {
      this.logger.log('✅ Database connected via pg adapter');
    }
  }

  async onModuleDestroy() {
    if (
      this.extendedClient &&
      typeof this.extendedClient.$disconnect === 'function'
    ) {
      await this.extendedClient.$disconnect();
    } else {
      await this.$disconnect();
    }
    await this.primaryPool.end();
    await Promise.all(this.replicaPools.map((p) => p.end()));
    this.logger.log(
      '🔌 Database connections and pools gracefully disconnected',
    );
  }
}
