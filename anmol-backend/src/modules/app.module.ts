import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth.module';
import { CloudinaryModule } from './cloudinary.module';
import { PrismaModule } from './prisma.module';
import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { PaymentService } from '../services/payment.service';
import { UserService } from '../services/user.service';
import { CustomerService } from '../services/customer.service';
import { BannerService } from '../services/banner.service';
import { OtpService } from '../services/otp.service';
import { ReviewService } from '../services/review.service';
import { WhatsappService } from '../services/whatsapp.service';
import { WebhookController } from '../controllers/webhook.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CloudinaryModule,
    AuthModule,
  ],
  controllers: [WebhookController],
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
  ],
})
export class AppModule {}
