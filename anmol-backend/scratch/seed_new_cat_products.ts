import { PrismaClient, ProductKind } from '@prisma/client';
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

async function seedNewCategoryProducts() {
  console.log('Seeding products for new categories...');

  const mensEthnic = await prisma.category.findUnique({
    where: { slug: 'mens-ethnic' },
    include: { subcategories: true },
  });
  const dupattas = await prisma.category.findUnique({
    where: { slug: 'dupattas-shawls' },
    include: { subcategories: true },
  });
  const indoWestern = await prisma.category.findUnique({
    where: { slug: 'indo-western' },
    include: { subcategories: true },
  });

  const productsToSeed = [
    // Men's Ethnic
    {
      name: 'Royal Navy Silk Kurta & Brocade Nehru Jacket Set',
      slug: 'royal-navy-silk-kurta-nehru-jacket',
      brand: 'Anmol Paurush',
      description: '<p>Regal royal navy blue pure raw silk kurta paired with an antique gold brocade woven Nehru jacket. Ideal for Diwali, weddings, and grand celebrations.</p>',
      netPrice: 4999,
      discountPercent: 20,
      categoryId: mensEthnic?.id!,
      subcategoryId: mensEthnic?.subcategories[0]?.id || null,
      kind: ProductKind.STANDARD,
      imageUrl: '/category-icons/cat_mens_ethnic.jpg',
      metaTitle: "Royal Navy Silk Kurta & Nehru Jacket | Anmol Vastralay",
      metaDescription: "Shop royal navy raw silk kurta with gold brocade Nehru jacket for festive celebrations.",
      variants: [
        { color: 'Navy Blue', size: '38', stockQty: 8 },
        { color: 'Navy Blue', size: '40', stockQty: 10 },
        { color: 'Navy Blue', size: '42', stockQty: 6 },
      ],
    },
    {
      name: 'Festive Antique Gold Embroidered Silk Sherwani Set',
      slug: 'festive-antique-gold-silk-sherwani',
      brand: 'Anmol Paurush',
      description: '<p>Grand festive sherwani set with intricate hand-embroidered neckline, paired with silk churidar and brooch accent.</p>',
      netPrice: 12999,
      discountPercent: 15,
      categoryId: mensEthnic?.id!,
      subcategoryId: mensEthnic?.subcategories[1]?.id || null,
      kind: ProductKind.STANDARD,
      imageUrl: '/banners/diwali_men_boys.jpg',
      metaTitle: "Festive Antique Gold Silk Sherwani | Anmol Vastralay",
      metaDescription: "Buy festive gold embroidered sherwani set for grooms and weddings at Anmol Vastralay.",
      variants: [
        { color: 'Antique Gold', size: '40', stockQty: 5 },
        { color: 'Antique Gold', size: '42', stockQty: 7 },
      ],
    },

    // Dupattas & Shawls
    {
      name: 'Heritage Crimson Red Banarasi Pure Silk Kadwa Dupatta',
      slug: 'heritage-crimson-banarasi-silk-dupatta',
      brand: 'Anmol Heritage',
      description: '<p>Auspicious crimson red Banarasi pure silk dupatta adorned with rich gold zari temple borders and traditional floral bootas.</p>',
      netPrice: 3499,
      discountPercent: 10,
      categoryId: dupattas?.id!,
      subcategoryId: dupattas?.subcategories[0]?.id || null,
      kind: ProductKind.STANDARD,
      imageUrl: '/category-icons/cat_dupattas_shawls.jpg',
      metaTitle: "Crimson Red Banarasi Silk Dupatta | Anmol Vastralay",
      metaDescription: "Handcrafted pure silk Banarasi kadwa dupatta with gold zari border.",
      variants: [
        { color: 'Crimson Red', size: 'Free Size', stockQty: 25 },
      ],
    },
    {
      name: 'Artisanal Kashmiri Pashmina Embroidered Woolen Shawl',
      slug: 'artisan-kashmiri-pashmina-shawl',
      brand: 'Anmol Heritage',
      description: '<p>Fine grade pure woolen Kashmiri pashmina shawl featuring exquisite multicolour needlework embroidery and warm delicate weave.</p>',
      netPrice: 6999,
      discountPercent: 15,
      categoryId: dupattas?.id!,
      subcategoryId: dupattas?.subcategories[1]?.id || null,
      kind: ProductKind.STANDARD,
      imageUrl: '/category-icons/cat_winter_wear.jpg',
      metaTitle: "Kashmiri Pashmina Embroidered Shawl | Anmol Vastralay",
      metaDescription: "Pure woolen Kashmiri shawl with handcrafted floral needlework.",
      variants: [
        { color: 'Ivory Beige', size: 'Free Size', stockQty: 12 },
      ],
    },

    // Indo-Western & Gowns
    {
      name: 'Wine Plum Draped Festive Sequins Indo-Western Gown',
      slug: 'wine-plum-draped-festive-gown',
      brand: 'Anmol Couture',
      description: '<p>Contemporary wine plum fusion evening gown featuring rose-gold shimmer sequins, modern cowl drape, and structured silhouette.</p>',
      netPrice: 8999,
      discountPercent: 18,
      categoryId: indoWestern?.id!,
      subcategoryId: indoWestern?.subcategories[0]?.id || null,
      kind: ProductKind.STANDARD,
      imageUrl: '/category-icons/cat_indo_western.jpg',
      metaTitle: "Wine Plum Draped Indo-Western Gown | Anmol Vastralay",
      metaDescription: "Designer festive Indo-Western gown with shimmer sequins and cowl drape.",
      variants: [
        { color: 'Wine Plum', size: 'S', stockQty: 5 },
        { color: 'Wine Plum', size: 'M', stockQty: 8 },
        { color: 'Wine Plum', size: 'L', stockQty: 6 },
      ],
    },
    {
      name: 'Rose Gold Pre-Draped Modern Festive Saree with Cape',
      slug: 'rose-gold-pre-draped-saree-cape',
      brand: 'Anmol Couture',
      description: '<p>Effortless pre-stitched festive saree set with an embroidered modern cape blouse in soft shimmering georgette.</p>',
      netPrice: 7499,
      discountPercent: 20,
      categoryId: indoWestern?.id!,
      subcategoryId: indoWestern?.subcategories[1]?.id || null,
      kind: ProductKind.STANDARD,
      imageUrl: '/category-icons/cat_indo_western.jpg',
      metaTitle: "Rose Gold Pre-Draped Saree with Cape | Anmol Vastralay",
      metaDescription: "Modern pre-draped saree set with embellished cape blouse.",
      variants: [
        { color: 'Rose Gold', size: 'M', stockQty: 10 },
        { color: 'Rose Gold', size: 'L', stockQty: 7 },
      ],
    },
  ];

  for (const p of productsToSeed) {
    if (!p.categoryId) continue;

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      const prod = await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          description: p.description,
          netPrice: p.netPrice,
          discountPercent: p.discountPercent,
          categoryId: p.categoryId,
          subcategoryId: p.subcategoryId,
          kind: p.kind,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          isActive: true,
          images: {
            create: [
              {
                url: p.imageUrl,
                altText: p.name,
                sortOrder: 0,
              },
            ],
          },
          variants: {
            create: p.variants.map((v) => ({
              color: v.color,
              size: v.size,
              sizeKey: v.size.toUpperCase(),
              stockQty: v.stockQty,
            })),
          },
        },
      });
      console.log(`✓ Seeded product: ${prod.name}`);
    } else {
      console.log(`- Product exists: ${existing.name}`);
    }
  }

  console.log('✅ Finished seeding products for new categories!');
  await prisma.$disconnect();
  await pool.end();
}

seedNewCategoryProducts().catch(console.error);
