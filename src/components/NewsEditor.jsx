import { createNewsSlug } from '../lib/news';

export default function NewsEditor({ article, onChange }) {
  const update = (field, value) => {
    const next = { ...article, [field]: value };
    if (field === 'title' && (!article.slug || article.slug === createNewsSlug(article.title))) {
      next.slug = createNewsSlug(value);
    }
    onChange(next);
  };

  return (
    <section className="border rounded-xl p-4 bg-gray-50 mb-4 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <label className="text-sm font-medium">
          Заголовок <span className="text-red-600">*</span>
          <input
            required
            value={article.title || ''}
            onChange={(event) => update('title', event.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 bg-white font-normal"
          />
        </label>
        <label className="text-sm font-medium">
          Адрес страницы
          <input
            value={article.slug || ''}
            onChange={(event) => update('slug', createNewsSlug(event.target.value))}
            placeholder="Создаётся автоматически"
            className="mt-1 w-full border rounded-lg px-3 py-2 bg-white font-normal"
          />
          <span className="block mt-1 text-xs text-gray-500">Можно не заполнять: адрес создастся из заголовка.</span>
        </label>
      </div>

      <label className="block text-sm font-medium">
        Краткое описание
        <textarea
          value={article.summary || ''}
          onChange={(event) => update('summary', event.target.value)}
          rows={3}
          className="mt-1 w-full border rounded-lg px-3 py-2 bg-white font-normal"
        />
      </label>

      <label className="block text-sm font-medium">
        Текст новости
        <textarea
          value={article.content || ''}
          onChange={(event) => update('content', event.target.value)}
          rows={10}
          className="mt-1 w-full border rounded-lg px-3 py-2 bg-white font-normal"
        />
      </label>

      <div className="grid sm:grid-cols-3 gap-4">
        <label className="text-sm font-medium">
          Дата
          <input
            type="date"
            value={article.date || ''}
            onChange={(event) => update('date', event.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 bg-white font-normal"
          />
        </label>
        <label className="text-sm font-medium">
          Категория
          <input
            value={article.category || ''}
            onChange={(event) => update('category', event.target.value)}
            placeholder="Например, iPhone"
            className="mt-1 w-full border rounded-lg px-3 py-2 bg-white font-normal"
          />
        </label>
        <label className="text-sm font-medium">
          Автор
          <input
            value={article.author || ''}
            onChange={(event) => update('author', event.target.value)}
            placeholder="MacLuck"
            className="mt-1 w-full border rounded-lg px-3 py-2 bg-white font-normal"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={article.published !== false}
          onChange={(event) => update('published', event.target.checked)}
        />
        Опубликовать новость
      </label>

      {article.image && (
        <img src={article.image} alt="Предпросмотр новости" className="max-h-52 rounded-xl border bg-white object-contain" />
      )}
    </section>
  );
}
