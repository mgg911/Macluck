import { useState, useMemo } from 'react';
import { Tag, ChevronRight, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useCatalog } from '../context/CatalogContext';
import Seo from '../components/Seo';

export default function Clearance() {
  const { products } = useCatalog();
  const clearanceItems = products.filter((p) => p.isClearance);
  const [sort, setSort] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    let result = [...clearanceItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
    }

    return result;
  }, [clearanceItems, sort, searchQuery]);

  const resetFilters = () => {
    setSearchQuery('');
  };

  if (products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Seo title="Уценённые товары — MacLuck" description="Уценённая техника и аксессуары MacLuck" />
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Seo title="Уценённые товары — MacLuck" description="Уценённая техника и аксессуары MacLuck" />
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-brand-600">Главная</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900">Уценка</span>
      </nav>

      <div className="flex items-center gap-2 mb-6">
        <Tag className="text-orange-500" size={28} />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Уценённые товары</h1>
      </div>
      <p className="text-gray-600 mb-6">
        Витринные образцы, неактивированная техника по сниженным ценам. Гарантия сохраняется.
      </p>

      <div className="relative mb-5 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по уценке..."
          className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition text-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition">
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{filteredProducts.length} товаров</p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 focus:border-brand-500 outline-none text-sm bg-white"
        >
          <option value="popular">Сначала популярные</option>
          <option value="price-asc">Цена: по возрастанию</option>
          <option value="price-desc">Цена: по убыванию</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-2">Ничего не найдено.</p>
          <button onClick={resetFilters} className="text-brand-600 hover:underline text-sm">Сбросить фильтры</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
