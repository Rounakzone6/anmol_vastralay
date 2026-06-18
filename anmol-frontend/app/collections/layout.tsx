import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Collections',
  description: 'Explore the complete collection of Anmol Vastralay. Shop premium ethnic wear, designer sarees, trendy kurtis, stylish menswear, and adorable kidswear.',
  keywords: ['shop ethnic wear', 'buy sarees online', 'designer kurtis', 'mens fashion', 'kids clothing', 'Anmol Vastralay collection'],
};

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
