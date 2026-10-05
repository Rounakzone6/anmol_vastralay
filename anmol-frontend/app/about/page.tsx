import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock3, MapPin, Phone, ShieldCheck, Truck } from 'lucide-react';
import { pageMetadata, jsonLd, absoluteUrl } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About Us',
  description: 'Discover Anmol Vastralay, a family clothing store in Baliwan Sagar, Kuchaikote, Gopalganj, Bihar.',
  path: '/about',
});

const owners = [
  { name: 'Dilip Prasad Gupta', number: '9955508473' },
  { name: 'Roushan Gupta', number: '9102171696' },
  { name: 'Rounak Gupta', number: '7667991277' },
];

const galleryImages = [
  { src: '/banners/banner_women.png', alt: 'Women clothing collection placeholder' },
  { src: '/banners/banner_saree.png', alt: 'Saree collection placeholder' },
  { src: '/banners/banner_men.png', alt: 'Men clothing collection placeholder' },
  { src: '/banners/banner_kids.png', alt: 'Kids clothing collection placeholder' },
  { src: '/banners/banner_innerwear.png', alt: 'Clothing shelves placeholder' },
];

const collections = [
  'Sarees and traditional wear',
  'Lehengas, kurtis, and suits',
  'Shirts, jeans, and western wear',
  'Kids wear and inner wear',
  'Winter wear, suiting, and shirting',
];

export default function AboutPage() {
  const aboutPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    url: absoluteUrl('/about'),
    name: 'About Anmol Vastralay',
    description: 'Anmol Vastralay offers ethnic wear, western fashion, fabrics, and everyday clothing.',
    mainEntity: {
      '@type': 'ClothingStore',
      name: 'Anmol Vastralay',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Baliwan Sagar, Kuchaikote',
        addressLocality: 'Gopalganj',
        addressRegion: 'Bihar',
        postalCode: '841501',
        addressCountry: 'IN',
      },
      telephone: owners.map(({ number }) => `+91-${number}`),
    },
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(aboutPageJsonLd) }} />

      <section className="bg-[#35131d] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-24">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#f3bd9d]">Our store</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-6xl">
              Style for every occasion, close to home.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
              Anmol Vastralay brings together trusted fabrics, timeless ethnic wear, and modern clothing for the whole family.
            </p>
            <Link
              href="/collections"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-[#85142b] transition-colors hover:bg-[#f7e8e4]"
            >
              Explore collections <ArrowRight size={18} />
            </Link>
          </div>
          <div className="relative h-[300px] overflow-hidden rounded-3xl border border-white/15 shadow-2xl sm:h-[400px]">
            <Image
              src={galleryImages[0].src}
              alt="Anmol Vastralay store image placeholder"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-gray-900">
              Store photo placeholder
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-20 px-4 pt-16 sm:px-6 lg:px-8">
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#85142b]">A look inside</p>
              <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Our shop and collections</h2>
            </div>
            <p className="hidden max-w-sm text-right text-sm leading-relaxed text-gray-500 sm:block">
              These are temporary images and can be replaced with your real shop photographs later.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {galleryImages.map((image, index) => (
              <div
                key={image.src}
                className={`relative overflow-hidden rounded-2xl bg-gray-200 ${index === 0 ? 'col-span-2 row-span-2 min-h-[360px] md:min-h-[440px]' : 'min-h-[170px] md:min-h-[210px]'}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  sizes={index === 0 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                <span className="absolute bottom-3 left-3 text-xs font-semibold text-white">
                  {index === 0 ? 'Main shop placeholder' : `Shop view ${index + 1}`}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#85142b]">Who we are</p>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">A family store built on trust</h2>
          </div>
          <div className="space-y-4 text-lg leading-relaxed text-gray-600">
            <p>
              Anmol Vastralay is a family-run clothing store serving customers in and around Baliwan Sagar, Kuchaikote, and Gopalganj.
            </p>
            <p>
              Our team helps customers find comfortable everyday clothing, elegant festive outfits, quality fabrics, and practical styles for every age group.
            </p>
            <p>
              We believe good service means honest guidance, dependable products, and making every visit or order feel simple.
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-gray-100 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#85142b]">What we offer</p>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Something for everyone</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {collections.map((collection) => (
                <li key={collection} className="flex items-start gap-3 text-gray-600">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#85142b]" />
                  {collection}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-[#f2e5df] p-7 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#85142b]">Our promise</p>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Helpful service, carefully packed</h2>
            <p className="mt-5 leading-relaxed text-gray-600">
              Whether you shop in person or order online, we take care to help you choose the right product and prepare it carefully for delivery.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/70 p-4">
                <ShieldCheck className="text-[#85142b]" size={22} />
                <p className="mt-3 text-xs font-bold text-gray-800">Quality focus</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <Truck className="text-[#85142b]" size={22} />
                <p className="mt-3 text-xs font-bold text-gray-800">Delivery support</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <Clock3 className="text-[#85142b]" size={22} />
                <p className="mt-3 text-xs font-bold text-gray-800">Order help</p>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative overflow-hidden bg-[#35131d] p-7 text-white sm:p-10">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[24px] border-white/5" />
              <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full border-[28px] border-white/5" />
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#f3bd9d]">Find us</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Visit our store</h2>
                <p className="mt-4 max-w-md leading-relaxed text-white/70">
                  Come in, explore our collections, and let our team help you find the right style.
                </p>

                <div className="mt-8 flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#f3bd9d]">
                    <MapPin size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white/60">Store address</p>
                    <p className="mt-1 text-lg font-semibold leading-relaxed">
                      Baliwan Sagar, Kuchaikote,<br />
                      Gopalganj, Bihar (841501)
                    </p>
                  </div>
                </div>

                <a
                  href="https://maps.app.goo.gl/tUUPyM5xRY3Qnpx57"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#85142b] transition-colors hover:bg-[#f7e8e4]"
                >
                  Open location <ArrowRight size={16} />
                </a>
              </div>
            </div>

            <div className="p-7 sm:p-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#85142b]">Talk to us</p>
                  <h3 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">Our owners</h3>
                </div>
                <span className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-[#f7e8e4] text-[#85142b] sm:flex">
                  <Phone size={20} />
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Call any of our owners for product, order, or delivery support.
              </p>

              <div className="mt-7 space-y-3">
                {owners.map(({ name, number }, index) => (
                  <a
                    key={number}
                    href={`tel:+91${number}`}
                    className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-[#faf9f7] p-4 transition-all hover:border-[#e7b9a9] hover:bg-[#fff7f4]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#85142b] shadow-sm">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-gray-900 group-hover:text-[#85142b]">{name}</span>
                      <span className="mt-1 block text-sm font-semibold text-[#85142b]">+91 {number}</span>
                    </span>
                    <Phone size={18} className="shrink-0 text-gray-400 transition-colors group-hover:text-[#85142b]" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
