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

const CATEGORIES_DATA = [
  {
    name: 'Indo-Western & Gowns',
    slug: 'indo-western',
    description:
      'Contemporary fusion gowns, draped pre-stitched sarees, cape sets, and crop-top skirt ensembles blending Indian heritage with modern festive couture.',
    metaTitle: 'Indo-Western Gowns & Fusion Wear | Anmol Vastralay',
    metaDescription:
      'Explore designer Indo-Western gowns, pre-draped sarees, and fusion festive silhouettes at Anmol Vastralay.',
    imageUrl: '/category-icons/cat_indo_western.jpg',
    sortOrder: 0,
    isActive: true,
    subcategories: [
      {
        name: 'Festive Floor-Length Gowns',
        slug: 'festive-floor-length-gowns',
        description: 'Stunning sequined and embroidered gowns for sangeet and cocktail nights.',
        metaTitle: 'Festive Gowns Online | Anmol Vastralay',
        metaDescription: 'Shop royal party wear and sangeet floor-length gowns at Anmol Vastralay.',
      },
      {
        name: 'Draped Sarees & Fusion Sets',
        slug: 'draped-sarees-fusion-sets',
        description: 'Contemporary pre-stitched draped sarees and modern cape sets for easy elegance.',
        metaTitle: 'Draped Sarees & Cape Sets | Anmol Vastralay',
        metaDescription: 'Modern pre-draped sarees and festive fusion sets with effortless styling.',
      },
    ],
  },
  {
    name: 'Lehengas',
    slug: 'lehengas',
    description:
      'Stunning designer bridal and party wear lehengas featuring intricate zari, resham embroidery, and contemporary silhouettes.',
    metaTitle: 'Designer Bridal & Party Lehengas | Anmol Vastralay',
    metaDescription:
      'Explore designer bridal & party wear lehengas with royal craftsmanship and luxury flair at Anmol Vastralay.',
    imageUrl: '/category-icons/cat_bridal_lehenga.jpg',
    sortOrder: 1,
    isActive: true,
    subcategories: [
      {
        name: 'Bridal Lehengas',
        slug: 'bridal-lehengas',
        description: 'Grand bridal lehengas crafted in rich velvet, raw silk, and hand-embroidered zardozi for your special day.',
        metaTitle: 'Bridal Lehengas Online | Anmol Vastralay',
        metaDescription: 'Shop royal bridal lehengas with heavy embroidery, rich velvet fabrics, and custom fitting at Anmol Vastralay.',
      },
      {
        name: 'Party Wear Lehengas',
        slug: 'party-wear-lehengas',
        description: 'Chic, modern party wear lehengas featuring mirror work, sequins, and graceful pastel shades.',
        metaTitle: 'Party Wear Lehengas | Anmol Vastralay',
        metaDescription: 'Trendy party wear and sangeet lehengas in sparkling mirror work and pastels. Shop online with easy returns.',
      },
    ],
  },
  {
    name: 'Sarees',
    slug: 'sarees',
    description:
      'Explore our exquisite collection of traditional Indian sarees crafted from pure silk, georgette, and banarasi weaves.',
    metaTitle: 'Buy Traditional Sarees Online | Anmol Vastralay',
    metaDescription:
      'Shop handcrafted Indian sarees at Anmol Vastralay. Banarasi, Kanjivaram, and party wear sarees with fast shipping & best prices.',
    imageUrl: '/category-icons/cat_festive_saree.jpg',
    sortOrder: 2,
    isActive: true,
    subcategories: [
      {
        name: 'Banarasi Silk Sarees',
        slug: 'banarasi-silk-sarees',
        description: 'Timeless Banarasi silk sarees with rich golden and silver zari craftsmanship.',
        metaTitle: 'Banarasi Silk Sarees | Anmol Vastralay',
        metaDescription: 'Shop authentic Banarasi silk sarees for weddings and festive occasions with exquisite zari work.',
      },
      {
        name: 'Kanjivaram Silk Sarees',
        slug: 'kanjivaram-silk-sarees',
        description: 'Regal Kanjivaram silk sarees featuring traditional temple borders and vibrant hues.',
        metaTitle: 'Kanjivaram Silk Sarees | Anmol Vastralay',
        metaDescription: 'Pure silk Kanjivaram sarees handcrafted for brides and celebrations. Exclusive collection at Anmol Vastralay.',
      },
      {
        name: 'Chiffon & Georgette Sarees',
        slug: 'chiffon-georgette-sarees',
        description: 'Lightweight, flowy chiffon and georgette sarees with delicate embroidery for effortless elegance.',
        metaTitle: 'Chiffon & Georgette Sarees | Anmol Vastralay',
        metaDescription: 'Elegant lightweight chiffon & georgette sarees. Perfect for parties, cocktails, and festive occasions.',
      },
    ],
  },
  {
    name: 'Kurtis & Suits',
    slug: 'kurtis-suits',
    description:
      'Elegant salwar suits, anarkali sets, and festive kurtis for weddings, festivals, and daily elegance.',
    metaTitle: 'Designer Kurtis & Salwar Suits | Anmol Vastralay',
    metaDescription:
      'Discover designer kurtis, anarkali sets, and salwar suits at Anmol Vastralay. Premium fabrics, best prices in India.',
    imageUrl: '/category-icons/cat_kurti_suits.jpg',
    sortOrder: 3,
    isActive: true,
    subcategories: [
      {
        name: 'Anarkali Suit Sets',
        slug: 'anarkali-suit-sets',
        description: 'Flared royal anarkali suit sets with matching dupatta and churidar.',
        metaTitle: 'Anarkali Suit Sets | Anmol Vastralay',
        metaDescription: 'Flared anarkali suits in silk, georgette, and cotton for festive celebrations and weddings.',
      },
      {
        name: 'Straight Cut Kurti Sets',
        slug: 'straight-cut-kurti-sets',
        description: 'Comfortable, stylish straight cut kurti sets with pants and dupatta for office and festive wear.',
        metaTitle: 'Straight Kurti Sets | Anmol Vastralay',
        metaDescription: 'Explore versatile straight kurti sets crafted from pure cotton and silk blends for every day and festivities.',
      },
    ],
  },
  {
    name: "Men's Royal Ethnic",
    slug: 'mens-ethnic',
    description:
      'Regal Indian ethnic wear for men and boys, including raw silk kurtas, designer Nehru jackets, bandhgala suits, and wedding sherwanis with intricate zari embroidery.',
    metaTitle: "Men's Ethnic Wear & Festive Kurtas | Anmol Vastralay",
    metaDescription:
      'Shop royal festive kurtas, Nehru jackets, and wedding sherwanis for men at Anmol Vastralay. Handcrafted luxury at best prices.',
    imageUrl: '/category-icons/cat_mens_ethnic.jpg',
    sortOrder: 4,
    isActive: true,
    subcategories: [
      {
        name: 'Festive Kurta Sets',
        slug: 'festive-kurta-sets',
        description: 'Traditional and festive kurta pyjama sets in pure silk, linen, and jacquard weaves.',
        metaTitle: "Men's Festive Kurta Pyjama | Anmol Vastralay",
        metaDescription: "Shop men's silk and cotton festive kurta sets with intricate neck embroidery at Anmol Vastralay.",
      },
      {
        name: 'Nehru Jackets & Bundis',
        slug: 'nehru-jackets-bundis',
        description: 'Tailored festive Nehru jackets and raw silk bundis with antique button detailing.',
        metaTitle: 'Nehru Jackets for Men | Anmol Vastralay',
        metaDescription: 'Pair your kurta with regal brocade and silk Nehru jackets for weddings and Diwali celebrations.',
      },
      {
        name: 'Wedding Sherwanis',
        slug: 'wedding-sherwanis',
        description: 'Grand wedding sherwanis with intricate zari and threadwork embroidery for the discerning groom.',
        metaTitle: 'Royal Wedding Sherwanis | Anmol Vastralay',
        metaDescription: 'Exquisite bridal groom sherwanis crafted with royal embroidery and silk fabrics.',
      },
    ],
  },
  {
    name: 'Kids Festive Wear',
    slug: 'kids-wear',
    description:
      'Joyous festive ethnic wear for boys and girls, featuring bright silk kurta-dhotis, sherwanis, and handcrafted lehenga cholis made with skin-friendly fabrics.',
    metaTitle: 'Kids Festive & Ethnic Wear | Anmol Vastralay',
    metaDescription:
      'Shop boys kurta pajamas, girls lehengas, and festive kids wear at Anmol Vastralay. Vibrant designs, soft fabrics, best prices.',
    imageUrl: '/category-icons/cat_kids_festive.jpg',
    sortOrder: 5,
    isActive: true,
    subcategories: [
      {
        name: 'Boys Ethnic Wear',
        slug: 'boys-ethnic-wear',
        description: 'Festive kurta-pajama, dhoti sets, and bandhgalas for young boys.',
        metaTitle: 'Boys Festive Ethnic Wear | Anmol Vastralay',
        metaDescription: 'Shop boys ethnic kurta pajama and festive dhoti sets with soft lining at Anmol Vastralay.',
      },
      {
        name: 'Girls Festive Wear',
        slug: 'girls-festive-wear',
        description: 'Charming lehenga-cholis, anarkalis, and festive frocks for little girls.',
        metaTitle: 'Girls Lehenga Choli & Festive Wear | Anmol Vastralay',
        metaDescription: 'Beautiful ethnic lehenga cholis and anarkali dresses for girls at best prices.',
      },
    ],
  },
  {
    name: 'Dupattas & Shawls',
    slug: 'dupattas-shawls',
    description:
      'Handwoven Banarasi silk dupattas, intricate Kashmiri pashmina shawls, phulkari stoles, and organza wraps to elevate any festive or bridal ensemble.',
    metaTitle: 'Handcrafted Dupattas & Pashmina Shawls | Anmol Vastralay',
    metaDescription:
      'Discover pure Banarasi silk dupattas, embroidered shawls, and festive stoles at Anmol Vastralay.',
    imageUrl: '/category-icons/cat_dupattas_shawls.jpg',
    sortOrder: 6,
    isActive: true,
    subcategories: [
      {
        name: 'Banarasi Silk Dupattas',
        slug: 'banarasi-silk-dupattas',
        description: 'Pure silk Banarasi dupattas with rich zari borders and traditional kadwa weaves.',
        metaTitle: 'Banarasi Silk Dupattas | Anmol Vastralay',
        metaDescription: 'Royal Banarasi silk dupattas with heavy gold and silver zari work online.',
      },
      {
        name: 'Kashmiri Pashmina Shawls',
        slug: 'kashmiri-pashmina-shawls',
        description: 'Fine woolen Kashmiri shawls featuring delicate paisley needlework.',
        metaTitle: 'Kashmiri Pashmina & Woolen Shawls | Anmol Vastralay',
        metaDescription: 'Pure Kashmiri pashmina and wool embroidered shawls for weddings and winter celebrations.',
      },
    ],
  },
  {
    name: 'Shirt & Jeans',
    slug: 'shirt-jeans',
    description:
      "Explore men's premium cotton-linen shirts, formal trousers, and classic tailored jeans crafted for festive gatherings and casual everyday elegance.",
    metaTitle: "Men's Shirts & Jeans Online | Anmol Vastralay",
    metaDescription:
      "Shop men's casual and festive shirts, trousers, and tailored jeans online at Anmol Vastralay with pan-India delivery.",
    imageUrl: '/category-icons/cat_shirt_jeans.jpg',
    sortOrder: 7,
    isActive: true,
    subcategories: [
      {
        name: 'Formal & Festive Shirts',
        slug: 'formal-festive-shirts',
        description: 'Crisp linen, cotton, and jacquard shirts tailored for special occasions.',
        metaTitle: "Men's Formal & Festive Shirts | Anmol Vastralay",
        metaDescription: 'Shop stylish formal and festive shirts in pure cotton and linen blends.',
      },
      {
        name: 'Denim & Trousers',
        slug: 'denim-trousers',
        description: 'Comfort-stretch denim jeans, chinos, and tailored formal trousers.',
        metaTitle: "Men's Jeans & Trousers | Anmol Vastralay",
        metaDescription: 'Premium stretch jeans and tailored formal trousers for men.',
      },
    ],
  },
  {
    name: 'Suiting & Shirting',
    slug: 'suiting-shirting',
    description:
      'Luxury unstitched suiting and shirting lengths from premier brands like Raymond, Siyaram, and Italian wool blends for bespoke 3-piece suits, bandhgalas, and formal shirts.',
    metaTitle: 'Premium Suiting & Shirting Fabrics | Anmol Vastralay',
    metaDescription:
      'Discover luxury unstitched fabrics for custom bespoke suits, blazers, and shirts from top mills at Anmol Vastralay.',
    imageUrl: '/category-icons/cat_suiting_1781796955795.png',
    sortOrder: 8,
    isActive: true,
    subcategories: [
      {
        name: 'Suit Fabrics & Lengths',
        slug: 'suit-fabrics-lengths',
        description: 'Pure wool, poly-viscose, and tweed fabrics for custom tailored suits and blazers.',
        metaTitle: 'Unstitched Suit Fabrics | Anmol Vastralay',
        metaDescription: 'Premium suit piece lengths from Raymond and Reid & Taylor.',
      },
      {
        name: 'Premium Shirting Fabrics',
        slug: 'premium-shirting-fabrics',
        description: 'Giza cotton, linen blends, and oxford shirting cloth.',
        metaTitle: 'Shirting Fabrics Online | Anmol Vastralay',
        metaDescription: 'Shop unstitched fine cotton and linen shirting fabrics for bespoke tailoring.',
      },
    ],
  },
  {
    name: 'Winter Wear',
    slug: 'winter-wear',
    description:
      'Heritage woolen cardigans, embroidered Kashmiri pashmina shawls, cashmere stoles, and quilted jackets crafted to keep you warm with timeless elegance.',
    metaTitle: 'Winter Wear & Pashmina Shawls | Anmol Vastralay',
    metaDescription:
      'Explore luxury winter wear, pure woolen shawls, stoles, and jackets for the chilly festive season at Anmol Vastralay.',
    imageUrl: '/category-icons/cat_winter_wear.jpg',
    sortOrder: 9,
    isActive: true,
    subcategories: [
      {
        name: 'Woolen Shawls & Stoles',
        slug: 'woolen-shawls-stoles',
        description: 'Authentic warm shawls with artisanal borders and Kashmiri needlework.',
        metaTitle: 'Woolen Shawls & Stoles | Anmol Vastralay',
        metaDescription: 'Cozy and stylish winter shawls for men and women.',
      },
      {
        name: 'Sweaters & Cardigans',
        slug: 'sweaters-cardigans',
        description: 'Soft knit sweaters, cardigans, and festive woolen jackets.',
        metaTitle: 'Winter Sweaters & Cardigans | Anmol Vastralay',
        metaDescription: 'Premium warm sweaters and cardigans for the winter festive season.',
      },
    ],
  },
  {
    name: 'Inner Wear',
    slug: 'inner-wear',
    description:
      'Ultra-soft combed cotton vests, briefs, trunks, and thermal innerwear designed for all-day breathability, softness, and supreme durability.',
    metaTitle: 'Comfort Innerwear & Loungewear | Anmol Vastralay',
    metaDescription:
      'Shop premium cotton innerwear, vests, and thermals for men and women at Anmol Vastralay.',
    imageUrl: '/category-icons/cat_innerwear_1781796989469.png',
    sortOrder: 10,
    isActive: true,
    subcategories: [
      {
        name: "Men's Innerwear",
        slug: 'mens-innerwear',
        description: 'Combed cotton vests, trunks, and briefs with soft non-chafing waistbands.',
        metaTitle: "Men's Innerwear | Anmol Vastralay",
        metaDescription: "Shop men's cotton vests, briefs, and boxers for daily ease.",
      },
      {
        name: 'Thermal Wear',
        slug: 'thermal-wear',
        description: 'Body-hugging warm thermal tops and bottoms for cold winter months.',
        metaTitle: 'Thermal Wear for Winter | Anmol Vastralay',
        metaDescription: 'Premium winter thermals for men and women at Anmol Vastralay.',
      },
    ],
  },
];

