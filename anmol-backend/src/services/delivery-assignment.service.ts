import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { WhatsappWebService } from './whatsapp-web.service';
import { NotificationQueueService } from './notification-queue.service';

@Injectable()
export class DeliveryAssignmentService implements OnModuleInit {
  private readonly logger = new Logger(DeliveryAssignmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappWeb: WhatsappWebService,
    private readonly notificationQueue: NotificationQueueService,
  ) {}

  async onModuleInit() {
    this.logger.log('DeliveryAssignmentService initialized with atomic driver claims & BullMQ retry');
  }

  @OnEvent('order.processing', { async: true })
  async handleOrderProcessingEvent(payload: { orderId: string }) {
    this.logger.log(`Received order.processing event for order ${payload.orderId}`);
    await this.assignDriverToOrder(payload.orderId);
  }

  /**
   * Atomically claims an AVAILABLE driver using conditional updateMany inside a transaction.
   * If no driver is currently free, queues a delayed retry via BullMQ.
   */
  async assignDriverToOrder(orderId: string): Promise<boolean> {
    try {
      // 1. Check if order is already assigned
      const existingOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { deliveryPersonId: true, status: true },
      });

      if (!existingOrder) {
        this.logger.warn(`Order ${orderId} not found for delivery assignment`);
        return true; // Don't retry non-existent order
      }

      if (existingOrder.deliveryPersonId) {
        this.logger.log(`Order ${orderId} is already assigned to driver ${existingOrder.deliveryPersonId}`);
        return true;
      }

      // 2. Fetch all candidates marked AVAILABLE
      const availableCandidates = await this.prisma.deliveryPerson.findMany({
        where: { status: 'AVAILABLE' },
        select: { id: true, name: true, phone: true },
        take: 5,
      });

      if (availableCandidates.length === 0) {
        this.logger.warn(`No delivery personnel currently available for order ${orderId}. Enqueueing BullMQ retry...`);
        await this.notificationQueue.enqueueDeliveryAssignment({ orderId });
        return false;
      }

      // 3. Atomically attempt to claim the driver inside transaction
      let claimedPerson: { id: string; name: string; phone: string } | null = null;
      let updatedOrder: any = null;

      for (const candidate of availableCandidates) {
        const result = await this.prisma.$transaction(async (tx) => {
          // Atomic conditional update to claim driver
          const claim = await tx.deliveryPerson.updateMany({
            where: {
              id: candidate.id,
              status: 'AVAILABLE',
            },
            data: { status: 'BUSY' },
          });

          // If count === 0, another concurrent order claimed this driver in the exact same millisecond
          if (claim.count === 0) {
            return null;
          }

          // Successfully claimed! Assign to order
          const ord = await tx.order.update({
            where: { id: orderId },
            data: { deliveryPersonId: candidate.id },
            include: {
              user: true,
              payments: true,
            },
          });

          return ord;
        });

        if (result) {
          claimedPerson = candidate;
          updatedOrder = result;
          break; // Driver successfully locked and assigned!
        }
      }

      if (!claimedPerson || !updatedOrder) {
        this.logger.warn(`Driver race occurred on all candidates for order ${orderId}. Re-queueing via BullMQ.`);
        await this.notificationQueue.enqueueDeliveryAssignment({ orderId });
        return false;
      }

      this.logger.log(`✅ Atomically assigned delivery person ${claimedPerson.name} (${claimedPerson.id}) to order ${orderId}`);

      // 4. Send WhatsApp Notification to assigned driver
      const paymentMethod = updatedOrder.payments?.[0]?.paymentMethod || 'Online/Prepaid';
      const isCOD = paymentMethod === 'COD' ? 'COD (Cash on Delivery)' : paymentMethod;

      let fallbackPhone: string | null | undefined = null;
      if (!updatedOrder.user?.phone) {
        const address = await this.prisma.address.findFirst({
          where: { userId: updatedOrder.userId },
          orderBy: { isDefault: 'desc' },
        });
        fallbackPhone = address?.phone;
      }

      const customerPhone = updatedOrder.user?.phone || fallbackPhone || 'Not Provided';
      const customerName = updatedOrder.user?.name || 'Customer';

      const message = `🚨 *NEW DELIVERY ASSIGNED* 🚨\n\n*Order ID:* #${updatedOrder.id.slice(-6).toUpperCase()}\n*Payment:* ${isCOD} - ₹${updatedOrder.totalAmount.toString()}\n*Customer:* ${customerName}\n*Contact:* ${customerPhone}\n\n*Delivery Address:*\n${updatedOrder.shippingAddress}\n\nPlease ensure timely delivery! 📦`;

      this.whatsappWeb.sendMessage(claimedPerson.phone, message).catch((err) => {
        this.logger.warn(`Could not dispatch WhatsApp to driver ${claimedPerson?.phone}: ${err.message}`);
      });

      return true;
    } catch (error: any) {
      this.logger.error(`Error in atomic driver assignment for order ${orderId}:`, error);
      await this.notificationQueue.enqueueDeliveryAssignment({ orderId });
      return false;
    }
  }

  @OnEvent('order.completed', { async: true })
  async handleOrderCompletedEvent(payload: { orderId: string }) {
    this.logger.log(`Received order.completed event for order ${payload.orderId}`);
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: payload.orderId },
        select: { deliveryPersonId: true },
      });

      if (order && order.deliveryPersonId) {
        await this.prisma.deliveryPerson.update({
          where: { id: order.deliveryPersonId },
          data: { status: 'AVAILABLE' },
        });
        this.logger.log(`Freed delivery person ${order.deliveryPersonId}`);
      }
    } catch (error) {
      this.logger.error(`Error freeing delivery person for order ${payload.orderId}:`, error);
    }
  }
}
