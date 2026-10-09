"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Search, ShoppingCart, Heart, LogOut, User, MapPin, Package, ChevronDown, Shield, Home, Grid } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { trpc } from "@/lib/trpc";

const ProfileAvatar = ({ size = 36, profileImg, displayName, initials }: { size?: number, profileImg?: string | null, displayName: string, initials: string }) => (
  profileImg ? (
    <Image
      src={profileImg}
      alt={displayName}
      width={size}
      height={size}
      className="rounded-full object-cover border-2 border-[#85142b]/20"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full bg-gradient-to-br from-[#85142b] to-[#b01e3f] flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  )
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated, user, logout } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch user data from `me` endpoint to keep in sync
  const { data: meData } = trpc.auth.me.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: cartData } = trpc.cart.getCart.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const cartItems = (cartData?.items || []) as { quantity: number }[];
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  // Get display name and initials
  const displayName = meData?.name || user?.name || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const profileImg = meData?.profileImage || user?.profileImage;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      {/* Top Banner */}
      <div className="h-2 bg-[#091827]" />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Logo Section */}
          <div className="shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md">
                <Image
                  src="/logo.png"
                  alt="Anmol Vastralay Logo"
                  fill
                  sizes="48px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-wide text-[#85142b] sm:text-2xl group-hover:text-[#b01e3f] transition-colors">
                  अनमोल वस्त्रालय
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase sm:text-xs">
                  Anmol Vastralay
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-6 mx-4 font-medium text-sm text-gray-700">
            <Link href="/" className="hover:text-[#85142b] transition-colors">Home</Link>
            <Link href="/collections" className="hover:text-[#85142b] transition-colors">Collections</Link>
            <Link href="/about" className="hover:text-[#85142b] transition-colors">About</Link>
          </div>

          {/* Desktop Search Bar */}
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
          <div className="hidden items-center gap-5 md:flex">
            {isClient && isAuthenticated ? (
              <>
                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-gray-50 transition-colors"
                  >
                    <ProfileAvatar size={34} profileImg={profileImg} displayName={displayName} initials={initials} />
                    <span className="text-xs font-semibold text-gray-700 max-w-[80px] truncate hidden lg:block">
                      {displayName.split(" ")[0]}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                      {/* User Info Header */}
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="font-semibold text-sm text-gray-900 truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {meData?.email || user?.email || meData?.phone || user?.phone || ""}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User size={16} className="text-gray-400" />
                          My Profile
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Package size={16} className="text-gray-400" />
                          My Orders
                        </Link>
                        <Link
                          href="/profile?tab=addresses"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <MapPin size={16} className="text-gray-400" />
                          My Addresses
                        </Link>
                        <Link
                          href="/profile?tab=security"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Shield size={16} className="text-gray-400" />
                          Security
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={() => { setShowProfileDropdown(false); logout(); }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/login" className="text-gray-600 hover:text-[#85142b] transition-colors flex flex-col items-center">
                <User size={22} />
                <span className="text-xs mt-0.5 font-medium">Login</span>
              </Link>
            )}

            <Link href="/wishlist" className="text-gray-600 hover:text-[#85142b] transition-colors flex flex-col items-center relative">
              <Heart size={22} />
              <span className="text-xs mt-0.5 font-medium">Wishlist</span>
            </Link>
            <Link href="/cart" className="text-gray-600 hover:text-[#85142b] transition-colors flex flex-col items-center relative">
              <div className="relative">
                <ShoppingCart size={22} />
                {isClient && cartItemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#85142b] text-[10px] font-bold text-white">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-0.5 font-medium">Cart</span>
            </Link>
          </div>

          {/* Mobile Profile Icon (Top Right) */}
          <div className="flex items-center gap-4 md:hidden">
            {isClient && isAuthenticated ? (
              <Link href="/profile" className="text-gray-600">
                <ProfileAvatar size={34} profileImg={profileImg} displayName={displayName} initials={initials} />
              </Link>
            ) : (
              <Link href="/login" className="text-gray-600">
                <User size={24} />
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Search Bar */}
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

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link href="/" onClick={() => setIsOpen(false)} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-[#85142b]">
            <Home size={22} />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
          <Link href="/collections" onClick={() => setIsOpen(false)} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-[#85142b]">
            <Grid size={22} />
            <span className="text-[10px] font-semibold">Shop</span>
          </Link>
          <Link href="/wishlist" onClick={() => setIsOpen(false)} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-[#85142b]">
            <Heart size={22} />
            <span className="text-[10px] font-semibold">Wishlist</span>
          </Link>
          <Link href="/cart" onClick={() => setIsOpen(false)} className="relative flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-[#85142b]">
            <div className="relative">
              <ShoppingCart size={22} />
              {isClient && cartItemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#85142b] text-[10px] font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Cart</span>
          </Link>
          <button onClick={() => setIsOpen(!isOpen)} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isOpen ? 'text-[#85142b]' : 'text-gray-500 hover:text-[#85142b]'}`}>
            <Menu size={22} className={isOpen ? "scale-110 transition-transform" : ""} />
            <span className="text-[10px] font-semibold">Menu</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Sheet Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Bottom Sheet Menu */}
      <div className={`fixed inset-x-0 bottom-[64px] z-50 max-h-[80vh] rounded-t-3xl bg-white shadow-[0_-20px_40px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-out md:hidden flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setIsOpen(false)}>
           <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>
        <div className="overflow-y-auto px-4 pb-6">
          <div className="space-y-2 mt-2">
            <Link href="/" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 hover:text-[#85142b]">Home</Link>
            <Link href="/collections" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 hover:text-[#85142b]">Collections</Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 hover:text-[#85142b]">About Us</Link>
            <hr className="border-gray-100 my-2" />
            {isClient && isAuthenticated ? (
              <>
                <Link href="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-gray-700 hover:bg-gray-50">
                  <User size={18} className="text-gray-400" /> My Profile
                </Link>
                <Link href="/orders" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-gray-700 hover:bg-gray-50">
                  <Package size={18} className="text-gray-400" /> My Orders
                </Link>
                <Link href="/profile?tab=addresses" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-gray-700 hover:bg-gray-50">
                  <MapPin size={18} className="text-gray-400" /> My Addresses
                </Link>
                <button onClick={() => { setIsOpen(false); logout(); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium text-red-600 hover:bg-red-50 text-left">
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-gray-700 hover:bg-gray-50">
                <User size={18} className="text-gray-400" /> Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;