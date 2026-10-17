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

async function check() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user: { select: { name: true, phone: true } },
      order: { select: { id: true, totalAmount: true } },
    },
  });
  console.log(JSON.stringify(payments, null, 2));
  await prisma.$disconnect();
  await pool.end();
}

check().catch(console.error);
