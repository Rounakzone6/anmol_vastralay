import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ChatbotWidget from '../components/ChatbotWidget';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    template: '%s | Anmol Vastralay',
    default: 'Anmol Vastralay - Premium Ethnic & Western Fashion',
  },
  description: 'Your one-stop destination for premium ethnic wear, western fashion, and authentic traditional clothing in India.',
  keywords: ['Anmol Vastralay', 'ethnic wear', 'sarees', 'kurtis', 'jeans', 'mens shirts', 'fashion', 'Gopalganj clothing store'],
  openGraph: {
    title: 'Anmol Vastralay',
    description: 'Premium ethnic wear and modern fashion for everyone.',
    url: 'https://anmolvastralay.com',
    siteName: 'Anmol Vastralay',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
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
