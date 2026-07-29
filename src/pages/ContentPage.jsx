import { useParams } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import Seo from '../components/Seo';

const fixed = {
  about: ['О нас', 'about'],
  delivery: ['Оплата и доставка', 'delivery'],
};

export default function ContentPage({ type }) {
  const { slug } = useParams();
  const { data, error } = useSite();
  const key = type || slug;
  const fixedPage = fixed[key];
  const legal = data?.legal?.find((item) => item.slug === key);
  const title = fixedPage?.[0] || legal?.title || 'Документ';
  const content = fixedPage ? data?.settings?.[fixedPage[1]] : legal?.content;
  if (error) return <div className="max-w-4xl mx-auto p-8 text-red-600">{error}</div>;
  if (!data) return <div className="max-w-4xl mx-auto p-8">Загрузка…</div>;
  return (
    <article className="max-w-4xl mx-auto px-4 py-10">
      <Seo title={`${title} — ${data.settings.siteName}`} description={legal?.seoDescription} />
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content || `<h1>${title}</h1><p>Информация готовится.</p>` }} />
    </article>
  );
}
