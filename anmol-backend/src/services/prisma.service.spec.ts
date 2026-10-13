import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@backend/services/prisma.service';

describe('PrismaService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined in single primary mode', async () => {
    delete process.env.DATABASE_READ_URL;
    delete process.env.DATABASE_READ_REPLICAS;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    const service = module.get<PrismaService>(PrismaService);
    expect(service).toBeDefined();
    await service.onModuleDestroy();
  });

  it('should configure read replica when DATABASE_READ_URL is provided', async () => {
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/anmol_db';
    process.env.DATABASE_READ_URL =
      'postgresql://postgres:postgres@localhost:5433/anmol_db';

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    const service = module.get<PrismaService>(PrismaService);
    expect(service).toBeDefined();
    expect(typeof service.$primary).toBe('function');
    expect(typeof service.$replica).toBe('function');
    await service.onModuleDestroy();
  });

  it('should support multiple replicas via DATABASE_READ_REPLICAS', async () => {
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/anmol_db';
    process.env.DATABASE_READ_REPLICAS =
      'postgresql://postgres:postgres@localhost:5433/anmol_db,postgresql://postgres:postgres@localhost:5434/anmol_db';

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    const service = module.get<PrismaService>(PrismaService);
    expect(service).toBeDefined();
    expect(typeof service.$primary).toBe('function');
    expect(typeof service.$replica).toBe('function');
    await service.onModuleDestroy();
  });
});