async function updateCategories() {
  console.log('--- Updating Categories and Subcategories ---');

  for (const cat of CATEGORIES_DATA) {
    const upsertedCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        metaTitle: cat.metaTitle,
        metaDescription: cat.metaDescription,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
      },
      update: {
        name: cat.name,
        description: cat.description,
        metaTitle: cat.metaTitle,
        metaDescription: cat.metaDescription,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
      },
    });

    console.log(`✓ Category: ${upsertedCat.name} (Slug: ${upsertedCat.slug}, Image: ${upsertedCat.imageUrl})`);

    for (const sub of cat.subcategories) {
      await prisma.subcategory.upsert({
        where: { slug: sub.slug },
        create: {
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          metaTitle: sub.metaTitle,
          metaDescription: sub.metaDescription,
          categoryId: upsertedCat.id,
          isActive: true,
        },
        update: {
          name: sub.name,
          description: sub.description,
          metaTitle: sub.metaTitle,
          metaDescription: sub.metaDescription,
          categoryId: upsertedCat.id,
          isActive: true,
        },
      });
      console.log(`   ↳ Subcategory: ${sub.name}`);
    }
  }

  // Also remove old dummy categories if any with slug silk, suti, sefon that are unused
  const unusedSlugs = ['silk', 'suti', 'sefon', 'saree', 'lehenga', 'kurti', 'suit'];
  for (const s of unusedSlugs) {
    const existing = await prisma.category.findUnique({
      where: { slug: s },
      include: { _count: { select: { products: true } } },
    });
    if (existing && existing._count.products === 0) {
      console.log(`Deactivating unused legacy category: ${s}`);
      await prisma.category.update({
        where: { slug: s },
        data: { isActive: false },
      });
    }
  }

  console.log('✅ All categories and subcategories successfully updated!');
  await prisma.$disconnect();
  await pool.end();
}

updateCategories().catch(console.error);
