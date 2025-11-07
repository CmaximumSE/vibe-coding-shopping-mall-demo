import { memo } from 'react';

const NewsletterSection = memo(function NewsletterSection() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Stay Updated</h2>
          <p className="text-lg text-gray-600 mb-8">Subscribe to receive updates on new arrivals and exclusive offers</p>
          
          <div className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
            <button className="bg-gray-800 text-white px-6 py-3 rounded-r-md hover:bg-gray-700 transition-colors">
              SUBSCRIBE
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

export default NewsletterSection;
