import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, X, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useCatalog } from '../context/CatalogContext';
import Seo from '../components/Seo';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products } = useCatalog();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState('popular');

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    let result = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );

    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return result;
  }, [query, products, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Seo title="Поиск — MacLuck" noindex />
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-brand-600">Главная</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900">Поиск</span>
      </nav>

      <form onSubmit={handleSearch} className="relative max-w-xl mb-6">
        <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по каталогу..."
          autoFocus
          className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition text-base"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full transition"
          >
            <X size={18} className="text-gray-400" />
          </button>
        )}
      </form>

      {query.trim() && (
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            Результаты поиска «{query.trim()}» — {results.length} товаров
          </p>
          {results.length > 0 && (
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:border-brand-500 outline-none text-sm bg-white"
            >
              <option value="popular">Сначала популярные</option>
              <option value="price-asc">Цена: по возрастанию</option>
              <option value="price-desc">Цена: по убыванию</option>
              <option value="rating">По рейтингу</option>
            </select>
          )}
        </div>
      )}

      {query.trim() === '' ? (
        <div className="text-center py-20">
          <SearchIcon size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500">Введите запрос для поиска</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-2">Товары не найдены.</p>
          <p className="text-sm text-gray-400">Попробуйте изменить запрос</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
