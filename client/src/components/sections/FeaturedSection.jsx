import { memo } from 'react';
import { featuredProducts } from '../../constants/products';

const ProductCard = memo(({ product }) => (
  <div className="group cursor-pointer relative">
    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
      <div className={`w-full h-full bg-gradient-to-br ${product.gradient} flex items-center justify-center`}>
        <div className={`${product.item.width} ${product.item.height} ${product.item.bg} ${product.item.rounded}`}></div>
      </div>
      {product.hasViewButton && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="bg-white text-black px-6 py-2 font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity">
            VIEW
          </button>
        </div>
      )}
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{product.name}</h3>
    <p className="text-gray-600">{product.price}</p>
  </div>
));

ProductCard.displayName = 'ProductCard';

export default memo(function FeaturedSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Collection</h2>
          <p className="text-lg text-gray-600">Curated pieces for the modern wardrobe</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
});
