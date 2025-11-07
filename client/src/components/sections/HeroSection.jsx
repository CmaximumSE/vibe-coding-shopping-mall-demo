import { memo } from 'react';

const HeroSection = memo(function HeroSection() {
  return (
    <section className="relative h-[600px] bg-gray-100">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 to-transparent"></div>
      <div className="relative h-full flex items-end">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold text-white mb-4">Spring Collection 2025</h1>
            <p className="text-lg text-white mb-8">Discover the essence of modern elegance</p>
            <button className="bg-white text-black px-8 py-3 font-medium hover:bg-gray-100 transition-colors">
              SHOP NOW
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

export default HeroSection;
