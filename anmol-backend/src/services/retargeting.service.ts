import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { WhatsappWebService } from './whatsapp-web.service';
import { AiService } from './ai.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RetargetingService {
  private readonly logger = new Logger(RetargetingService.name);
  private readonly logFilePath = path.join(process.cwd(), 'retargeting-log.json');

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappWebService,
    private readonly aiService: AiService,
  ) {}

  // Run every day at midnight. (Can be changed to every minute for testing)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCustomerChurnPrediction() {
    this.logger.log('Running Churn Prediction & Smart Retargeting Job...');

    try {
      // 1. Fetch all users who have at least 2 completed/delivered orders
      const users = await this.prisma.user.findMany({
        where: {
          orders: {
            some: { status: 'DELIVERED' }
          }
        },
        include: {
          orders: {
            where: { status: 'DELIVERED' },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true, totalAmount: true }
          }
        }
      });

      const retargetedLogs = this.getRetargetedLogs();
      const today = new Date();

      for (const user of users) {
        if (!user.phone || user.orders.length < 2) continue; // Need at least 2 orders to calculate frequency

        // Check if already retargeted in the last 30 days
        const lastRetargetedStr = retargetedLogs[user.id];
        if (lastRetargetedStr) {
          const lastRetargeted = new Date(lastRetargetedStr);
          const diffDays = (today.getTime() - lastRetargeted.getTime()) / (1000 * 3600 * 24);
          if (diffDays < 30) continue; // Skip, don't spam
        }

        const orders = user.orders;
        const firstOrderDate = orders[0].createdAt;
        const lastOrderDate = orders[orders.length - 1].createdAt;

        const totalDaysAsCustomer = (lastOrderDate.getTime() - firstOrderDate.getTime()) / (1000 * 3600 * 24);
        const avgDaysBetweenOrders = totalDaysAsCustomer / (orders.length - 1);

        const daysSinceLastOrder = (today.getTime() - lastOrderDate.getTime()) / (1000 * 3600 * 24);

        // Churn Condition: If they are late by 1.5x their usual frequency AND it has been at least 30 days.
        if (daysSinceLastOrder > (avgDaysBetweenOrders * 1.5) && daysSinceLastOrder > 30) {
          this.logger.log(`User ${user.name || user.phone} is at risk of churning! Avg Frequency: ${avgDaysBetweenOrders.toFixed(1)} days, Last Order: ${daysSinceLastOrder.toFixed(1)} days ago.`);
          
          await this.sendRetargetingMessage(user.id, user.phone, user.name);
          
          // Log it so we don't spam
          retargetedLogs[user.id] = today.toISOString();
          this.saveRetargetedLogs(retargetedLogs);
        }
      }
      
      this.logger.log('Churn Prediction Job Completed.');
    } catch (error) {
      this.logger.error('Error during churn prediction job', error);
    }
  }

  private async sendRetargetingMessage(userId: string, phone: string, name: string | null) {
    try {
      // Create a targeted AI message
      const prompt = `
        You are the marketing assistant for 'Anmol Vastralay'.
        Write a very short, friendly WhatsApp message (in Hinglish) to a loyal customer named ${name || 'Customer'}.
        We noticed they haven't bought anything in a while. 
        Offer them a special 15% discount code "COMEBACK15" to use on their next purchase.
        Keep it warm, concise, and under 3 sentences. No markdown formatting.
      `;

      // Assuming AiService has a method to just generate text. We can reuse generateChatbotReply or create a new one.
      // Wait, generateChatbotReply has a specific system prompt. Let's add a generic generateText method to AiService, 
      // or we can just use generateChatbotReply (it might act like a chatbot though). Let's use AiService.generateRetargetingMessage
      
      const message = await this.aiService.generateRetargetingMessage(prompt);

      // Send via WhatsApp
      const success = await this.whatsappService.sendMessage(phone, message);
      if (success) {
        this.logger.log(`Successfully sent retargeting message to ${phone}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send retargeting message to ${phone}`, error);
    }
  }

  private getRetargetedLogs(): Record<string, string> {
    try {
      if (fs.existsSync(this.logFilePath)) {
        const data = fs.readFileSync(this.logFilePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      this.logger.error('Could not read retargeting logs', error);
    }
    return {};
  }

  private saveRetargetedLogs(logs: Record<string, string>) {
    try {
      fs.writeFileSync(this.logFilePath, JSON.stringify(logs, null, 2));
    } catch (error) {
      this.logger.error('Could not write retargeting logs', error);
    }
  }
}
