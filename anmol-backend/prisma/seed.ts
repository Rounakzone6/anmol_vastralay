import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { DEFAULT_CATEGORIES } from '../src/utils/default-categories';

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      },
      update: {
        name: cat.name,
        description: cat.description,
        isActive: true,
      },
    });
  }
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories`);

  const deliveryPersons = [
    { name: 'John Doe', phone: '1111111111' },
    { name: 'Jane Smith', phone: '2222222222' },
    { name: 'Robert Johnson', phone: '3333333333' },
    { name: 'Emily Davis', phone: '4444444444' },
    { name: 'Michael Brown', phone: '5555555555' },
  ];

  for (const p of deliveryPersons) {
    await prisma.deliveryPerson.upsert({
      where: { phone: p.phone },
      update: {},
      create: {
        name: p.name,
        phone: p.phone,
        status: 'AVAILABLE',
      },
    });
  }
  console.log(`Seeded ${deliveryPersons.length} delivery persons`);

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (adminEmail && adminPassword) {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: 'ADMIN',
        emailVerified: true,
      },
      create: {
        email: adminEmail,
        name: 'Store Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: true,
      },
    });
    console.log(`Seeded administrator user: ${adminEmail}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
