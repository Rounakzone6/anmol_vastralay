import '@/app/globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/app/providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChatbotWidget from '@/components/ChatbotWidget';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL, jsonLd, organizationJsonLd } from '@/lib/seo';


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || SITE_URL),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: DEFAULT_TITLE,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: '/' },
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
          <Footer />
          <ChatbotWidget />

        </Providers>
      </body>
    </html>
  );
}
