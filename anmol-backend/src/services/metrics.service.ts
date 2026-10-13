import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  public readonly registry: Registry;

  // HTTP Metrics
  public readonly httpRequestsTotal: Counter<string>;
  public readonly httpRequestDurationSeconds: Histogram<string>;
  public readonly httpActiveRequests: Gauge<string>;

  // Database Metrics
  public readonly dbQueryDurationSeconds: Histogram<string>;

  // Redis Cache Metrics
  public readonly cacheHitsTotal: Counter<string>;
  public readonly cacheMissesTotal: Counter<string>;

  constructor() {
    this.registry = new Registry();

    // Default system metrics (CPU, Memory, Event Loop, GC)
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'anmol_',
    });

    // 1. Total HTTP Requests Counter
    this.httpRequestsTotal = new Counter({
      name: 'anmol_http_requests_total',
      help: 'Total number of HTTP requests received',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    // 2. HTTP Request Duration Histogram
    this.httpRequestDurationSeconds = new Histogram({
      name: 'anmol_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    // 3. Active Requests In-Flight Gauge
    this.httpActiveRequests = new Gauge({
      name: 'anmol_http_active_requests',
      help: 'Current number of active in-flight HTTP requests',
      registers: [this.registry],
    });

    // 4. Database Query Duration Histogram
    this.dbQueryDurationSeconds = new Histogram({
      name: 'anmol_db_query_duration_seconds',
      help: 'Database query execution time in seconds',
      labelNames: ['operation', 'model'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
      registers: [this.registry],
    });

    // 5. Cache Hits and Misses Counters
    this.cacheHitsTotal = new Counter({
      name: 'anmol_cache_hits_total',
      help: 'Total number of Redis cache hits',
      labelNames: ['namespace'],
      registers: [this.registry],
    });

    this.cacheMissesTotal = new Counter({
      name: 'anmol_cache_misses_total',
      help: 'Total number of Redis cache misses',
      labelNames: ['namespace'],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    // Registry initialized with default and custom metrics
  }

  /**
   * Returns Prometheus scraping text format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Returns content type for Prometheus
   */
  getContentType(): string {
    return this.registry.contentType;
  }
}
