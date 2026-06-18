import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CategoryBannerProps {
  title: string;
  slug: string;
}

export default function CategoryBanner({ title, slug }: CategoryBannerProps) {
  const getBannerDetails = () => {
    switch (slug) {
      case 'saree':
        return {
          bgImage: '/banners/banner_saree.png',
          gradient: 'bg-black/30',
          titleColor: 'text-white',
          subtitle: 'Elegance woven into every thread.',
          floatingImage: null
        };
      case 'women':
        return {
          bgImage: '/banners/banner_women.png',
          gradient: 'bg-black/30',
          titleColor: 'text-white',
          subtitle: 'Vibrant, chic, and ready for any occasion.',
          floatingImage: null
        };
      case 'men':
        return {
          bgImage: '/banners/banner_men.png',
          gradient: 'bg-black/30',
          titleColor: 'text-white',
          subtitle: 'Crisp, professional, and stylish.',
          floatingImage: null
        };
      case 'kids':
        return {
          bgImage: '/banners/banner_kids.png',
          gradient: 'bg-black/30',
          titleColor: 'text-white',
          subtitle: 'Playful, colorful, and energetic.',
          floatingImage: null
        };
      case 'innerwear':
        return {
          bgImage: '/banners/banner_innerwear.png',
          gradient: 'bg-black/30',
          titleColor: 'text-white',
          subtitle: 'Everyday comfort, elevated.',
          floatingImage: null
        };
      default:
        return {
          bgImage: null,
          gradient: 'bg-gradient-to-r from-gray-800 to-black',
          titleColor: 'text-white',
          subtitle: 'Discover our premium collection.',
          floatingImage: null
        };
    }
  };

  const details = getBannerDetails();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-20 mb-4">
      <Link href={`/collections?category=${slug}`} className="group block relative overflow-hidden rounded-3xl h-[250px] sm:h-[300px] shadow-lg hover:shadow-2xl transition-all duration-300">
        
        {/* Full Image Background (if available) */}
        {details.bgImage ? (
          <>
            <img 
              loading="lazy"
              src={details.bgImage} 
              alt={title} 
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            <div className={`absolute inset-0 ${details.gradient}`}></div>
          </>
        ) : (
          <div className={`absolute inset-0 ${details.gradient} transition-transform duration-700 group-hover:scale-105`}></div>
        )}

        {/* Content Wrapper */}
        <div className="absolute inset-0 flex items-center justify-between px-8 sm:px-16 z-10 overflow-hidden">
          {/* Text Content */}
          <div className="max-w-xl relative z-20">
            <h2 className={`text-4xl sm:text-5xl font-extrabold ${details.titleColor} mb-3 tracking-tight drop-shadow-lg`}>
              {title}
            </h2>
            <p className={`text-lg sm:text-xl ${details.titleColor} opacity-90 mb-8 drop-shadow-md font-medium`}>
              {details.subtitle}
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white font-bold group-hover:bg-white group-hover:text-black transition-colors duration-300">
              Shop Now <ArrowRight size={18} />
            </div>
          </div>

          {/* Floating Icon (if available) */}
          {details.floatingImage && (
            <div className="hidden sm:block absolute right-0 bottom-0 h-[150%] w-1/2 max-w-[400px] pointer-events-none">
              <img 
                loading="lazy"
                src={details.floatingImage} 
                alt={title} 
                className="w-full h-full object-cover object-left transform translate-y-12 translate-x-12 group-hover:translate-y-8 group-hover:-translate-x-4 group-hover:scale-105 transition-transform duration-700 mix-blend-multiply opacity-60"
              />
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
