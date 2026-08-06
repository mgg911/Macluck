import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Search, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useCatalog } from '../context/CatalogContext';
import Seo from '../components/Seo';
import CategoryIcon from '../components/CategoryIcon';

export default function BrandPage() {
  const { brand, subcategory } = useParams();
  const { products, categories, loading } = useCatalog();
  const [sort, setSort] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubcategory, setActiveSubcategory] = useState(null);

  const { category, childSlug } = useMemo(() => {
    const routeValue = decodeURIComponent(subcategory || brand || '').toLowerCase();
    const top = categories.find((c) =>
      c.slug.toLowerCase() === routeValue || c.name.toLowerCase() === routeValue
    );
    if (top) return { category: top, childSlug: null };
    for (const cat of categories) {
      if (cat.children) {
        const child = cat.children.find((c) =>
          c.slug.toLowerCase() === routeValue || c.name.toLowerCase() === routeValue
        );
        if (child) return { category: cat, childSlug: child.slug };
      }
    }
    return { category: null, childSlug: null };
  }, [brand, subcategory, categories]);

  const catProducts = products.filter((p) => p.category === category?.slug);
  const hasChildren = category?.children?.length > 0;

  useEffect(() => {
    if (childSlug) {
      setActiveSubcategory(childSlug);
    } else {
      setActiveSubcategory(null);
    }
  }, [childSlug]);

  const filteredProducts = useMemo(() => {
    let result = [...catProducts];

    if (hasChildren && activeSubcategory) {
      const child = category.children.find((c) => c.slug === activeSubcategory);
      if (child) {
        result = result.filter((p) => p.subcategory === child.name);
      }
    }

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
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
        break;
    }
    return result;
  }, [catProducts, sort, searchQuery, hasChildren, activeSubcategory, category]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Seo title="Категория не найдена — MacLuck" noindex />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Категория не найдена</h1>
        <Link to="/catalog" className="text-brand-600 hover:underline">Вернуться в каталог</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Seo title={`${category?.name || brand} — каталог MacLuck`} description={`Купить ${category?.name || brand} в MacLuck`} />
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4 flex-wrap">
        <Link to="/" className="hover:text-brand-600 transition">Главная</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{category?.name || brand}</span>
      </nav>

      <div className="flex items-center gap-3 mb-5">
        {category && (
          <CategoryIcon category={category} className="w-12 h-12 shrink-0" />
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{category?.name || brand}</h1>
          <p className="text-sm text-gray-500">{filteredProducts.length} товаров</p>
        </div>
      </div>

      {hasChildren && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setActiveSubcategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              !activeSubcategory
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Все
          </button>
          {category.children.map((child) => (
            <button
              key={child.slug}
              onClick={() => setActiveSubcategory(child.slug)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeSubcategory === child.slug
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {child.name}
            </button>
          ))}
        </div>
      )}

      <div className="relative mb-5 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск в категории..."
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
          <option value="rating">По рейтингу</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">Товары не найдены.</p>
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
