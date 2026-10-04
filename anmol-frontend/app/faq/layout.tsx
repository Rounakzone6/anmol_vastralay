import { pageMetadata, jsonLd, absoluteUrl } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about your orders, returns, and payments at Anmol Vastralay.',
  path: '/faq',
});

const FAQS = [
  {
    q: "How do I track my order?",
    a: "Once your order is shipped, you will receive an email and an SMS with the tracking link. You can also track your order directly from the 'My Orders' section in your Anmol Vastralay profile."
  },
  {
    q: "Can I modify or cancel my order after placing it?",
    a: "You can cancel your order before it has been dispatched from our warehouse, usually within 12 hours of placing the order. Once dispatched, we cannot cancel or modify the order."
  },
  {
    q: "What is your return policy?",
    a: "We offer a hassle-free 7-day return policy for all clothing items. The items must be unused, unwashed, and have all original tags intact. Innerwear is non-returnable due to hygiene reasons."
  },
  {
    q: "How long does it take to get a refund?",
    a: "Once we receive your returned item and it passes our quality check, the refund will be initiated to your original payment method. It typically reflects in your bank account within 5-7 business days."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major Credit/Debit Cards, UPI (Google Pay, PhonePe, Paytm), Net Banking, and Cash on Delivery (COD) for eligible pin codes."
  },
  {
    q: "Is it safe to use my credit/debit card on your website?",
    a: "Absolutely. We use industry-standard encryption protocols to ensure your payment information is 100% secure. We do not store your card details."
  }
];

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a
      }
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd) }} />
      {children}
    </>
  );
}
