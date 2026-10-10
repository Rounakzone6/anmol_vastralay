import '@/app/globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/app/providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChatbotWidgetWrapper from '@/components/ChatbotWidgetWrapper';
import { PhonePrompt } from '@/components/PhonePrompt';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
import { fetchPublicTrpc } from '@/lib/server-data';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL, jsonLd, organizationJsonLd } from '@/lib/seo';


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001" || SITE_URL),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: DEFAULT_TITLE,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: '/category-icons/cat_saree_1781796874870.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anmol Vastralay',
    description: 'Premium ethnic wear and modern fashion for everyone.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let categories: { name: string; slug: string }[] = [];
  try {
    const categoriesData = await fetchPublicTrpc<any[]>('category.list', {});
    categories = categoriesData || [];
  } catch (e) {
    console.error('Failed to fetch categories for layout', e);
  }

  return (
    <html lang="en-IN" className={inter.className}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationJsonLd) }}
        />
        <Providers>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer categories={categories} />
          <ChatbotWidgetWrapper />
          <PhonePrompt />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
