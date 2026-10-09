import { notFound, redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
import { fetchPublicTrpc } from '@/lib/server-data';
import { absoluteUrl, jsonLd, pageMetadata } from '@/lib/seo';

const ProductDetailsClient = dynamic(() => import('./ProductDetailsClient'));

type Product = {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  netPrice: number | string;
  discountPercent?: number | string;
  images?: { url: string }[];
  category?: { name: string; slug: string } | null;
  subcategory?: { name: string; slug: string } | null;
  sku?: string | null;
  averageRating?: number;
  reviewCount?: number;
  reviews?: any[];
  variants?: any[];
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchPublicTrpc<Product>('product.getBySlug', { slug });
  if (!product) return { title: 'Product not found', robots: { index: false, follow: false } };
  const desc = product.metaDescription || product.description || `Shop ${product.name} from Anmol Vastralay. Explore quality fashion with delivery across India.`;
  const truncatedDesc = desc.length > 160 ? desc.substring(0, 157) + '...' : desc;

  return pageMetadata({
    title: product.metaTitle || `${product.name}${product.brand ? ` by ${product.brand}` : ''}`,
    description: truncatedDesc,
    path: `/product/${product.slug}`,
    image: product.images?.[0]?.url,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchPublicTrpc<Product>('product.getBySlug', { slug });
  if (!product) notFound();

  if (product.slug && slug !== product.slug) {
    redirect(`/product/${product.slug}`);
  }

  const price = Number(product.netPrice);
  const color = product.variants?.map(v => v.color).filter(Boolean)[0];
  const size = product.variants?.map(v => v.size).filter(Boolean)[0];
  const inStock = product.variants ? product.variants.some(v => v.stockQty > 0) : true;
  
  const productJsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    url: absoluteUrl(`/product/${product.slug}`),
    image: product.images?.map((image) => absoluteUrl(image.url)),
    sku: product.sku || product.id,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    color: color || undefined,
    size: size || undefined,
    category: product.subcategory?.name || product.category?.name || undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      url: absoluteUrl(`/product/${product.slug}`),
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail'
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: price > 999 ? 0 : 50,
          currency: 'INR'
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN'
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 2, unitCode: 'd' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 7, unitCode: 'd' }
        }
      }
    },
  };

  if (product.reviewCount && product.averageRating) {
    productJsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount,
    };
    if (product.reviews && product.reviews.length > 0) {
      productJsonLd.review = product.reviews.map((r: any) => ({
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: r.rating },
        author: { '@type': 'Person', name: r.userName || 'Anonymous' },
        reviewBody: r.comment
      }));
    }
  }

  const breadcrumbs = [
    { name: 'Home', item: '/' },
  ];
  if (product.category) breadcrumbs.push({ name: product.category.name, item: `/collections/${product.category.slug}` });
  if (product.category && product.subcategory) breadcrumbs.push({ name: product.subcategory.name, item: `/collections/${product.category.slug}/${product.subcategory.slug}` });
  breadcrumbs.push({ name: product.name, item: `/product/${product.slug}` });

  let reviewStats: any = null;
  let suggestedProducts: any[] = [];
  try {
    reviewStats = await fetchPublicTrpc('review.stats', { productId: product.id });
    suggestedProducts = await fetchPublicTrpc('product.getRecommendations', { id: product.id });
  } catch (e) {
    console.error('Failed to fetch initial stats or related products', e);
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: absoluteUrl(crumb.item),
        })),
      }) }} />
        <ProductDetailsClient 
          initialProduct={product}
          initialReviewStats={reviewStats}
          initialSuggestedProducts={suggestedProducts} 
        />
    </>
  );
}
