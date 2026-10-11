import { PrismaClient, BannerPlacement } from '@prisma/client';
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

async function seedBanners() {
  console.log('Seeding 5 new festive banners into DB...');

  // Clear existing banners
  await prisma.banner.deleteMany({});

  const banners = [
    {
      title: 'Dussehra & Vijayadashami Festive Weaves',
      subtitle: 'Opulent crimson red & mustard gold Banarasi silk sarees woven for triumph and celebration.',
      buttonText: 'Shop Dussehra Sarees',
      imageUrl: '/banners/dussehra_festival.jpg',
      placement: BannerPlacement.HERO,
      linkUrl: '/collections/sarees',
      isActive: true,
    },
    {
      title: 'Karwa Chauth Moonlit Bridal Elegance',
      subtitle: 'Exquisite bridal lehengas & pure silk sarees crafted for eternal love and sacred rituals.',
      buttonText: 'Shop Karwa Chauth',
      imageUrl: '/banners/karwa_chauth.jpg',
      placement: BannerPlacement.HERO,
      linkUrl: '/collections/lehengas',
      isActive: true,
    },
    {
      title: 'Diwali Deepotsav: Women & Girls Royal Edit',
      subtitle: 'Radiant designer lehengas, sequins Anarkalis & festive matching mother-daughter couture.',
      buttonText: 'Explore Diwali Edit',
      imageUrl: '/banners/diwali_women_girls.jpg',
      placement: BannerPlacement.HERO,
      linkUrl: '/collections/kurtis-suits',
      isActive: true,
    },
    {
      title: 'Chhath Puja Mahaparv: Sacred Handloom Weaves',
      subtitle: 'Auspicious turmeric yellow & vermillion red handloom pure silk sarees for Arghya offerings.',
      buttonText: 'Shop Chhath Sarees',
      imageUrl: '/banners/chhath_puja.jpg',
      placement: BannerPlacement.HERO,
      linkUrl: '/collections/sarees',
      isActive: true,
    },
    {
      title: "Diwali Celebration: Men & Boys Royal Ethnic Wear",
      subtitle: 'Matching royal navy blue & gold embroidered silk kurtas, Nehru jackets and festive sherwanis.',
      buttonText: "Shop Men's Diwali",
      imageUrl: '/banners/diwali_men_boys.jpg',
      placement: BannerPlacement.HERO,
      linkUrl: '/collections/shirt-jeans',
      isActive: true,
    },
    // Promo Banners
    {
      title: 'Karwa Chauth & Bridal Trousseau',
      subtitle: 'Handcrafted zardozi and heirloom silk weaves with up to 25% festive discount.',
      buttonText: 'View Bridal Edit',
      imageUrl: '/banners/karwa_chauth.jpg',
      placement: BannerPlacement.PROMO,
      linkUrl: '/collections/lehengas',
      isActive: true,
    },
    {
      title: 'Diwali Grandeur: Men & Boys Festive Sets',
      subtitle: 'Tailored bandhgala waistcoats and royal kurtas for father & son.',
      buttonText: "Explore Men's Edit",
      imageUrl: '/banners/diwali_men_boys.jpg',
      placement: BannerPlacement.PROMO,
      linkUrl: '/collections/shirt-jeans',
      isActive: true,
    },
    // Category Banners
    {
      title: 'Chhath & Festive Banarasi Sarees',
      subtitle: 'Pure handloom silk celebrating Bihar and India’s sacred traditions',
      buttonText: 'Explore All Sarees',
      imageUrl: '/banners/chhath_puja.jpg',
      placement: BannerPlacement.CATEGORY,
      linkUrl: 'sarees',
      isActive: true,
    },
    {
      title: 'Karwa Chauth & Bridal Lehengas',
      subtitle: 'Heirloom craftsmanship designed for the most memorable celebrations',
      buttonText: 'Explore Lehengas',
      imageUrl: '/banners/karwa_chauth.jpg',
      placement: BannerPlacement.CATEGORY,
      linkUrl: 'lehengas',
      isActive: true,
    },
    {
      title: 'Diwali Designer Suits & Anarkalis',
      subtitle: 'Flowy festive silhouettes, organza dupattas, and intricate embroidery',
      buttonText: 'Explore Kurtis & Suits',
      imageUrl: '/banners/diwali_women_girls.jpg',
      placement: BannerPlacement.CATEGORY,
      linkUrl: 'kurtis-suits',
      isActive: true,
    },
  ];

  for (const b of banners) {
    const created = await prisma.banner.create({ data: b });
    console.log(`Created banner: [${b.placement}] ${b.title} (${created.id})`);
  }

  console.log(`Successfully seeded ${banners.length} festive banners!`);
}

seedBanners()
  .catch((e) => {
    console.error('Error seeding banners:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
