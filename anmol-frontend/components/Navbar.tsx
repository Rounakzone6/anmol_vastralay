"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, Search, ShoppingCart, User, Heart } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
    // Yahan aap search page par redirect karne ka logic daal sakte hain
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      {/* Top Banner (Optional: Offers ya Announcement ke liye) */}
      <div className="bg-[#0f172a] py-1.5 text-center text-xs font-medium text-white">
        ✨ अनमोल वस्त्रालय में आपका स्वागत है! Free Delivery on orders above ₹999 ✨
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex flex-col">
              <span className="text-xl font-extrabold tracking-wide text-[#85142b] sm:text-2xl">
                अनमोल वस्त्रालय
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase sm:text-xs">
                Anmol Vastralay
              </span>
            </Link>
          </div>

          {/* Desktop Search Bar (Middle Section) */}
          <form 
            onSubmit={handleSearch} 
            className="hidden max-w-md flex-1 items-center md:flex"
          >
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Saree, Jeans, Kurti, T-shirt khojein..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-4 pr-10 text-sm focus:border-[#85142b] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#85142b]"
              />
              <button 
                type="submit" 
                className="absolute right-3 top-2.5 text-gray-400 hover:text-[#85142b]"
              >
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Right Navigation Icons (Desktop) */}
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/account" className="text-gray-600 hover:text-[#85142b] transition-colors flex flex-col items-center">
              <User size={22} />
              <span className="text-xs mt-0.5 font-medium">Profile</span>
            </Link>
            <Link href="/wishlist" className="text-gray-600 hover:text-[#85142b] transition-colors flex flex-col items-center relative">
              <Heart size={22} />
              <span className="text-xs mt-0.5 font-medium">Wishlist</span>
            </Link>
            <Link href="/cart" className="text-gray-600 hover:text-[#85142b] transition-colors flex flex-col items-center relative">
              <div className="relative">
                <ShoppingCart size={22} />
                {/* Cart Badge - Dummy value 2 set ki hai abhi */}
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#85142b] text-[10px] font-bold text-white">
                  2
                </span>
              </div>
              <span className="text-xs mt-0.5 font-medium">Cart</span>
            </Link>
          </div>

          {/* Mobile Menu & Cart Button (Right Side on Mobile) */}
          <div className="flex items-center gap-4 md:hidden">
            {/* Mobile Search Icon Toggle button agar chahein, ya direct icons */}
            <Link href="/cart" className="relative text-gray-600">
              <ShoppingCart size={24} />
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#85142b] text-[10px] font-bold text-white">
                2
              </span>
            </Link>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-md p-1 text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Search Bar (Only visible on small screens below Navbar) */}
      <div className="px-4 pb-3 md:hidden">
        <form onSubmit={handleSearch} className="relative w-full">
          <input
            type="text"
            placeholder="Saree, Jeans, Kurti khojein..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#85142b]"
          />
          <button type="submit" className="absolute right-3 top-2.5 text-gray-400">
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* Mobile Drawer/Menu links */}
      {isOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 shadow-inner md:hidden">
          <div className="space-y-3 font-medium text-gray-700">
            <Link href="/categories/saree" className="block rounded-lg px-3 py-2 hover:bg-gray-50 hover:text-[#85142b]">Saree Special</Link>
            <Link href="/categories/mens" className="block rounded-lg px-3 py-2 hover:bg-gray-50 hover:text-[#85142b]">Mens Wear (Jeans-Shirt)</Link>
            <Link href="/categories/ladies" className="block rounded-lg px-3 py-2 hover:bg-gray-50 hover:text-[#85142b]">Ladies Wear (Kurti, Frock)</Link>
            <Link href="/categories/kids" className="block rounded-lg px-3 py-2 hover:bg-gray-50 hover:text-[#85142b]">Kids Wear</Link>
            <Link href="/categories/suiting-shirting" className="block rounded-lg px-3 py-2 hover:bg-gray-50 hover:text-[#85142b]">Suiting-Shirting</Link>
            <hr className="border-gray-200" />
            <Link href="/account" className="block rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50">My Account</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;