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

async function main() {
  const existing = await prisma.membershipPlan.findFirst();
  if (!existing) {
    const plan = await prisma.membershipPlan.create({
      data: {
        name: 'Anmol VIP Royal Club',
        price: 1.00, // Dynamic price initially set to ₹1
        durationDays: 365,
        deliveryCharge: 20.00, // ₹20 for non-members, ₹0 for members
        benefits: [
          'Free Delivery on ALL orders (Save ₹20 on every order, no minimum spend)',
          'Priority 24h Express Dispatch & Packaging',
          'VIP Early Access to Festive Sales & New Bridal Drops',
          'Dedicated VIP WhatsApp Styling & Customer Support',
          'Surprise Birthday / Anniversary Gift Voucher'
        ],
        isActive: true,
      },
    });
    console.log('Created default Membership Plan:', plan);
  } else {
    console.log('Existing plan found:', existing);
  }
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
