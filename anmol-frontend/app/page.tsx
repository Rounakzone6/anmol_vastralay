'use client';

import CategoryNav from '../components/CategoryNav';
import HeroSlider from '../components/HeroSlider';
import LatestArrivals from '../components/LatestArrivals';
import CategorySection from '../components/CategorySection';
import CategoryBanner from '../components/CategoryBanner';
import Newsletter from '../components/Newsletter';

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

      <CategoryBanner title="Stylish Kurtis" slug="kurti" />
      <CategorySection title="Latest in Kurtis" slug="kurti" />

      <CategoryBanner title="Denim Jeans" slug="jeans" />
      <CategorySection title="Trending Jeans" slug="jeans" />

      <CategoryBanner title="Men's Shirts" slug="shirt" />
      <CategorySection title="Bestselling Shirts" slug="shirt" />

      <CategoryBanner title="Kidswear" slug="kids" />
      <CategorySection title="Adorable Kids Fashion" slug="kids" />

      <CategoryBanner title="Innerwear Essentials" slug="innerwear" />
      <CategorySection title="Comfortable Innerwear" slug="innerwear" />

      {/* Newsletter Subscription */}
      <Newsletter />
    </div>
  );
}