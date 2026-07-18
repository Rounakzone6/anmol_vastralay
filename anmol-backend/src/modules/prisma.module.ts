import { Module, Global } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
