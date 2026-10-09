import 'dotenv/config';
import 'reflect-metadata';
import { PrismaService } from './src/services/prisma.service';

async function verifyDb() {
  console.log('🔄 Connecting to Database...');
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  try {
    // Check if we can fetch categories
    const categories = await prisma.category.findMany({ take: 5 });
    console.log(`✅ Fetched ${categories.length} categories successfully!`);

    // Check if we can fetch products
    const products = await prisma.product.findMany({ take: 5 });
    console.log(`✅ Fetched ${products.length} products successfully!`);

    // Check if we can count users
    const usersCount = await prisma.user.count();
    console.log(`✅ Successfully counted users! Total: ${usersCount}`);
    
    console.log('🎉 Database connection and basic queries verified successfully!');
  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    await prisma.onModuleDestroy();
  }
}

verifyDb().catch(console.error);
