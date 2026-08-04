import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Calendar, ArrowLeft } from 'lucide-react';
import NewsCard from '../components/NewsCard';
import { useSite } from '../context/SiteContext';
import Seo from '../components/Seo';

export default function NewsArticle() {
  const { id } = useParams();
  const { data } = useSite();
  const news = data?.news || [];
  const article = news.find((a) => String(a.id) === id || a.slug === id);

  if (!data) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500">Загрузка…</div>;

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Seo title="Статья не найдена — MacLuck" noindex />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Статья не найдена</h1>
        <Link to="/news" className="text-brand-600 hover:underline">Вернуться к новостям</Link>
      </div>
    );
  }

  const articleDate = new Date(article.date);
  const dateStr = Number.isNaN(articleDate.getTime()) ? '' : articleDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Related articles (same category, excluding current)
  const related = news.filter((a) => a.id !== article.id && a.category === article.category).slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Seo title={article.seoTitle || `${article.title} — MacLuck`} description={article.seoDescription || article.excerpt} image={article.image} schema={{ '@context': 'https://schema.org', '@type': 'Article', headline: article.title, image: article.image, datePublished: article.date }} />
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-brand-600 transition">Главная</Link>
        <ChevronRight size={14} />
        <Link to="/news" className="hover:text-brand-600 transition">Новости</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 truncate max-w-[200px]">{article.title}</span>
      </nav>

      {/* Back link */}
      <Link
        to="/news"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition mb-6"
      >
        <ArrowLeft size={16} />
        Все новости
      </Link>

      <article>
        {/* Meta */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
            {article.category}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar size={12} />
            {dateStr}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight mb-6">
          {article.title}
        </h1>

        {/* Image */}
        <div className="aspect-video bg-gray-50 rounded-2xl flex items-center justify-center p-12 mb-8">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          {(article.content || '').split('\n\n').filter(Boolean).map((paragraph, idx) => (
            <p key={idx} className="text-base text-gray-700 leading-relaxed mb-5">
              {paragraph.trim()}
            </p>
          ))}
        </div>

        {/* Author */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-400">
          Автор: {article.author}
        </div>
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Читайте также</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((a) => (
              <NewsCard key={a.id} article={a} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
