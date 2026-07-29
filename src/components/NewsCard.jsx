import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Newspaper } from 'lucide-react';

export default function NewsCard({ article, compact }) {
  const dateStr = new Date(article.date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (compact) {
    return (
      <Link
        to={`/news/${article.id}`}
        className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300 hover:-translate-y-0.5"
      >
        {/* Image */}
        <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
              {article.category}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
              <Calendar size={11} />
              {dateStr}
            </span>
          </div>
          <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-brand-600 transition-colors duration-200 line-clamp-2 mb-2 flex-1">
            {article.title}
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">
            {article.summary}
          </p>
          <div className="flex items-center gap-1 text-xs font-medium text-brand-600 group-hover:gap-2 transition-all duration-200 mt-auto">
            Читать
            <ChevronRight size={13} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/news/${article.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300"
    >
      {/* Image */}
      <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      {/* Content */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
            <Newspaper size={11} />
            {article.category}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar size={11} />
            {dateStr}
          </span>
        </div>
        <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-brand-600 transition-colors duration-200 line-clamp-2 mb-2">
          {article.title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
          {article.summary}
        </p>
        <div className="flex items-center gap-1 text-sm font-medium text-brand-600 group-hover:gap-2 transition-all duration-200">
          Читать далее
          <ChevronRight size={14} />
        </div>
      </div>
    </Link>
  );
}
