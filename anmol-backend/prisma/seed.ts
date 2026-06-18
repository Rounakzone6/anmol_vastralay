import { PrismaClient } from '@prisma/client';
import { DEFAULT_CATEGORIES } from '../src/utils/default-categories';

const prisma = new PrismaClient();

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
