import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/modules/app.module';
import { AuthService } from '../src/services/auth.service';
import { PrismaService } from '../src/services/prisma.service';
import { CloudinaryService } from '../src/services/cloudinary.service';
import { CategoryService } from '../src/services/category.service';
import { ProductService } from '../src/services/product.service';
import { CartService } from '../src/services/cart.service';
import { OrderService } from '../src/services/order.service';
import { PaymentService } from '../src/services/payment.service';
import { UserService } from '../src/services/user.service';
import { CustomerService } from '../src/services/customer.service';
import { BannerService } from '../src/services/banner.service';

import { createAppRouter } from '../src/routers';

async function runTests() {
  console.log('Bootstrapping NestJS Application Context...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  
  const prisma = app.get(PrismaService);
  const auth = app.get(AuthService);
  const cloudinary = app.get(CloudinaryService);

  const services = {
    category: app.get(CategoryService),
    product: app.get(ProductService),
    cart: app.get(CartService),
    order: app.get(OrderService),
    payment: app.get(PaymentService),
    user: app.get(UserService),
    customer: app.get(CustomerService),
    banner: app.get(BannerService),

  };

  const appRouter = createAppRouter(auth);

  const testEmail = 'test_customer@anmol.com';
  console.log('\n--- Cleaning up previous test data ---');
  await prisma.user.deleteMany({ where: { email: testEmail } });
  
  console.log('\n1. Testing Registration...');
  
  const publicContext = {
    prisma,
    cloudinary,
    auth,
    user: null,
    services,
  };
  
  // In trpc v10/v11 createCaller works on the router
  const publicCaller = appRouter.createCaller(publicContext);
  
  const regResult = await publicCaller.auth.register({
    email: testEmail,
    name: 'Test Customer',
    password: 'password123',
  });
  console.log('✅ User registered successfully. Token received.');
  
  const authContext = {
    prisma,
    cloudinary,
    auth,
    user: regResult.user,
    services,
  };
  
  const authCaller = appRouter.createCaller(authContext);
  
  console.log('\n2. Testing Cart Operations...');
  const category = await prisma.category.upsert({
    where: { slug: 'test-category' },
    update: {},
    create: {
      name: 'Test Category',
      slug: 'test-category',
    }
  });

  const product = await prisma.product.upsert({
    where: { slug: 'test-product' },
    update: {},
    create: {
      name: 'Test Product',
      slug: 'test-product',
      categoryId: category.id,
      netPrice: 500.00,
    }
  });

  const cartRes = await authCaller.cart.addToCart({
    productId: product.id,
    quantity: 2,
  });
  console.log('✅ Added product to cart. CartItem ID:', cartRes.id);

  let cart = await authCaller.cart.getCart();
  if (cart.items.length === 0) throw new Error('Cart should not be empty');
  console.log('✅ Cart fetched successfully. Items count:', cart.items.length);

  await authCaller.cart.updateQuantity({
    cartItemId: cartRes.id,
    quantity: 1,
  });
  console.log('✅ Cart quantity updated successfully.');
  
  console.log('\n3. Testing Checkout...');
  const order = await authCaller.order.createOrder({
    shippingAddress: '123 Test Street, India',
    paymentMethod: 'COD',
  });
  console.log('✅ Order created. ID:', order.orderId, '| Total Amount:', order.amount.toString());

  cart = await authCaller.cart.getCart();
  if (cart.items.length > 0) throw new Error('Cart should be empty after checkout');
  console.log('✅ Cart emptied after checkout.');

  console.log('\n4. Testing Payment...');
  console.log('✅ Payment skipped in test for COD. Status is handled internally.');

  console.log('\n5. Testing Order History...');
  const history = await authCaller.order.getOrderHistory();
  if (history.length === 0) throw new Error('Order history should not be empty');
  
  const orderDetails = await authCaller.order.getOrderDetails({ orderId: order.orderId });
  if (orderDetails.payments.length === 0) throw new Error('Order details should include payment');
  console.log('✅ Order history and details fetched successfully.');

  console.log('\nAll tests passed successfully! 🎉\n');
  
  // Cleanup
  console.log('Cleaning up test data...');
  await prisma.user.delete({ where: { email: testEmail } });
  
  await app.close();
}

runTests().catch((e) => {
  console.error('\n❌ Test failed:', e);
  process.exit(1);
});
