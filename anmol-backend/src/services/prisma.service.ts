import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const useSsl = process.env.DATABASE_SSL === 'true';

    const pool = new Pool({
      connectionString,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected via pg adapter');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
