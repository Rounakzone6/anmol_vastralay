'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  {
    category: "Orders & Tracking",
    questions: [
      {
        q: "How do I track my order?",
        a: "Once your order is shipped, you will receive an email and an SMS with the tracking link. You can also track your order directly from the 'My Orders' section in your Anmol Vastralay profile."
      },
      {
        q: "Can I modify or cancel my order after placing it?",
        a: "You can cancel your order before it has been dispatched from our warehouse, usually within 12 hours of placing the order. Once dispatched, we cannot cancel or modify the order."
      }
    ]
  },
  {
    category: "Returns & Refunds",
    questions: [
      {
        q: "What is your return policy?",
        a: "We offer a hassle-free 7-day return policy for all clothing items. The items must be unused, unwashed, and have all original tags intact. Innerwear is non-returnable due to hygiene reasons."
      },
      {
        q: "How long does it take to get a refund?",
        a: "Once we receive your returned item and it passes our quality check, the refund will be initiated to your original payment method. It typically reflects in your bank account within 5-7 business days."
      }
    ]
  },
  {
    category: "Payments",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major Credit/Debit Cards, UPI (Google Pay, PhonePe, Paytm), Net Banking, and Cash on Delivery (COD) for eligible pin codes."
      },
      {
        q: "Is it safe to use my credit/debit card on your website?",
        a: "Absolutely. We use industry-standard encryption protocols to ensure your payment information is 100% secure. We do not store your card details."
      }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>("0-0"); // Default open first question

  const toggleQuestion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Frequently Asked Questions</h1>
          <p className="mt-4 text-lg text-gray-600">
            Find answers to common questions about your orders, returns, and more.
          </p>
        </div>

        <div className="space-y-8">
          {FAQS.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-100/50 px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">{section.category}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {section.questions.map((faq, faqIndex) => {
                  const id = `${sectionIndex}-${faqIndex}`;
                  const isOpen = openIndex === id;
                  return (
                    <div key={faqIndex} className="bg-white">
                      <button
                        onClick={() => toggleQuestion(id)}
                        className="w-full flex justify-between items-center px-6 py-5 text-left focus:outline-none focus-visible:bg-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-800">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-[#85142b] flex-shrink-0 ml-4" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-5">
                          <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Still have questions? <a href="/contact" className="text-[#85142b] font-semibold hover:underline">Contact our support team</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
