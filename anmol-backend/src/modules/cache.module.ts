import { Module, Global } from '@nestjs/common';
import { CacheService } from '@backend/services/cache.service';

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
