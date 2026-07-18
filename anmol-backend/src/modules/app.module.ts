import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@backend/modules/auth.module';
import { CloudinaryModule } from '@backend/modules/cloudinary.module';
import { PrismaModule } from '@backend/modules/prisma.module';
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
import { WebhookController } from '@backend/controllers/webhook.controller';
import { WhatsappController } from '@backend/controllers/whatsapp.controller';
import { ChatbotService } from '@backend/services/chatbot.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CloudinaryModule,
    AuthModule,
  ],
  controllers: [WebhookController, WhatsappController],
  providers: [
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
    ChatbotService,
  ],
})
export class AppModule {}
