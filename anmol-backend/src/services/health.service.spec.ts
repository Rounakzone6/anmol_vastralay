import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '@backend/services/health.service';
import { MetricsService } from '@backend/services/metrics.service';
import { PrismaService } from '@backend/services/prisma.service';
import { redis } from '@backend/config/redis.config';

describe('Observability Services', () => {
  let healthService: HealthService;
  let metricsService: MetricsService;
  let mockPrisma: any;

  afterAll(async () => {
    try {
      await redis.quit();
    } catch {}
  });

  beforeEach(async () => {
    mockPrisma = {
      $primary: jest.fn().mockReturnValue({
        $queryRawUnsafe: jest.fn().mockResolvedValue([{ 1: 1 }]),
      }),
      $replica: jest.fn().mockReturnValue({
        $queryRawUnsafe: jest.fn().mockResolvedValue([{ 1: 1 }]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        MetricsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    healthService = module.get<HealthService>(HealthService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  describe('MetricsService', () => {
    it('should be defined and initialize prometheus metrics', async () => {
      expect(metricsService).toBeDefined();
      expect(metricsService.registry).toBeDefined();

      metricsService.httpRequestsTotal.inc({
        method: 'GET',
        route: '/trpc',
        status_code: '200',
      });
      metricsService.cacheHitsTotal.inc({ namespace: 'categories' });
      metricsService.cacheMissesTotal.inc({ namespace: 'products' });

      const metricsOutput = await metricsService.getMetrics();
      expect(metricsOutput).toContain('anmol_http_requests_total');
      expect(metricsOutput).toContain('anmol_cache_hits_total');
      expect(metricsOutput).toContain('anmol_cache_misses_total');
      expect(metricsService.getContentType()).toBeDefined();
    });
  });

  describe('HealthService', () => {
    it('should return liveness status', () => {
      const liveness = healthService.getLiveness();
      expect(liveness.status).toBe('up');
      expect(typeof liveness.uptime).toBe('number');
      expect(liveness.timestamp).toBeDefined();
    });

    it('should return deep health with healthy components', async () => {
      const report = await healthService.getDeepHealth();
      expect(report).toBeDefined();
      expect(report.status).toMatch(/healthy|degraded/);
      expect(report.components.primaryDatabase.status).toBe('up');
      expect(report.system).toBeDefined();
      expect(typeof report.system.heapUsedMB).toBe('number');
    });
  });
});
