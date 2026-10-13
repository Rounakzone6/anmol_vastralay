import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { redis } from '@backend/config/redis.config';
import type { Redis } from 'ioredis';
import { MetricsService } from '@backend/services/metrics.service';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private isConnected = false;
  private readonly client: Redis = redis;

  constructor(@Optional() private readonly metrics?: MetricsService) {}

  onModuleInit() {
    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log('✅ Redis Cache connected and active');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.logger.warn(
        `⚠️ Redis cache unavailable (operating in fallback mode): ${err.message}`,
      );
    });

    if (this.client.status === 'ready' || this.client.status === 'connect') {
      this.isConnected = true;
    }
  }

  onModuleDestroy() {
    // Redis client lifecycle managed globally
  }

  /**
   * Check if cache is active
   */
  get active(): boolean {
    return this.isConnected || this.client.status === 'ready';
  }

  /**
   * Retrieve cached item with typed JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    const namespace = key.split(':')[0] || 'default';
    try {
      if (!this.active) {
        this.metrics?.cacheMissesTotal.inc({ namespace });
        return null;
      }
      const data = await this.client.get(key);
      if (!data) {
        this.metrics?.cacheMissesTotal.inc({ namespace });
        return null;
      }
      this.metrics?.cacheHitsTotal.inc({ namespace });
      return JSON.parse(data) as T;
    } catch (err: any) {
      this.metrics?.cacheMissesTotal.inc({ namespace });
      this.logger.debug(`Cache get failed for key "${key}": ${err?.message}`);
      return null;
    }
  }

  /**
   * Set cached item with TTL in seconds
   */
  async set(key: string, value: any, ttlSeconds = 600): Promise<void> {
    try {
      if (!this.active) return;
      const payload = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await this.client.set(key, payload, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, payload);
      }
    } catch (err: any) {
      this.logger.debug(`Cache set failed for key "${key}": ${err?.message}`);
    }
  }

  /**
   * Delete specific cache key
   */
  async del(key: string): Promise<void> {
    try {
      if (!this.active) return;
      await this.client.del(key);
    } catch (err: any) {
      this.logger.debug(`Cache del failed for key "${key}": ${err?.message}`);
    }
  }

  /**
   * Delete all keys matching a glob pattern using non-blocking SCAN
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      if (!this.active) return;
      const stream = this.client.scanStream({
        match: pattern,
        count: 100,
      });

      stream.on('data', async (keys: string[]) => {
        if (keys.length > 0) {
          const pipeline = this.client.pipeline();
          keys.forEach((k) => pipeline.del(k));
          await pipeline.exec();
        }
      });
    } catch (err: any) {
      this.logger.debug(
        `Cache delPattern failed for "${pattern}": ${err?.message}`,
      );
    }
  }

  /**
   * Cache-Aside: Returns cached result if present, otherwise computes fetcher(), caches, and returns.
   */
  async remember<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await fetcher();
    if (fresh !== null && fresh !== undefined) {
      await this.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }
}
