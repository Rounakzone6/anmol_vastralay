import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Anmol Vastralay. We are here to help you with your orders, returns, and any queries about our ethnic and western clothing collections.',
  keywords: ['contact Anmol Vastralay', 'customer support', 'help center', 'Gopalganj clothing store contact', 'fashion support'],
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
