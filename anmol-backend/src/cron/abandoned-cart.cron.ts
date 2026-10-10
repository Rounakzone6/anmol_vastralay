import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { redis } from '@backend/config/redis.config';
import { NotificationQueueService } from '@backend/services/notification-queue.service';
import { PrismaService } from '@backend/services/prisma.service';

@Injectable()
export class AbandonedCartCron {
  private readonly logger = new Logger(AbandonedCartCron.name);

  constructor(
    private readonly notificationQueue: NotificationQueueService,
    private readonly prisma: PrismaService,
  ) {}

  // Runs every hour at minute 0
  @Cron(CronExpression.EVERY_HOUR)
  async handleAbandonedCarts() {
    this.logger.log('Scanning for abandoned carts...');
    
    // We want carts that haven't been updated in the last 2 hours
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const maxTimestamp = Date.now() - TWO_HOURS_MS;

    try {
      // Get all userIds whose cart was last updated before maxTimestamp
      const userIds = await redis.zrangebyscore('carts:updated_at', 0, maxTimestamp);
      
      if (userIds.length === 0) {
        this.logger.log('No abandoned carts found.');
        return;
      }

      // Filter out userIds that we already reminded
      // SISMEMBER in a loop can be slow, but it's fine for small batches. 
      // For large scale, we can fetch all members of `carts:reminded` and do set difference locally, or use a pipeline.
      const pipeline = redis.pipeline();
      userIds.forEach(userId => pipeline.sismember('carts:reminded', userId));
      const results = await pipeline.exec();
      
      const toRemind: string[] = [];
      
      if (results) {
        userIds.forEach((userId, index) => {
          const isReminded = results[index][1]; // result[1] is the actual return value of sismember (1 or 0)
          if (!isReminded) {
            toRemind.push(userId);
          }
        });
      }

      if (toRemind.length === 0) {
        this.logger.log('All abandoned carts have already been reminded.');
        return;
      }

      this.logger.log(`Found ${toRemind.length} carts to remind. Enqueueing jobs...`);

      // Enqueue jobs
      for (const userId of toRemind) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        
        let phone = user?.phone;
        if (!phone) {
          const address = await this.prisma.address.findFirst({
            where: { userId },
            orderBy: { isDefault: 'desc' },
          });
          phone = address?.phone;
        }

        if (phone) {
          await this.notificationQueue.enqueueAbandonedCartWhatsApp({
            userId,
            phone,
          });
          // Mark as reminded so we don't spam them again for this specific abandonment
          await redis.sadd('carts:reminded', userId);
        }
      }
      
      this.logger.log('Finished enqueueing abandoned cart reminders.');
    } catch (error) {
      this.logger.error('Error processing abandoned carts', error);
    }
  }
}
