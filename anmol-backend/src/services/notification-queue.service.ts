import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationQueueService {
  constructor(
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async enqueueOrderEmail(data: { orderId: string }) {
    await this.notificationQueue.add('order-email', data, {
      priority: 1,
    });
  }

  async enqueueOrderWhatsApp(data: {
    orderId: string;
    userId: string;
    amount: number;
    phone?: string | null;
  }) {
    await this.notificationQueue.add('order-whatsapp', data, {
      priority: 2,
    });
  }

  // Future queues like bulk-emails can go here
  async enqueueMarketingMessage(data: { phone: string; message: string; delayMs?: number }) {
    await this.notificationQueue.add('marketing-message', data, {
      priority: 3, // Low priority
      delay: data.delayMs || 0, // Delay message to avoid spam bans
    });
  }

  async enqueueAbandonedCartWhatsApp(data: { userId: string; phone: string }) {
    await this.notificationQueue.add('abandoned-cart-whatsapp', data, {
      priority: 2, 
    });
  }
}
