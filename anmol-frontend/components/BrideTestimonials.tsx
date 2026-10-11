'use client';

import { Star, Quote, CheckCircle2 } from 'lucide-react';

export default function BrideTestimonials() {
  const reviews = [
    {
      name: 'Pooja Srivastava',
      city: 'Patna, Bihar',
      occasion: 'Bridal Saree',
      rating: 5,
      review:
        'The Royal Crimson Banarasi Zari Silk saree I ordered exceeded all my expectations! The gold zari work is so delicate and pure. Everyone at the reception was asking where I bought it.',
      date: 'Verified Buyer • October 2026',
    },
    {
      name: 'Ananya Sharma',
      city: 'Varanasi, UP',
      occasion: 'Festive Lehenga',
      rating: 5,
      review:
        'Ordering bridal wear online always felt risky until I shopped with Anmol Vastralay. The fabric weight, velvet borders, and packaging were pure luxury. 10/10 recommend!',
      date: 'Verified Buyer • September 2026',
    },
    {
      name: 'Dr. Meera Pandey',
      city: 'Gopalganj, Bihar',
      occasion: 'Silk Anarkali Set',
      rating: 5,
      review:
        'Exceptional customer support on WhatsApp and the AI stylist helped me pick the right size. Received my order within 3 days. Proud to support authentic weavers!',
      date: 'Verified Buyer • October 2026',
    },
  ];

  return (
    <section className="bg-[#faf7f2] py-16 sm:py-24 border-t border-[#e8dfd2]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#85142b]/10 text-[#85142b] text-[11px] font-bold tracking-widest uppercase mb-3">
            Real Celebrations • Real Stories
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-5xl font-bold text-[#1c1417]">
            Loved by Brides & Families
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2 font-light">
            Read authentic reviews from patrons who celebrated their most precious milestones with us.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {reviews.map((rev, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-7 sm:p-8 border border-[#e8ded1] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <Quote size={28} className="text-[#85142b]/15 group-hover:text-[#85142b]/30 transition-colors" />
                </div>

                <p className="font-serif-luxury text-base sm:text-lg text-gray-800 italic leading-relaxed mb-6">
                  "{rev.review}"
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#1c1417] flex items-center gap-1.5">
                    {rev.name}
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  </h4>
                  <p className="text-xs text-gray-500">{rev.city} • <span className="text-[#85142b] font-semibold">{rev.occasion}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
