import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { WhatsappWebService } from './whatsapp-web.service';

@Injectable()
export class DeliveryAssignmentService implements OnModuleInit {
  private readonly logger = new Logger(DeliveryAssignmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappWeb: WhatsappWebService,
  ) {}

  async onModuleInit() {
    this.logger.log('DeliveryAssignmentService initialized');
  }

  @OnEvent('order.processing', { async: true })
  async handleOrderProcessingEvent(payload: { orderId: string }) {
    this.logger.log(`Received order.processing event for order ${payload.orderId}`);
    try {
      // Find an available delivery person
      const availablePerson = await this.prisma.deliveryPerson.findFirst({
        where: { status: 'AVAILABLE' },
      });

      if (!availablePerson) {
        this.logger.warn(`No available delivery person for order ${payload.orderId}. Queueing not fully implemented (requires retry mechanism).`);
        return;
      }

      // Assign the person and update status to BUSY in a transaction
      const order = await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: payload.orderId },
          include: {
            user: true,
            payments: true,
          }
        });
        
        // If already assigned, ignore
        if (order?.deliveryPersonId) {
          return null;
        }

        const updatedOrder = await tx.order.update({
          where: { id: payload.orderId },
          data: { deliveryPersonId: availablePerson.id },
          include: {
            user: true,
            payments: true,
          }
        });

        await tx.deliveryPerson.update({
          where: { id: availablePerson.id },
          data: { status: 'BUSY' },
        });

        return updatedOrder;
      });

      if (order) {
        this.logger.log(`Assigned delivery person ${availablePerson.name} to order ${payload.orderId}`);

        // Format and send WhatsApp message
        const paymentMethod = order.payments?.[0]?.paymentMethod || 'Online/Prepaid';
        const isCOD = paymentMethod === 'COD' ? 'COD (Cash on Delivery)' : paymentMethod;
        // Try to find phone from user's addresses if user.phone is null
        let fallbackPhone: string | null | undefined = null;
        if (!order.user?.phone) {
          const address = await this.prisma.address.findFirst({
            where: { userId: order.userId },
            orderBy: { isDefault: 'desc' },
          });
          fallbackPhone = address?.phone;
        }

        const customerPhone = order.user?.phone || fallbackPhone || 'Not Provided';
        const customerName = order.user?.name || 'Customer';

        const message = `🚨 *NEW DELIVERY ASSIGNED* 🚨

*Order ID:* #${order.id.slice(-6).toUpperCase()}
*Payment:* ${isCOD} - ₹${order.totalAmount.toString()}
*Customer:* ${customerName}
*Contact:* ${customerPhone}

*Delivery Address:*
${order.shippingAddress}

Please ensure timely delivery! 📦`;

        await this.whatsappWeb.sendMessage(availablePerson.phone, message);
      }
    } catch (error) {
      this.logger.error(`Error assigning delivery person for order ${payload.orderId}:`, error);
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
