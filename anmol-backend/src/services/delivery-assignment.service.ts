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
    this.logger.log('DeliveryAssignmentService initialized with atomic driver/order claims & BullMQ retry');
  }

  @OnEvent('order.processing', { async: true })
  async handleOrderProcessingEvent(payload: { orderId: string }) {
    this.logger.log(`Received order.processing event for order ${payload.orderId}`);
    await this.assignDriverToOrder(payload.orderId, false);
  }

  /**
   * Atomically claims an AVAILABLE driver and assigns the order inside a single database transaction.
   * Uses double-guarded updates on both driver and order sides to prevent two drivers from being
   * assigned to the same order, and two orders from claiming the same driver.
   */
  async assignDriverToOrder(orderId: string, isFromQueue: boolean = false): Promise<boolean> {
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

      // 2. Fetch candidates marked AVAILABLE
      const availableCandidates = await this.prisma.deliveryPerson.findMany({
        where: { status: 'AVAILABLE' },
        select: { id: true, name: true, phone: true },
        take: 5,
      });

      if (availableCandidates.length === 0) {
        this.logger.warn(`No delivery personnel currently available for order ${orderId}.`);
        if (!isFromQueue) {
          // Initial trigger: enqueue once into BullMQ with stable jobId: assign-<orderId>
          await this.notificationQueue.enqueueDeliveryAssignment({ orderId });
        }
        return false;
      }

      // 3. Atomically attempt to claim the driver AND assign order inside a single transaction
      let claimedPerson: { id: string; name: string; phone: string } | null = null;
      let updatedOrder: any = null;

      for (const candidate of availableCandidates) {
        try {
          const result = await this.prisma.$transaction(async (tx) => {
            // Guard 1: Atomic conditional update to claim driver
            const claim = await tx.deliveryPerson.updateMany({
              where: {
                id: candidate.id,
                status: 'AVAILABLE',
              },
              data: { status: 'BUSY' },
            });

            if (claim.count === 0) {
              return null; // Another concurrent order claimed this driver
            }

            // Guard 2: Atomic conditional update on order side to ensure order still has no driver
            const orderClaim = await tx.order.updateMany({
              where: {
                id: orderId,
                deliveryPersonId: null,
              },
              data: { deliveryPersonId: candidate.id },
            });

            if (orderClaim.count === 0) {
              // Order was already assigned or cancelled concurrently; roll back driver claim
              throw new Error('ORDER_ALREADY_ASSIGNED_OR_CANCELLED');
            }

            return tx.order.findUnique({
              where: { id: orderId },
              include: { user: true, payments: true },
            });
          });

          if (result) {
            claimedPerson = candidate;
            updatedOrder = result;
            break;
          }
        } catch (txError: any) {
          if (txError.message === 'ORDER_ALREADY_ASSIGNED_OR_CANCELLED') {
            this.logger.log(`Order ${orderId} was already assigned by concurrent worker`);
            return true;
          }
          this.logger.warn(`Transaction retry on candidate ${candidate.id}: ${txError.message}`);
        }
      }

      if (!claimedPerson || !updatedOrder) {
        this.logger.warn(`All candidate drivers claimed concurrently for order ${orderId}.`);
        if (!isFromQueue) {
          await this.notificationQueue.enqueueDeliveryAssignment({ orderId });
        }
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
      if (!isFromQueue) {
        await this.notificationQueue.enqueueDeliveryAssignment({ orderId });
      }
      return false;
    }
  }

  /**
   * Called when BullMQ retries are fully exhausted (after 5 attempts).
   * Marks the order as requiring manual dispatcher intervention and logs an urgent alert.
   */
  async handleExhaustedRetries(orderId: string): Promise<void> {
    try {
      this.logger.error(`🚨 ALERT: All 5 delivery dispatch attempts failed for Order ${orderId}. Marking for manual dispatcher assignment.`);
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: 'PROCESSING',
          note: 'ACTION REQUIRED: All automated driver dispatch retries exhausted (5/5). Order flagged for manual assignment.',
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to record exhausted retry status for order ${orderId}: ${err.message}`);
    }
  }

  /**
   * Free driver on order completion, cancellation, or return.
   */
  @OnEvent('order.completed', { async: true })
  @OnEvent('order.cancelled', { async: true })
  @OnEvent('order.returned', { async: true })
  async handleOrderLifecycleEvent(payload: { orderId: string }) {
    this.logger.log(`Received lifecycle event for order ${payload.orderId}. Releasing driver if assigned.`);
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
        this.logger.log(`✅ Released delivery person ${order.deliveryPersonId} back to AVAILABLE`);
      }
    } catch (error) {
      this.logger.error(`Error freeing delivery person for order ${payload.orderId}:`, error);
    }
  }
}
