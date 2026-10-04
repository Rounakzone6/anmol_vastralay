"use client";

import CategoryNav from "@/components/CategoryNav";
import HeroSlider from "@/components/HeroSlider";
import LatestArrivals from "@/components/LatestArrivals";
import CategorySection from "@/components/CategorySection";
import CategoryBanner from "@/components/CategoryBanner";

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Top Categories Navigation */}
      <CategoryNav />
      
      {/* Dynamic Hero Slider */}
      <HeroSlider />

      {/* Latest Products Grid */}
      <LatestArrivals />

      {/* Featured Categories */}
      <CategoryBanner title="Premium Sarees" slug="saree" />
      <CategorySection title="Top Picks for Sarees" slug="saree" />

      <CategoryBanner title="Women's Collection" slug="women" />
      <CategorySection title="Latest in Women's Fashion" slug="women" />

      <CategoryBanner title="Men's Collection" slug="men" />
      <CategorySection title="Trending in Men's Wear" slug="men" />

      <CategoryBanner title="Kidswear" slug="kids" />
      <CategorySection title="Adorable Kids Fashion" slug="kids" />

      <CategoryBanner title="Innerwear Essentials" slug="innerwear" />
      <CategorySection title="Comfortable Innerwear" slug="innerwear" />
    </div>
  );
}
