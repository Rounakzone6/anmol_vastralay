import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { redis } from '@backend/config/redis.config';

export interface ComponentHealth {
  status: 'up' | 'down' | 'unconfigured';
  latencyMs?: number;
  error?: string;
}

export interface SystemHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  version: string;
  components: {
    primaryDatabase: ComponentHealth;
    readReplicaDatabase: ComponentHealth;
    redisCache: ComponentHealth;
  };
  system: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    cpuCores: number;
    nodeVersion: string;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fast liveness probe - verifies event loop is healthy
   */
  getLiveness() {
    return {
      status: 'up',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Deep readiness and system diagnostic probe
   */
  async getDeepHealth(): Promise<SystemHealthReport> {
    const memory = process.memoryUsage();
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // 1. Check Primary Database
    let primaryDbHealth: ComponentHealth = { status: 'down' };
    try {
      const start = Date.now();
      const primaryClient =
        typeof (this.prisma as any).$primary === 'function'
          ? (this.prisma as any).$primary()
          : this.prisma;
      await primaryClient.$queryRaw`SELECT 1`;
      primaryDbHealth = {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      this.logger.error(`Primary database healthcheck failed: ${err?.message}`);
      primaryDbHealth = {
        status: 'down',
        error: err?.message,
      };
      overallStatus = 'unhealthy';
    }

    // 2. Check Read Pool / Read Replica Database
    let replicaDbHealth: ComponentHealth = { status: 'down' };
    try {
      const start = Date.now();
      const replicaClient =
        typeof (this.prisma as any).$replica === 'function'
          ? (this.prisma as any).$replica()
          : this.prisma;
      await replicaClient.$queryRaw`SELECT 1`;
      replicaDbHealth = {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      this.logger.warn(`Read pool healthcheck failed: ${err?.message}`);
      replicaDbHealth = {
        status: 'down',
        error: err?.message,
      };
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    }

    // 3. Check Redis Cache & Queue
    let redisHealth: ComponentHealth = { status: 'down' };
    try {
      const start = Date.now();
      const pingRes = await redis.ping();
      if (pingRes === 'PONG') {
        redisHealth = {
          status: 'up',
          latencyMs: Date.now() - start,
        };
      } else {
        redisHealth = {
          status: 'down',
          error: `Unexpected ping response: ${pingRes}`,
        };
        if (overallStatus === 'healthy') overallStatus = 'degraded';
      }
    } catch (err: any) {
      this.logger.warn(`Redis healthcheck failed: ${err?.message}`);
      redisHealth = {
        status: 'down',
        error: err?.message,
      };
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.0.1',
      components: {
        primaryDatabase: primaryDbHealth,
        readReplicaDatabase: replicaDbHealth,
        redisCache: redisHealth,
      },
      system: {
        heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
        rssMB: Math.round(memory.rss / 1024 / 1024),
        cpuCores: require('node:os').cpus().length,
        nodeVersion: process.version,
      },
    };
  }
}
