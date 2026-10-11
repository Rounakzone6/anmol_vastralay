import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const useSsl = process.env.DATABASE_SSL === 'true';

const pool = new Pool({
  connectionString,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function getCategories() {
  const categories = await prisma.category.findMany({
    include: {
      subcategories: true,
      _count: {
        select: { products: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  console.log(JSON.stringify(categories, null, 2));
  await prisma.$disconnect();
  await pool.end();
}

getCategories().catch(console.error);
