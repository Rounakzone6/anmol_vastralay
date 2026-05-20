import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

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
      </body>
    </html>
  );
}
