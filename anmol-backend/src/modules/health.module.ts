import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '@backend/modules/prisma.module';
import { HealthService } from '@backend/services/health.service';
import { MetricsService } from '@backend/services/metrics.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [HealthService, MetricsService],
  exports: [HealthService, MetricsService],
})
export class HealthModule {}
