import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InvoiceService } from '@backend/services/invoice.service';
import { WhatsappWebService } from '@backend/services/whatsapp-web.service';
import { PrismaService } from '@backend/services/prisma.service';

@Injectable()
@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly whatsappWebService: WhatsappWebService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'order-email':
        return this.handleOrderEmail(job.data);
      case 'order-whatsapp':
        return this.handleOrderWhatsApp(job.data);
      case 'marketing-message':
        return this.handleMarketingMessage(job.data);
      default:
        this.logger.warn(`No handler for job name: ${job.name}`);
    }
  }

  private async handleOrderEmail(data: { orderId: string }) {
    const { orderId } = data;
    try {
      await this.invoiceService.emailOrderInvoice(orderId);
      this.logger.log(`✅ Order ${orderId}: Invoice email sent`);
    } catch (error) {
      this.logger.error(`❌ Order ${orderId}: Failed to send invoice email`, error);
      throw error;
    }
  }

  private async handleOrderWhatsApp(data: {
    orderId: string;
    userId: string;
    amount: number;
    phone?: string | null;
  }) {
    const { orderId, userId, amount } = data;
    try {
      let phone = data.phone;
      if (!phone) {
        // Fallback to address phone if user profile doesn't have it
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        phone = user?.phone;
        if (!phone) {
          const address = await this.prisma.address.findFirst({
            where: { userId },
            orderBy: { isDefault: 'desc' },
          });
          phone = address?.phone;
        }
      }

      if (phone) {
        // Ensure invoice PDF is ready for WhatsApp
        const invoice = await this.invoiceService.generateInvoice(undefined, orderId);
        
        const message = `🛍️ *Order Confirmed!* 🛍️\n\nThank you for shopping at Anmol Vastralay!\nYour order *#${orderId.slice(-8).toUpperCase()}* for ₹${amount} has been placed successfully.\n\nAttached is your invoice. 🧾`;
        
        await this.whatsappWebService.sendDocument(
          phone,
          { url: invoice.invoiceUrl },
          `${invoice.invoiceNumber}.pdf`,
          message
        );
        this.logger.log(`✅ Order ${orderId}: WhatsApp confirmation sent to ${phone}`);
      } else {
        this.logger.warn(`⚠️ Order ${orderId}: No phone number found for WhatsApp confirmation`);
      }
    } catch (error) {
      this.logger.error(`❌ Order ${orderId}: Failed to send WA confirmation`, error);
      throw error;
    }
  }

  private async handleMarketingMessage(data: { phone: string; message: string }) {
    try {
      await this.whatsappWebService.sendMessage(data.phone, data.message);
      this.logger.log(`✅ Sent marketing message to ${data.phone}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send marketing message to ${data.phone}`, error);
      throw error;
    }
  }
}
