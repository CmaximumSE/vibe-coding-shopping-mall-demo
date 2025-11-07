import { memo } from 'react';

const categories = [
  {
    id: 'women',
    title: 'WOMEN',
    gradient: 'from-amber-100 to-amber-200',
    items: [
      { width: 'w-32', height: 'h-40', bg: 'bg-amber-300', rounded: 'rounded-lg' },
      { width: 'w-24', height: 'h-32', bg: 'bg-amber-400', rounded: 'rounded-lg' }
    ]
  },
  {
    id: 'men',
    title: 'MEN',
    gradient: 'from-blue-100 to-blue-200',
    items: [
      { width: 'w-32', height: 'h-40', bg: 'bg-blue-300', rounded: 'rounded-lg' },
      { width: 'w-24', height: 'h-32', bg: 'bg-blue-400', rounded: 'rounded-lg' }
    ]
  },
  {
    id: 'accessories',
    title: 'ACCESSORIES',
    gradient: 'from-amber-100 to-amber-200',
    items: [
      { width: 'w-20', height: 'h-16', bg: 'bg-amber-600', rounded: 'rounded-lg' },
      { width: 'w-8', height: 'h-8', bg: 'bg-yellow-400', rounded: 'rounded-full' }
    ]
  }
];

const CategoryCard = memo(({ category }) => (
  <div className="relative group cursor-pointer">
    <div className="aspect-[4/5] bg-gray-200 rounded-lg overflow-hidden">
      <div className={`w-full h-full bg-gradient-to-br ${category.gradient} flex items-center justify-center`}>
        <div className="text-center">
          {category.items.map((item, index) => (
            <div
              key={index}
              className={`${item.width} ${item.height} ${item.bg} ${item.rounded} mx-auto ${
                index === 0 ? 'mb-4' : ''
              }`}
            />
          ))}
        </div>
      </div>
    </div>
    <div className="absolute bottom-4 left-4">
      <h3 className="text-2xl font-bold text-white">{category.title}</h3>
    </div>
  </div>
));

CategoryCard.displayName = 'CategoryCard';

export default memo(function CategorySection() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
});
