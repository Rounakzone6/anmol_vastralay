'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Sparkles, Heart } from 'lucide-react';

export default function Footer({ categories = [] }: { categories?: { name: string; slug: string }[] }) {
  return (
    <footer className="bg-[#14060d] text-[#e6ded2] border-t border-[#c59b27]/30 mt-16 pt-16 pb-10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          
          {/* Brand & Description (2 Cols on LG) */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3.5 group mb-5">
              <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden shadow-md border-2 border-[#c59b27]/50 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Anmol Vastralay Logo"
                  fill
                  sizes="48px"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif-luxury text-2xl font-bold tracking-tight text-[#f3dfa2] group-hover:text-white transition-colors leading-none">
                  अनमोल वस्त्रालय
                </span>
                <span className="text-[11px] font-bold tracking-widest text-[#c59b27] uppercase mt-1">
                  Anmol Vastralay • Royal Indian Heritage
                </span>
              </div>
            </Link>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed max-w-md font-light">
              Your premier destination for authentic Banarasi silk sarees, handcrafted bridal lehengas, and contemporary festive ethnic wear. Dedicated to preserving the majesty of Indian handlooms.
            </p>

            {/* Social Links */}
            <div className="flex space-x-3 mt-6">
              <a
                href="https://www.facebook.com/share/18k6EaEqDK/"
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-[#85142b] hover:text-white transition-all shadow-sm border border-white/15"
              >
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"></path></svg>
              </a>
              <a
                href="https://www.instagram.com/anmol_vastralay"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-[#85142b] hover:text-white transition-all shadow-sm border border-white/15"
              >
                <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
              </a>
              <a
                href="https://www.youtube.com/@anmol_vastralay"
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube"
                className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-[#85142b] hover:text-white transition-all shadow-sm border border-white/15"
              >
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"></path></svg>
              </a>
              <a
                href="https://whatsapp.com/channel/0029VbDLLFE2phHSq6l5rZ0T"
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-emerald-700 hover:text-white transition-all shadow-sm border border-white/15"
              >
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-[#f3dfa2] tracking-widest uppercase mb-4 border-b border-[#c59b27]/30 pb-2">
              Collections
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/collections/sarees" className="hover:text-[#f3dfa2] transition-colors">Banarasi & Silk Sarees</Link></li>
              <li><Link href="/collections/lehengas" className="hover:text-[#f3dfa2] transition-colors">Bridal & Party Lehengas</Link></li>
              <li><Link href="/collections/kurtis-suits" className="hover:text-[#f3dfa2] transition-colors">Designer Kurtis & Suits</Link></li>
              <li><Link href="/collections" className="hover:text-[#f3dfa2] transition-colors">All Ethnic Wear</Link></li>
              <li><Link href="/about" className="hover:text-[#f3dfa2] transition-colors">Our Weaver Heritage</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-xs font-bold text-[#f3dfa2] tracking-widest uppercase mb-4 border-b border-[#c59b27]/30 pb-2">
              Customer Care
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/contact" className="hover:text-[#f3dfa2] transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-[#f3dfa2] transition-colors">Frequently Asked Questions</Link></li>
              <li><Link href="/shipping" className="hover:text-[#f3dfa2] transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="/privacy" className="hover:text-[#f3dfa2] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#f3dfa2] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Boutique Location & Store */}
          <div>
            <h3 className="text-xs font-bold text-[#f3dfa2] tracking-widest uppercase mb-4 border-b border-[#c59b27]/30 pb-2">
              Boutique Location
            </h3>
            <ul className="space-y-3 mb-4 text-xs text-gray-300">
              <li className="flex items-start">
                <MapPin size={16} className="text-[#c59b27] mr-2 flex-shrink-0 mt-0.5" />
                <a href="https://maps.app.goo.gl/tUUPyM5xRY3Qnpx57" target="_blank" rel="noopener noreferrer" className="hover:text-[#f3dfa2] transition-colors">
                  Baliwan Sagar, Kuchaikote, Gopalganj, Bihar, India (841501)
                </a>
              </li>
              <li className="flex items-center">
                <Phone size={16} className="text-[#c59b27] mr-2 flex-shrink-0" />
                <a href="tel:+919102171696" className="hover:text-[#f3dfa2] transition-colors">+91 9102171696</a>
              </li>
              <li className="flex items-center">
                <Mail size={16} className="text-[#c59b27] mr-2 flex-shrink-0" />
                <a href="mailto:anmolvastralayofficial@gmail.com" className="hover:text-[#f3dfa2] transition-colors truncate">anmolvastralayofficial@gmail.com</a>
              </li>
            </ul>

            <div className="rounded-xl overflow-hidden border border-[#c59b27]/40 shadow-md h-28 relative">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1177.362648294691!2d84.35432671065797!3d26.570027455783773!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39930f9ccc54e2cb%3A0xc20c683f322f2fae!2sAnmol%20vastralay!5e1!3m2!1sen!2sin!4v1781933271824!5m2!1sen!2sin" 
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#c59b27]/20 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
          <p className="text-center md:text-left mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Anmol Vastralay. Handcrafted with reverence for Indian Handlooms. All rights reserved.
          </p>

          {/* Secure Payment Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-2.5 py-1 bg-white/10 rounded-md border border-white/15 text-white font-mono text-[10px]">
              100% SECURE CHECKOUT
            </span>
            <span className="px-2.5 py-1 bg-white/10 rounded-md border border-white/15 text-[#f3dfa2] text-[10px] font-bold">
              UPI • CARDS • COD
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
