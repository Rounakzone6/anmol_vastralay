import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/modules/app.module';
import { PrismaService } from '../src/services/prisma.service';
import { ReviewService } from '../src/services/review.service';

async function runTest() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const reviewService = app.get(ReviewService);

  // create a dummy user
  const user = await prisma.user.create({
    data: {
      name: 'Test Reviewer',
      phone: '9998887776',
    }
  });

  // create a dummy category and product
  const category = await prisma.category.create({
    data: {
      name: 'Test Category',
      slug: 'test-cat-' + Date.now(),
    }
  });

  const product = await prisma.product.create({
    data: {
      name: 'Test Product',
      slug: 'test-prod-' + Date.now(),
      categoryId: category.id,
      netPrice: 100,
    }
  });

  try {
    const res = await reviewService.addReview(user.id, {
      productId: product.id,
      rating: 5,
      title: 'Good product',
      comment: 'Very nice',
    });
    console.log('Success!', res);
  } catch (err) {
    console.error('Failed!', err);
  }

  // cleanup
  await prisma.review.deleteMany({ where: { userId: user.id } });
  await prisma.product.deleteMany({ where: { id: product.id } });
  await prisma.category.deleteMany({ where: { id: category.id } });
  await prisma.user.deleteMany({ where: { id: user.id } });

  await app.close();
}

runTest();
