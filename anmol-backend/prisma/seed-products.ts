import { PrismaClient, ProductKind } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
const useSsl = process.env.DATABASE_SSL === 'true';

const pool = new Pool({
  connectionString,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Starting Product & Category Seeding ---');

  // 1. Categories and Subcategories definition
  const categoryDefs = [
    {
      name: 'Sarees',
      slug: 'sarees',
      description: 'Explore our exquisite collection of traditional Indian sarees crafted from pure silk, georgette, and banarasi weaves.',
      metaTitle: 'Buy Traditional Sarees Online | Anmol Vastralay',
      metaDescription: 'Shop handcrafted Indian sarees at Anmol Vastralay. Banarasi, Kanjivaram, and party wear sarees with fast shipping & best prices.',
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
      name: 'Lehengas',
      slug: 'lehengas',
      description: 'Stunning designer bridal and party wear lehengas featuring intricate zari, resham embroidery, and contemporary silhouettes.',
      metaTitle: 'Designer Bridal & Party Lehengas | Anmol Vastralay',
      metaDescription: 'Explore designer bridal & party wear lehengas with royal craftsmanship and luxury flair at Anmol Vastralay.',
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
      name: 'Kurtis & Suits',
      slug: 'kurtis-suits',
      description: 'Elegant salwar suits, anarkali sets, and festive kurtis for weddings, festivals, and daily elegance.',
      metaTitle: 'Designer Kurtis & Salwar Suits | Anmol Vastralay',
      metaDescription: 'Discover designer kurtis, anarkali sets, and salwar suits at Anmol Vastralay. Premium fabrics, best prices in India.',
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
  ];

  // Map to hold category & subcategory IDs
  const categoryMap = new Map<string, string>();
  const subcategoryMap = new Map<string, string>();

  for (const cat of categoryDefs) {
    const upsertedCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        metaTitle: cat.metaTitle,
        metaDescription: cat.metaDescription,
        isActive: true,
      },
      update: {
        name: cat.name,
        description: cat.description,
        metaTitle: cat.metaTitle,
        metaDescription: cat.metaDescription,
        isActive: true,
      },
    });

    categoryMap.set(cat.slug, upsertedCat.id);
    console.log(`✓ Category: ${upsertedCat.name} (${upsertedCat.id})`);

    for (const sub of cat.subcategories) {
      const upsertedSub = await prisma.subcategory.upsert({
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

      subcategoryMap.set(sub.slug, upsertedSub.id);
      console.log(`  └─ Subcategory: ${upsertedSub.name} (${upsertedSub.id})`);
    }
  }

  // 2. Define Products (6 Sarees, 6 Lehengas, 6 Kurtis/Suits)
  const products = [
    // --- SAREES (Kind: SAREE, size is null) ---
    {
      name: 'Royal Crimson Banarasi Zari Silk Saree',
      slug: 'royal-crimson-banarasi-zari-silk-saree',
      brand: 'Anmol Heritage',
      categorySlug: 'sarees',
      subcategorySlug: 'banarasi-silk-sarees',
      kind: ProductKind.SAREE,
      netPrice: 5499,
      discountPercent: 15,
      allowsExtraSaya: true,
      extraSayaPrice: 299,
      description: '<p>A masterpiece of handloom tradition, this <strong>Royal Crimson Banarasi Silk Saree</strong> features opulent gold zari kadwa motifs woven across pure katan silk. Comes with an unstitched matching blouse piece.</p><ul><li>Fabric: Pure Katan Silk</li><li>Work: Antique Gold Zari Weave</li><li>Occasion: Weddings, Festivals, Ceremonies</li><li>Care: Dry Clean Only</li></ul>',
      metaTitle: 'Royal Crimson Banarasi Zari Silk Saree | Anmol Vastralay',
      metaDescription: 'Shop handcrafted Royal Crimson Banarasi Silk Saree with pure gold zari weave. Traditional luxury for weddings & celebrations.',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Crimson Red', stockQty: 15 },
        { color: 'Royal Blue', stockQty: 10 },
        { color: 'Emerald Green', stockQty: 8 },
      ],
    },
    {
      name: 'Golden Zari Kanjivaram Temple Border Saree',
      slug: 'golden-zari-kanjivaram-temple-border-saree',
      brand: 'Anmol Heritage',
      categorySlug: 'sarees',
      subcategorySlug: 'kanjivaram-silk-sarees',
      kind: ProductKind.SAREE,
      netPrice: 7999,
      discountPercent: 20,
      allowsExtraSaya: true,
      extraSayaPrice: 299,
      description: '<p>Woven with authentic silver dipped zari, this exquisite <strong>Kanjivaram Silk Saree</strong> showcases traditional temple borders (Korvai technique) and intricate peacock motifs on a lustrous body.</p><ul><li>Fabric: 100% Pure Mulberry Silk</li><li>Weave: Traditional Kanjivaram Jacquard</li><li>Occasion: Bridal, Grand Receptions</li><li>Includes: Contrast Blouse Piece</li></ul>',
      metaTitle: 'Golden Zari Kanjivaram Temple Border Saree | Anmol Vastralay',
      metaDescription: 'Traditional Golden Zari Kanjivaram Saree with temple border. Pure silk bridal drape with fast shipping at Anmol Vastralay.',
      imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Mustard Gold', stockQty: 12 },
        { color: 'Magenta Pink', stockQty: 9 },
      ],
    },
    {
      name: 'Pastel Floral Embroidered Georgette Saree',
      slug: 'pastel-floral-embroidered-georgette-saree',
      brand: 'Anmol Rivaaz',
      categorySlug: 'sarees',
      subcategorySlug: 'chiffon-georgette-sarees',
      kind: ProductKind.SAREE,
      netPrice: 2899,
      discountPercent: 10,
      allowsExtraSaya: true,
      extraSayaPrice: 249,
      description: '<p>Lightweight, breezy, and effortlessly glamorous. This <strong>Pastel Georgette Saree</strong> is adorned with delicate tone-on-tone thread embroidery and subtle sequins along the scalloped border.</p><ul><li>Fabric: Premium Viscose Georgette</li><li>Border: Scalloped Cutwork with Sequins</li><li>Occasion: Cocktail Parties, Day Weddings</li><li>Easy to drape and carry all day</li></ul>',
      metaTitle: 'Pastel Floral Embroidered Georgette Saree | Anmol Vastralay',
      metaDescription: 'Lightweight Pastel Floral Embroidered Georgette Saree with scallop border. Perfect for modern festive and party drapes.',
      imageUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Pastel Peach', stockQty: 20 },
        { color: 'Mint Green', stockQty: 14 },
        { color: 'Lavender', stockQty: 16 },
      ],
    },
    {
      name: 'Midnight Blue Handloom Tussar Silk Saree',
      slug: 'midnight-blue-handloom-tussar-silk-saree',
      brand: 'Anmol Heritage',
      categorySlug: 'sarees',
      subcategorySlug: 'banarasi-silk-sarees',
      kind: ProductKind.SAREE,
      netPrice: 4299,
      discountPercent: 12,
      allowsExtraSaya: true,
      extraSayaPrice: 299,
      description: '<p>Experience the natural texture of pure <strong>Tussar Silk</strong> in a regal Midnight Blue tone. Finished with woven antique copper zari borders and an artistic pallu design.</p><ul><li>Fabric: Pure Handloom Tussar Silk</li><li>Texture: Rich natural slub texture</li><li>Occasion: Formal Events, Festivals</li></ul>',
      metaTitle: 'Midnight Blue Handloom Tussar Silk Saree | Anmol Vastralay',
      metaDescription: 'Regal Midnight Blue Tussar Silk Saree with copper zari borders. Handloom elegance for special occasions.',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Midnight Blue', stockQty: 11 },
        { color: 'Wine Burgundy', stockQty: 7 },
      ],
    },
    {
      name: 'Teal Traditional Peacock Motif Kanjivaram Saree',
      slug: 'teal-peacock-motif-kanjivaram-saree',
      brand: 'Anmol Heritage',
      categorySlug: 'sarees',
      subcategorySlug: 'kanjivaram-silk-sarees',
      kind: ProductKind.SAREE,
      netPrice: 8499,
      discountPercent: 18,
      allowsExtraSaya: true,
      extraSayaPrice: 299,
      description: '<p>A classic South Indian masterpiece in dual-tone Teal Blue and Purple. Hand-woven with traditional Mayil (peacock) and floral buttas throughout the body.</p><ul><li>Zari: High-grade tested Zari</li><li>Includes Silk Mark certification</li><li>Blouse: Contrast Brocade Blouse</li></ul>',
      metaTitle: 'Teal Peacock Motif Kanjivaram Saree | Anmol Vastralay',
      metaDescription: 'Dual-tone Teal Peacock Motif Kanjivaram Silk Saree. Heavy brocade pallu with certified silk mark.',
      imageUrl: 'https://images.unsplash.com/photo-1610030469668-93510cb076fb?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Peacock Teal', stockQty: 9 },
        { color: 'Rust Orange', stockQty: 6 },
      ],
    },
    {
      name: 'Rose Gold Shimmer Chiffon Party Saree',
      slug: 'rose-gold-shimmer-chiffon-party-saree',
      brand: 'Anmol Rivaaz',
      categorySlug: 'sarees',
      subcategorySlug: 'chiffon-georgette-sarees',
      kind: ProductKind.SAREE,
      netPrice: 3499,
      discountPercent: 15,
      allowsExtraSaya: true,
      extraSayaPrice: 249,
      description: '<p>Make heads turn with this gorgeous <strong>Rose Gold Shimmer Chiffon Saree</strong>. Woven with metallic micro-shimmer threads and finished with a satin border.</p><ul><li>Fabric: Metallic Lurex Chiffon</li><li>Look: Glamorous & Red Carpet Ready</li><li>Occasion: Receptions, Sangeet, Parties</li></ul>',
      metaTitle: 'Rose Gold Shimmer Chiffon Party Saree | Anmol Vastralay',
      metaDescription: 'Dazzle in Rose Gold Shimmer Chiffon Party Saree. Soft drape with elegant metallic glow at Anmol Vastralay.',
      imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Rose Gold', stockQty: 18 },
        { color: 'Silver Grey', stockQty: 12 },
      ],
    },

    // --- LEHENGAS (Kind: STANDARD, with sizes S, M, L, XL) ---
    {
      name: 'Regal Crimson Velvet Bridal Lehenga Choli',
      slug: 'regal-crimson-velvet-bridal-lehenga-choli',
      brand: 'Anmol Royal Bride',
      categorySlug: 'lehengas',
      subcategorySlug: 'bridal-lehengas',
      kind: ProductKind.STANDARD,
      netPrice: 18999,
      discountPercent: 20,
      allowsExtraSaya: false,
      extraSayaPrice: null,
      description: '<p>Embrace timeless bridal royalty with this hand-crafted <strong>Crimson Velvet Lehenga</strong>. Embellished with heavy zardozi, dori work, cut-dana, and moti embroidery. Includes dual organza dupattas.</p><ul><li>Fabric: Micro Velvet with Can-Can flare</li><li>Embroidery: Zardozi, Resham & Sequins</li><li>Flare: 4.5 Meters royal flair</li><li>Dupatta: Double Dupatta Set</li></ul>',
      metaTitle: 'Crimson Velvet Bridal Lehenga Choli | Anmol Vastralay',
      metaDescription: 'Handcrafted Crimson Velvet Bridal Lehenga Choli with dual dupatta and royal flare. Shop online at Anmol Vastralay.',
      imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Crimson Red', size: 'S', stockQty: 3 },
        { color: 'Crimson Red', size: 'M', stockQty: 5 },
        { color: 'Crimson Red', size: 'L', stockQty: 4 },
        { color: 'Crimson Red', size: 'XL', stockQty: 2 },
        { color: 'Maroon', size: 'M', stockQty: 4 },
        { color: 'Maroon', size: 'L', stockQty: 3 },
      ],
    },
    {
      name: 'Emerald Green Zari Embroidered Bridal Lehenga',
      slug: 'emerald-green-zari-embroidered-bridal-lehenga',
      brand: 'Anmol Royal Bride',
      categorySlug: 'lehengas',
      subcategorySlug: 'bridal-lehengas',
      kind: ProductKind.STANDARD,
      netPrice: 16499,
      discountPercent: 15,
      allowsExtraSaya: false,
      extraSayaPrice: null,
      description: '<p>A majestic <strong>Emerald Green Silk Lehenga</strong> adorned with floral jaal embroidery in antique gold zari and pearls. Perfect for reception and wedding ceremonies.</p><ul><li>Fabric: Pure Silk with Net Dupatta</li><li>Work: Intricate Hand Zari Embroidery</li><li>Semi-stitched lehenga with custom tailoring support</li></ul>',
      metaTitle: 'Emerald Green Bridal Lehenga | Anmol Vastralay',
      metaDescription: 'Royal Emerald Green Silk Bridal Lehenga with antique gold zari embroidery. Available at Anmol Vastralay.',
      imageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Emerald Green', size: 'M', stockQty: 4 },
        { color: 'Emerald Green', size: 'L', stockQty: 5 },
        { color: 'Emerald Green', size: 'XL', stockQty: 3 },
      ],
    },
    {
      name: 'Pastel Pink Floral Resham Party Wear Lehenga',
      slug: 'pastel-pink-floral-resham-party-wear-lehenga',
      brand: 'Anmol Rivaaz',
      categorySlug: 'lehengas',
      subcategorySlug: 'party-wear-lehengas',
      kind: ProductKind.STANDARD,
      netPrice: 8999,
      discountPercent: 10,
      allowsExtraSaya: false,
      extraSayaPrice: null,
      description: '<p>Whimsical and romantic, this <strong>Pastel Pink Lehenga</strong> is detailed with multi-color floral resham threadwork on soft net. Lightweight and comfortable for sangeet and engagement celebrations.</p><ul><li>Fabric: Soft French Net</li><li>Blouse: Heavy Thread Embroidered Silk</li><li>Occasion: Sangeet, Engagement, Bridesmaids</li></ul>',
      metaTitle: 'Pastel Pink Party Wear Lehenga | Anmol Vastralay',
      metaDescription: 'Delicate Pastel Pink Floral Resham Lehenga for sangeet and parties. Lightweight designer collection.',
      imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Blush Pink', size: 'S', stockQty: 6 },
        { color: 'Blush Pink', size: 'M', stockQty: 8 },
        { color: 'Blush Pink', size: 'L', stockQty: 5 },
        { color: 'Powder Blue', size: 'M', stockQty: 4 },
      ],
    },
    {
      name: 'Sapphire Blue Mirror Work Festive Lehenga',
      slug: 'sapphire-blue-mirror-work-festive-lehenga',
      brand: 'Anmol Rivaaz',
      categorySlug: 'lehengas',
      subcategorySlug: 'party-wear-lehengas',
      kind: ProductKind.STANDARD,
      netPrice: 9499,
      discountPercent: 12,
      allowsExtraSaya: false,
      extraSayaPrice: null,
      description: '<p>Shine bright in this dazzling <strong>Sapphire Blue Georgette Lehenga</strong> covered in original foil mirror work and thread embroidery. Creates an enchanting sparkle under party lights.</p><ul><li>Work: Real Mirror Work & Resham Embroidery</li><li>Blouse: Sleeveless Designer Cut</li><li>Dupatta: Net with Mirror Work Scallops</li></ul>',
      metaTitle: 'Sapphire Blue Mirror Work Lehenga | Anmol Vastralay',
      metaDescription: 'Dazzling Sapphire Blue Mirror Work Festive Lehenga. Handcrafted sparkle for wedding parties & festivals.',
      imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Sapphire Blue', size: 'S', stockQty: 4 },
        { color: 'Sapphire Blue', size: 'M', stockQty: 7 },
        { color: 'Sapphire Blue', size: 'L', stockQty: 6 },
      ],
    },
    {
      name: 'Champagne Gold Sequins Net Lehenga',
      slug: 'champagne-gold-sequins-net-lehenga',
      brand: 'Anmol Rivaaz',
      categorySlug: 'lehengas',
      subcategorySlug: 'party-wear-lehengas',
      kind: ProductKind.STANDARD,
      netPrice: 11299,
      discountPercent: 15,
      allowsExtraSaya: false,
      extraSayaPrice: null,
      description: '<p>Understated luxury meets modern glamour. This <strong>Champagne Gold Lehenga</strong> features thousands of micro-sequins woven into an ombré geometric pattern.</p><ul><li>Color: Champagne Gold</li><li>Fabric: Premium Shimmer Net</li><li>Lining: Satin Silk with Cancan</li></ul>',
      metaTitle: 'Champagne Gold Sequins Lehenga | Anmol Vastralay',
      metaDescription: 'Glamorous Champagne Gold Sequins Lehenga for receptions and cocktails. Designer luxury at Anmol Vastralay.',
      imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Champagne Gold', size: 'M', stockQty: 5 },
        { color: 'Champagne Gold', size: 'L', stockQty: 6 },
        { color: 'Champagne Gold', size: 'XL', stockQty: 3 },
      ],
    },
    {
      name: 'Deep Maroon Hand-Embroidered Raw Silk Lehenga',
      slug: 'deep-maroon-hand-embroidered-raw-silk-lehenga',
      brand: 'Anmol Royal Bride',
      categorySlug: 'lehengas',
      subcategorySlug: 'bridal-lehengas',
      kind: ProductKind.STANDARD,
      netPrice: 21999,
      discountPercent: 25,
      allowsExtraSaya: false,
      extraSayaPrice: null,
      description: '<p>The pinnacle of heritage bridal wear. Handcrafted on heavy <strong>Raw Silk</strong> with traditional marodi, dabka, and nakshi needlework passed down through generations of master artisans.</p><ul><li>Fabric: 100% Pure Raw Silk</li><li>Weight: Approx 4.2 kg (Grand Bridal Weight)</li><li>Complete 3-piece designer ensemble</li></ul>',
      metaTitle: 'Deep Maroon Raw Silk Bridal Lehenga | Anmol Vastralay',
      metaDescription: 'Grand Deep Maroon Raw Silk Bridal Lehenga with heritage dabka and marodi embroidery. Shop at Anmol Vastralay.',
      imageUrl: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Deep Maroon', size: 'S', stockQty: 2 },
        { color: 'Deep Maroon', size: 'M', stockQty: 4 },
        { color: 'Deep Maroon', size: 'L', stockQty: 3 },
        { color: 'Deep Maroon', size: 'XL', stockQty: 2 },
      ],
    },

    // --- KURTIS & SUITS (Kind: STANDARD, with sizes S, M, L, XL, XXL) ---
    {
      name: 'Navy Blue Foil Print Anarkali Kurti Set with Dupatta',
      slug: 'navy-blue-anarkali-kurti-set-with-dupatta',
      brand: 'Anmol Libas',
      categorySlug: 'kurtis-suits',
      subcategorySlug: 'anarkali-suit-sets',
      kind: ProductKind.STANDARD,
      netPrice: 2999,
      discountPercent: 15,
      allowsExtraSaya: false,
      extraSayaPrice: null,
      description: '<p>Flattering floor-length <strong>Navy Blue Anarkali Kurti Set</strong> with shimmering gold foil floral motifs. Accompanied by cotton pants and an organza dupatta with gota patti borders.</p><ul><li>Fabric: Rayon Cotton Blend</li><li>Set includes: Kurti, Pants & Dupatta</li><li>Sleeves: 3/4th Sleeves</li></ul>',
      metaTitle: 'Navy Blue Anarkali Kurti Set with Dupatta | Anmol Vastralay',
      metaDescription: 'Flared Navy Blue Anarkali Kurti Set with printed dupatta & pants. Comfortable & festive ethnic wear.',
      imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Navy Blue', size: 'S', stockQty: 10 },
        { color: 'Navy Blue', size: 'M', stockQty: 15 },
        { color: 'Navy Blue', size: 'L', stockQty: 12 },
        { color: 'Navy Blue', size: 'XL', stockQty: 8 },
        { color: 'Navy Blue', size: 'XXL', stockQty: 6 },
        { color: 'Maroon', size: 'M', stockQty: 10 },
        { color: 'Maroon', size: 'L', stockQty: 8 },
      ],
    },
    {
      name: 'Rani Pink Heavy Embroidered Chanderi Suit',
      slug: 'rani-pink-heavy-embroidered-chanderi-suit',
      brand: 'Anmol Libas',
      categorySlug: 'kurtis-suits',
      subcategorySlug: 'anarkali-suit-sets',
      kind: ProductKind.STANDARD,
      netPrice: 3899,
      discountPercent: 20,
      allowsExtraSaya: false,
      extraSayaPrice: null,
      description: '<p>Celebrate festivities in this radiant <strong>Rani Pink Chanderi Silk Suit Set</strong>. The neckline features delicate zari work, complemented by a woven banarasi border dupatta.</p><ul><li>Fabric: Chanderi Silk</li><li>Bottom: Straight Cotton Silk Pants</li><li>Dupatta: Woven Zari Jacquard</li></ul>',
      metaTitle: 'Rani Pink Embroidered Chanderi Suit | Anmol Vastralay',
      metaDescription: 'Festive Rani Pink Chanderi Silk Suit Set with woven zari dupatta. Vibrant traditional fashion.',
      imageUrl: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Rani Pink', size: 'M', stockQty: 8 },
        { color: 'Rani Pink', size: 'L', stockQty: 10 },
        { color: 'Rani Pink', size: 'XL', stockQty: 6 },
      ],
    },
    {
      name: 'Pure Cotton Pastel Floral Straight Kurti Set',
      slug: 'pure-cotton-pastel-floral-straight-kurti-set',
      brand: 'Anmol Daily',
      categorySlug: 'kurtis-suits',
      subcategorySlug: 'straight-cut-kurti-sets',
      kind: ProductKind.STANDARD,
      netPrice: 1599,
      discountPercent: 10,
      allowsExtraSaya: false,
      extraSayaPrice: null,
      description: '<p>The ultimate in everyday comfort and subtle style. Crafted from 100% <strong>Breathable Pure Cotton</strong> with hand block floral prints and matching cropped trousers.</p><ul><li>Fabric: 100% Pure Cambric Cotton</li><li>Style: Straight Fit with Side Slits</li><li>Pockets: Functional right-side pocket</li></ul>',
      metaTitle: 'Pure Cotton Pastel Floral Straight Kurti Set | Anmol Vastralay',
      metaDescription: '100% Cotton Floral Straight Kurti Set with pants. Breathable comfort for daily and office wear.',
      imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Pastel Sage', size: 'S', stockQty: 12 },
        { color: 'Pastel Sage', size: 'M', stockQty: 16 },
        { color: 'Pastel Sage', size: 'L', stockQty: 14 },
        { color: 'Pastel Sage', size: 'XL', stockQty: 8 },
        { color: 'Peach Blossom', size: 'M', stockQty: 10 },
      ],
    },
    {
      name: 'Festive Maroon Velvet Kurti with Organza Dupatta',
      slug: 'festive-maroon-velvet-kurti-organza-dupatta',
      brand: 'Anmol Libas',
      categorySlug: 'kurtis-suits',
      subcategorySlug: 'straight-cut-kurti-sets',
      kind: ProductKind.STANDARD,
      netPrice: 3499,
      discountPercent: 15,
      allowsExtraSaya: false,
      extraSayaPrice: null,
      description: '<p>Exude winter royalty in this plush <strong>Maroon Velvet Kurti Set</strong>. Highlights intricate tilla embroidery along the sleeves and neckline, finished with a sheer organza dupatta.</p><ul><li>Fabric: Super Soft Micro Velvet</li><li>Embellishment: Kashmiri Tilla Work</li><li>Ideal for: Winter Weddings & Receptions</li></ul>',
      metaTitle: 'Maroon Velvet Kurti with Organza Dupatta | Anmol Vastralay',
      metaDescription: 'Plush Maroon Velvet Kurti Set with Kashmiri tilla work and sheer organza dupatta at Anmol Vastralay.',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Maroon', size: 'S', stockQty: 6 },
        { color: 'Maroon', size: 'M', stockQty: 9 },
        { color: 'Maroon', size: 'L', stockQty: 8 },
        { color: 'Maroon', size: 'XL', stockQty: 4 },
      ],
    },
    {
      name: 'Teal Silk Blend Angrakha Style Kurti Set',
      slug: 'teal-silk-blend-angrakha-style-kurti-set',
      brand: 'Anmol Libas',
      categorySlug: 'kurtis-suits',
      subcategorySlug: 'anarkali-suit-sets',
      kind: ProductKind.STANDARD,
      netPrice: 2799,
      discountPercent: 10,
      allowsExtraSaya: false,
      extraSayaPrice: null,
      description: '<p>A classic wrap-style <strong>Angrakha Kurti</strong> in deep Teal Green silk blend. Features playful tassel ties and delicate gota line accents with matching cigarette pants.</p><ul><li>Silhouette: Angrakha Cross-Over with Latkans</li><li>Fabric: Chanderi Silk Blend</li><li>Dupatta: Chiffon with Gota Patti</li></ul>',
      metaTitle: 'Teal Silk Blend Angrakha Kurti Set | Anmol Vastralay',
      metaDescription: 'Chic Teal Silk Blend Angrakha Kurti Set with tassel details and matching pants at Anmol Vastralay.',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Teal Green', size: 'M', stockQty: 11 },
        { color: 'Teal Green', size: 'L', stockQty: 10 },
        { color: 'Teal Green', size: 'XL', stockQty: 7 },
      ],
    },
    {
      name: 'Off-White Lucknowi Chikankari Kurti Set',
      slug: 'off-white-lucknowi-chikankari-kurti-set',
      brand: 'Anmol Heritage',
      categorySlug: 'kurtis-suits',
      subcategorySlug: 'straight-cut-kurti-sets',
      kind: ProductKind.STANDARD,
      netPrice: 2299,
      discountPercent: 12,
      allowsExtraSaya: false,
      extraSayaPrice: null,
      description: '<p>Authentic <strong>Lucknowi Chikankari Embroidery</strong> on pure georgette with an inner slip. Hand-embroidered with bakhiya, phanda, and shadow work stitches.</p><ul><li>Craft: Handcrafted Lucknow Chikankari</li><li>Fabric: Georgette with Cotton Inner</li><li>Includes: Embroidered Kurti & Palazzo</li></ul>',
      metaTitle: 'Off-White Lucknowi Chikankari Kurti Set | Anmol Vastralay',
      metaDescription: 'Authentic Off-White Handcrafted Lucknowi Chikankari Kurti Set with palazzo pants. Pure timeless charm.',
      imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
      variants: [
        { color: 'Off-White', size: 'S', stockQty: 14 },
        { color: 'Off-White', size: 'M', stockQty: 18 },
        { color: 'Off-White', size: 'L', stockQty: 15 },
        { color: 'Off-White', size: 'XL', stockQty: 10 },
      ],
    },
  ];

  let addedCount = 0;

  for (const p of products) {
    const categoryId = categoryMap.get(p.categorySlug);
    const subcategoryId = subcategoryMap.get(p.subcategorySlug);

    if (!categoryId) {
      console.warn(`Category not found for slug: ${p.categorySlug}`);
      continue;
    }

    // Check if product exists by slug
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
      include: { variants: true, images: true },
    });

    if (existing) {
      // Update existing
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: p.name,
          brand: p.brand,
          categoryId,
          subcategoryId: subcategoryId || null,
          kind: p.kind,
          netPrice: p.netPrice,
          discountPercent: p.discountPercent,
          allowsExtraSaya: p.allowsExtraSaya,
          extraSayaPrice: p.extraSayaPrice,
          description: p.description,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          isActive: true,
        },
      });
      console.log(`Updated product: ${p.name}`);
      addedCount++;
      continue;
    }

    // Create new product with images and variants
    const created = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        categoryId,
        subcategoryId: subcategoryId || null,
        kind: p.kind,
        netPrice: p.netPrice,
        discountPercent: p.discountPercent,
        allowsExtraSaya: p.allowsExtraSaya,
        extraSayaPrice: p.extraSayaPrice,
        description: p.description,
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
            size: p.kind === ProductKind.SAREE ? null : (v as any).size || null,
            sizeKey: p.kind === ProductKind.SAREE ? '' : ((v as any).size || '').toUpperCase(),
            stockQty: v.stockQty,
          })),
        },
      },
    });

    console.log(`✓ Created Product: ${created.name} (${created.id})`);
    addedCount++;
  }

  console.log(`--- Finished! Successfully seeded/updated ${addedCount} products across ${categoryDefs.length} categories ---`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
