import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from '@backend/modules/auth.module';
import { CloudinaryModule } from '@backend/modules/cloudinary.module';
import { PrismaModule } from '@backend/modules/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { redis } from '@backend/config/redis.config';
import { NotificationQueueService } from '@backend/services/notification-queue.service';
import { NotificationProcessor } from '@backend/processors/notification.processor';
import { CategoryService } from '@backend/services/category.service';
import { ProductService } from '@backend/services/product.service';
import { CartService } from '@backend/services/cart.service';
import { OrderService } from '@backend/services/order.service';
import { PaymentService } from '@backend/services/payment.service';
import { UserService } from '@backend/services/user.service';
import { CustomerService } from '@backend/services/customer.service';
import { BannerService } from '@backend/services/banner.service';
import { OtpService } from '@backend/services/otp.service';
import { ReviewService } from '@backend/services/review.service';
import { WhatsappService } from '@backend/services/whatsapp.service';
import { WhatsappWebService } from '@backend/services/whatsapp-web.service';
import { WebhookController } from '@backend/controllers/webhook.controller';
import { WhatsappController } from '@backend/controllers/whatsapp.controller';
import { ChatbotService } from '@backend/services/chatbot.service';
import { InvoiceService } from '@backend/services/invoice.service';
import { EmailModule } from '@backend/modules/email.module';
import { AiService } from '@backend/services/ai.service';
import { RetargetingService } from '@backend/services/retargeting.service';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { DeliveryAssignmentService } from '@backend/services/delivery-assignment.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),
    PrismaModule,
    CloudinaryModule,
    EmailModule,
    AuthModule,
    BullModule.forRoot({
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'notifications',
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [WebhookController, WhatsappController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    CategoryService,
    ProductService,
    CartService,
    OrderService,
    PaymentService,
    UserService,
    CustomerService,
    BannerService,
    OtpService,
    ReviewService,
    WhatsappService,
    WhatsappWebService,
    ChatbotService,
    InvoiceService,
    DeliveryAssignmentService,
    AiService,
    RetargetingService,
    NotificationQueueService,
    NotificationProcessor,
  ],
})
export class AppModule {}
