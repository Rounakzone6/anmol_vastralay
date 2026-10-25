import { Injectable, Logger } from '@nestjs/common';
import { redis } from '@backend/config/redis.config';
import { TRPCError } from '@trpc/server';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  /**
   * Executes an action with strict CP idempotency guarantees.
   * Prevents duplicate execution during network partitions, client retries, or double submissions.
   *
   * @param key Unique idempotency key (e.g., "idemp:order:usr123:req456")
   * @param ttlSeconds Lock / result retention duration in seconds
   * @param action The transactional logic to execute
   */
  async execute<T>(
    key: string,
    ttlSeconds = 300,
    action: () => Promise<T>,
  ): Promise<T> {
    const fullKey = `idemp:${key}`;

    try {
      // 1. Acquire atomic distributed lock using SET NX
      const lockAcquired = await redis.set(
        fullKey,
        JSON.stringify({ status: 'PENDING', createdAt: Date.now() }),
        'EX',
        ttlSeconds,
        'NX',
      );

      if (!lockAcquired) {
        // Lock already exists; inspect existing payload
        const existingData = await redis.get(fullKey);
        if (existingData) {
          const parsed = JSON.parse(existingData);
          if (parsed.status === 'COMPLETED') {
            this.logger.log(
              `Idempotency replay: Returning cached result for "${key}"`,
            );
            return parsed.result as T;
          }
        }

        throw new TRPCError({
          code: 'CONFLICT',
          message:
            'A concurrent request with the same idempotency key is already processing. Please wait.',
        });
      }

      // 2. Execute the critical operation
      const result = await action();

      // 3. Store completed result for replay
      await redis.set(
        fullKey,
        JSON.stringify({ status: 'COMPLETED', result }),
        'EX',
        ttlSeconds,
      );

      return result;
    } catch (err: any) {
      if (err instanceof TRPCError && err.code === 'CONFLICT') {
        throw err;
      }

      // If action failed with an unexpected error, release lock so customer can retry
      try {
        await redis.del(fullKey);
      } catch (cleanupErr: any) {
        this.logger.debug(
          `Failed to clean idempotency key "${fullKey}": ${cleanupErr?.message}`,
        );
      }

      throw err;
    }
  }
}
