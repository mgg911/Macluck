import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Newspaper } from 'lucide-react';
import { newsCategories } from '../data/news';
import NewsCard from '../components/NewsCard';
import { useSite } from '../context/SiteContext';
import Seo from '../components/Seo';

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const { data } = useSite();
  const news = data?.news || [];

  const filtered = activeCategory === 'all'
    ? news
    : news.filter((a) => a.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Seo title="Новости — MacLuck" description="Новости, обзоры и полезные материалы MacLuck" />
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4 flex-wrap">
        <Link to="/" className="hover:text-brand-600 transition">Главная</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">Новости</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
          <Newspaper size={24} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Новости</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} {filtered.length === 1 ? 'статья' : 'статьи'}</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {newsCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeCategory === cat.id
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* News grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">Новости не найдены</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
