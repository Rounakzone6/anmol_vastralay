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
import { TrackingService } from '../services/tracking.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CloudinaryModule,
    AuthModule,
  ],
  providers: [
    CategoryService,
    ProductService,
    CartService,
    OrderService,
    PaymentService,
    UserService,
    CustomerService,
    BannerService,
    TrackingService,
  ],
})
export class AppModule {}
