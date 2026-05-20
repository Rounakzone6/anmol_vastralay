import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;
  console.log('DATABASE_URL uses port 5433 (see .env)');
  console.log('Tables:', tables.map((t) => t.tablename).join(', '));
  console.log('Categories:', await prisma.category.count());
  console.log('Products:', await prisma.product.count());
  const products = await prisma.product.findMany({
    take: 5,
    include: { category: { select: { name: true } } },
  });
  console.log('Sample products:', JSON.stringify(products, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
