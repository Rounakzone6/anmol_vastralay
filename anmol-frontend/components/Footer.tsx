'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & Description */}
          <div className="md:col-span-1">
            <Link href="/" className="flex flex-col mb-4">
              <span className="text-xl font-extrabold tracking-wide text-[#85142b]">
                अनमोल वस्त्रालय
              </span>
              <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                Anmol Vastralay
              </span>
            </Link>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Your one-stop destination for premium ethnic wear, western fashion, and authentic traditional clothing. Elevating your style since our establishment.
            </p>
            <div className="flex space-x-3 mt-6">
              <Link href="https://www.facebook.com/share/18k6EaEqDK/" title="Facebook" className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors shadow-sm">
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"></path></svg>
              </Link>
              <Link href="https://www.instagram.com/anmol_vastralay" title="Instagram" className="w-9 h-9 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors shadow-sm">
                <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
              </Link>
              <Link href="www.youtube.com/@anmol_vastralay" title="YouTube" className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors shadow-sm">
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"></path></svg>
              </Link>
              <Link href="https://whatsapp.com/channel/0029VbDLLFE2phHSq6l5rZ0T" title="WhatsApp" className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-colors shadow-sm">
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path></svg>
              </Link>
            </div>
          </div>
          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-sm text-gray-600 hover:text-[#85142b]">Home</Link></li>
              <li><Link href="/collections" className="text-sm text-gray-600 hover:text-[#85142b]">All Collections</Link></li>
              <li><Link href="/about" className="text-sm text-gray-600 hover:text-[#85142b]">About Us</Link></li>
              <li><Link href="/profile" className="text-sm text-gray-600 hover:text-[#85142b]">My Account</Link></li>
              <li><Link href="/cart" className="text-sm text-gray-600 hover:text-[#85142b]">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Customer Service
            </h3>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-sm text-gray-600 hover:text-[#85142b]">Contact Us</Link></li>
              <li><Link href="/faq" className="text-sm text-gray-600 hover:text-[#85142b]">FAQ</Link></li>
              <li><Link href="/shipping" className="text-sm text-gray-600 hover:text-[#85142b]">Shipping & Returns</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-600 hover:text-[#85142b]">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-600 hover:text-[#85142b]">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Contact Us
            </h3>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start">
                <MapPin size={18} className="text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                <a href="https://maps.app.goo.gl/tUUPyM5xRY3Qnpx57" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-[#85142b] transition-colors">
                  Baliwan Sagar, Kuchaikote, Gopalganj, Bihar, India (841501)
                </a>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="text-gray-400 mr-2 flex-shrink-0" />
                <a href="tel:+919102171696" className="text-sm text-gray-600 hover:text-[#85142b] transition-colors">+91 9102171696</a>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="text-gray-400 mr-2 flex-shrink-0" />
                <a href="mailto:anmolvastralayofficial@gmail.com" className="text-sm text-gray-600 hover:text-[#85142b] transition-colors">anmolvastralayofficial@gmail.com</a>
              </li>
            </ul>
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm h-36 relative">
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

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 text-center md:text-left mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Anmol Vastralay. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-2 mt-4 md:mt-0">
            <span className="px-2 py-1.5 bg-white rounded-md shadow-sm border border-gray-200 flex items-center h-[26px]">
              <Image src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" width={32} height={12} className="object-contain" />
            </span>
            <span className="px-2.5 py-1.5 bg-white text-blue-800 text-[11px] font-extrabold italic rounded-md shadow-sm border border-gray-200">
              VISA
            </span>
            <span className="px-2.5 py-1.5 bg-white text-gray-700 text-[11px] font-bold rounded-md shadow-sm border border-gray-200 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-0.5 opacity-90"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 -ml-1.5 mix-blend-multiply mr-1 opacity-90"></span>
              MasterCard
            </span>
            <span className="px-2.5 py-1.5 bg-white text-[#F26522] text-[11px] font-bold rounded-md shadow-sm border border-gray-200">
              RuPay
            </span>
            <span className="px-2.5 py-1.5 bg-white text-gray-800 text-[11px] font-bold rounded-md shadow-sm border border-gray-200">
              Cash on Delivery
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
