'use client';

import CategoryNav from '../components/CategoryNav';
import HeroSlider from '../components/HeroSlider';
import LatestArrivals from '../components/LatestArrivals';
import CategorySection from '../components/CategorySection';
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
      <CategorySection title="Premium Sarees" slug="saree" />
      <CategorySection title="Stylish Kurtis" slug="kurti" />
      <CategorySection title="Denim Jeans" slug="jeans" />
      <CategorySection title="Men's Shirts" slug="shirt" />
      <CategorySection title="Kidswear" slug="kids" />
      <CategorySection title="Innerwear Essentials" slug="innerwear" />

      {/* Newsletter Subscription */}
      <Newsletter />
    </div>
  );
}