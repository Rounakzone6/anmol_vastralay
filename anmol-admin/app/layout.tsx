import type { Metadata } from 'next';
import '@/app/globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'Anmol Admin',
  description: 'Staff panel for Anmol Vastralay',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-100 text-zinc-900 antialiased">
        <Providers>{children}</Providers>
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
