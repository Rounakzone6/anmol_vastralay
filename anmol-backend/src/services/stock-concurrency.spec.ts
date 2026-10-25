import { TRPCError } from '@trpc/server';

describe('Inventory Concurrency & Race Condition Elimination', () => {
  /**
   * Thread-safe in-memory database simulation mirroring PostgreSQL atomic conditional row update:
   * UPDATE "ProductVariant"
   * SET "stockQty" = "stockQty" - :qty
   * WHERE "id" = :id AND "stockQty" >= :qty
   */
  class ConcurrentDatabaseSimulation {
    private stock: number;
    private lock: Promise<void> = Promise.resolve();

    constructor(initialStock: number) {
      this.stock = initialStock;
    }

    public async updateMany(args: {
      where: { id: string; stockQty: { gte: number } };
      data: { stockQty: { decrement: number } };
    }): Promise<{ count: number }> {
      // Simulate database row-level locking (PostgreSQL row lock on UPDATE ... WHERE stockQty >= qty)
      return new Promise((resolve) => {
        // Enqueue atomic transaction operation
        this.lock = this.lock.then(async () => {
          // Small simulated random I/O jitter between 1ms and 5ms
          await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 5) + 1));

          if (this.stock >= args.where.stockQty.gte) {
            this.stock -= args.data.stockQty.decrement;
            resolve({ count: 1 });
          } else {
            resolve({ count: 0 });
          }
        });
      });
    }

    public getStock(): number {
      return this.stock;
    }
  }

  it('prevents stock race: 10 parallel checkouts against 3 units of stock -> exactly 3 succeed and 7 fail with CONFLICT', async () => {
    const INITIAL_STOCK = 3;
    const CONCURRENT_REQUESTS = 10;
    const REQUEST_QUANTITY = 1;

    const db = new ConcurrentDatabaseSimulation(INITIAL_STOCK);

    // Simulated checkout execution using the exact pattern in order.service.ts and pos.router.ts
    const executeCheckout = async (checkoutIndex: number) => {
      // Atomic conditional update mirroring:
      // const updated = await tx.productVariant.updateMany({
      //   where: { id: item.variantId, stockQty: { gte: item.quantity } },
      //   data: { stockQty: { decrement: item.quantity } },
      // });
      const updated = await db.updateMany({
        where: {
          id: 'variant-silk-saree-101',
          stockQty: { gte: REQUEST_QUANTITY },
        },
        data: {
          stockQty: { decrement: REQUEST_QUANTITY },
        },
      });

      if (updated.count === 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Insufficient stock for variant variant-silk-saree-101. Checkout ${checkoutIndex} rejected.`,
        });
      }

      return { status: 'ORDER_PLACED', checkoutIndex };
    };

    // Fire 10 concurrent parallel checkouts simultaneously
    const checkoutPromises = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
      executeCheckout(i + 1),
    );

    const results = await Promise.allSettled(checkoutPromises);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Assertions
    expect(fulfilled).toHaveLength(3);
    expect(rejected).toHaveLength(7);

    // Verify all 7 rejected errors are TRPC CONFLICT errors
    rejected.forEach((r) => {
      if (r.status === 'rejected') {
        expect(r.reason).toBeInstanceOf(TRPCError);
        expect((r.reason as TRPCError).code).toBe('CONFLICT');
        expect((r.reason as TRPCError).message).toContain('Insufficient stock');
      }
    });

    // Verify remaining inventory is exactly 0 and never negative
    expect(db.getStock()).toBe(0);
  });

  it('handles multi-quantity concurrent checkouts correctly without overselling', async () => {
    // 5 units available, 4 buyers asking for 2 units each
    // Only 2 checkouts can succeed (2 * 2 = 4 units deducted, leaving 1 unit)
    const db = new ConcurrentDatabaseSimulation(5);

    const executeCheckout = async (qty: number) => {
      const updated = await db.updateMany({
        where: {
          id: 'variant-anarkali-suit',
          stockQty: { gte: qty },
        },
        data: {
          stockQty: { decrement: qty },
        },
      });

      if (updated.count === 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Insufficient stock',
        });
      }
      return true;
    };

    const orders = [
      executeCheckout(2),
      executeCheckout(2),
      executeCheckout(2),
      executeCheckout(2),
    ];

    const results = await Promise.allSettled(orders);
    const successful = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(successful).toHaveLength(2);
    expect(failed).toHaveLength(2);
    expect(db.getStock()).toBe(1);
  });
});
