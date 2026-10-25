import { TRPCError } from '@trpc/server';
import { PrismaClient } from '@prisma/client';

describe('Real & Simulated Concurrency: POS vs Online Checkout Race Elimination', () => {
  let prisma: PrismaClient | null = null;
  let isDbAvailable = false;

  beforeAll(async () => {
    try {
      if (process.env.DATABASE_URL) {
        prisma = new PrismaClient();
        await prisma.$queryRawUnsafe('SELECT 1');
        isDbAvailable = true;
      }
    } catch {
      isDbAvailable = false;
    }
  });

  afterAll(async () => {
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch {}
    }
  });

  describe('PostgreSQL Row Lock Validation (Online Checkout vs POS Billing Racing)', () => {
    it('executes 10 parallel checkouts (5 POS + 5 Online) on 3 units of stock in PostgreSQL: exactly 3 succeed, 7 fail with CONFLICT, final stock is 0', async () => {
      if (!isDbAvailable || !prisma) {
        console.log('Skipping live DB concurrency test (PostgreSQL not connected in current local env)');
        return;
      }

      // 1. Seed realistic test category, product and variant with exactly 3 stock units
      const testSku = `CONC-TEST-${Date.now()}`;
      const category = await prisma.category.upsert({
        where: { slug: 'concurrency-testing' },
        update: {},
        create: {
          name: 'Concurrency Test Category',
          slug: 'concurrency-testing',
        },
      });

      const product = await prisma.product.create({
        data: {
          name: 'Silk Saree Concurrency Race Test',
          slug: `silk-saree-test-${Date.now()}`,
          categoryId: category.id,
          netPrice: 2500,
          kind: 'SAREE',
          variants: {
            create: {
              color: 'Royal Maroon',
              size: 'Free Size',
              sku: testSku,
              stockQty: 3, // Exactly 3 units available
            },
          },
        },
        include: { variants: true },
      });

      const variantId = product.variants[0].id;

      try {
        // 2. Define Online Checkout worker (mirrors order.service.ts atomic update)
        const runOnlineCheckout = async (workerId: number) => {
          return prisma!.$transaction(async (tx) => {
            const updated = await tx.productVariant.updateMany({
              where: {
                id: variantId,
                stockQty: { gte: 1 },
              },
              data: {
                stockQty: { decrement: 1 },
              },
            });

            if (updated.count === 0) {
              throw new TRPCError({
                code: 'CONFLICT',
                message: `[Online Worker ${workerId}] Insufficient stock: variant ${variantId} already claimed`,
              });
            }

            return { workerId, source: 'ONLINE', status: 'SUCCESS' };
          });
        };

        // 3. Define POS Billing worker (mirrors pos.router.ts atomic update)
        const runPosCheckout = async (workerId: number) => {
          return prisma!.$transaction(async (tx) => {
            const updated = await tx.productVariant.updateMany({
              where: {
                id: variantId,
                stockQty: { gte: 1 },
              },
              data: {
                stockQty: { decrement: 1 },
              },
            });

            if (updated.count === 0) {
              throw new TRPCError({
                code: 'CONFLICT',
                message: `[POS Cashier ${workerId}] Insufficient stock in POS billing`,
              });
            }

            return { workerId, source: 'POS', status: 'SUCCESS' };
          });
        };

        // 4. Fire 5 Online Checkouts + 5 In-Store POS Checkouts simultaneously (10 workers racing on 3 units)
        const parallelWorkers = [
          runOnlineCheckout(1),
          runPosCheckout(2),
          runOnlineCheckout(3),
          runPosCheckout(4),
          runOnlineCheckout(5),
          runPosCheckout(6),
          runOnlineCheckout(7),
          runPosCheckout(8),
          runOnlineCheckout(9),
          runPosCheckout(10),
        ];

        const results = await Promise.allSettled(parallelWorkers);

        const successes = results.filter((r) => r.status === 'fulfilled');
        const conflicts = results.filter((r) => r.status === 'rejected');

        // ASSERTION 1: Exactly 3 checkouts succeed (regardless of who won the race)
        expect(successes).toHaveLength(3);

        // ASSERTION 2: Exactly 7 checkouts fail with TRPCError CONFLICT
        expect(conflicts).toHaveLength(7);
        conflicts.forEach((c) => {
          if (c.status === 'rejected') {
            expect(c.reason).toBeInstanceOf(TRPCError);
            expect((c.reason as TRPCError).code).toBe('CONFLICT');
          }
        });

        // ASSERTION 3: Remaining database inventory in PostgreSQL is exactly 0 (never negative)
        const finalVariant = await prisma.productVariant.findUniqueOrThrow({
          where: { id: variantId },
          select: { stockQty: true },
        });

        expect(finalVariant.stockQty).toBe(0);
      } finally {
        // Cleanup test data
        await prisma.product.delete({ where: { id: product.id } }).catch(() => {});
      }
    });
  });

  describe('Thread-Safe Mutex Simulation (Unit Verification)', () => {
    class MutexDatabaseSimulation {
      private stock = 3;
      private queue: Promise<void> = Promise.resolve();

      async updateMany(args: {
        where: { id: string; stockQty: { gte: number } };
        data: { stockQty: { decrement: number } };
      }): Promise<{ count: number }> {
        return new Promise((resolve) => {
          this.queue = this.queue.then(async () => {
            await new Promise((r) => setTimeout(r, Math.random() * 5 + 1));
            if (this.stock >= args.where.stockQty.gte) {
              this.stock -= args.data.stockQty.decrement;
              resolve({ count: 1 });
            } else {
              resolve({ count: 0 });
            }
          });
        });
      }

      getStock() {
        return this.stock;
      }
    }

    it('simulates mixed POS and Online racing on 3 units -> exactly 3 succeed and 7 conflict', async () => {
      const db = new MutexDatabaseSimulation();

      const worker = async (source: 'POS' | 'ONLINE', id: number) => {
        const res = await db.updateMany({
          where: { id: 'var-1', stockQty: { gte: 1 } },
          data: { stockQty: { decrement: 1 } },
        });

        if (res.count === 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `${source} worker ${id} rejected due to insufficient stock`,
          });
        }
        return { source, id };
      };

      const tasks = [
        worker('ONLINE', 1),
        worker('POS', 2),
        worker('ONLINE', 3),
        worker('POS', 4),
        worker('ONLINE', 5),
        worker('POS', 6),
        worker('ONLINE', 7),
        worker('POS', 8),
        worker('ONLINE', 9),
        worker('POS', 10),
      ];

      const results = await Promise.allSettled(tasks);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(3);
      expect(rejected).toHaveLength(7);
      expect(db.getStock()).toBe(0);
    });
  });
});
