import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductSection({ title, subtitle, products }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  if (products.length === 0) return null;

  return (
    <section className="py-6">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="snap-start flex-shrink-0 w-[240px] sm:w-[260px] flex flex-col"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
