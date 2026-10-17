import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(process.env.DATABASE_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const updated = await prisma.payment.updateMany({
    where: { transactionId: 'order_ToqbI8xw0bwdxz' },
    data: { transactionId: 'pay_Toqc13FiJj1ZWe' },
  });
  console.log('Updated payments:', updated);
  await prisma.$disconnect();
  await pool.end();
}

run().catch(console.error);
