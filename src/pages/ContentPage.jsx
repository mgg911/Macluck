import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, ChevronRight, Clock3, PackageCheck, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import Seo from '../components/Seo';

function sanitizeContent(html) {
  const documentCopy = new DOMParser().parseFromString(String(html || ''), 'text/html');
  documentCopy.querySelectorAll('script, iframe, object, embed, form, link, meta').forEach((node) => node.remove());
  documentCopy.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || name === 'srcdoc') node.removeAttribute(attribute.name);
      if (['href', 'src', 'xlink:href'].includes(name) && (value.startsWith('javascript:') || value.startsWith('data:text/html'))) {
        node.removeAttribute(attribute.name);
      }
    });
  });
  return documentCopy.body.innerHTML;
}

const fixed = {
  about: ['О компании', 'about'],
  delivery: ['Оплата и доставка', 'delivery'],
};

const pageMeta = {
  about: {
    eyebrow: 'Macluck',
    title: 'Техника, которой можно доверять',
    subtitle: 'Люди, на которых можно положиться. Более пяти лет помогаем выбирать современную технику легко, безопасно и с уверенностью.',
    stats: [
      { icon: Award, value: '5+ лет', label: 'помогаем клиентам' },
      { icon: ShieldCheck, value: '42 пункта', label: 'диагностики устройств' },
      { icon: Sparkles, value: '100%', label: 'внимания к качеству' },
    ],
  },
  delivery: {
    eyebrow: 'Условия покупки',
    title: 'Оплата и доставка',
    subtitle: 'Прозрачные условия получения заказа в Москве и отправки техники по всей России.',
    stats: [
      { icon: Clock3, value: 'За 3 часа', label: 'доставка по Москве' },
      { icon: Truck, value: 'Бесплатно', label: 'в пределах МКАД' },
      { icon: PackageCheck, value: 'СДЭК', label: 'доставка по России' },
    ],
  },
};

export default function ContentPage({ type, legalSlug }) {
  const { slug } = useParams();
  const { data, error } = useSite();
  const key = type || legalSlug || slug;
  const fixedPage = fixed[key];
  const legal = data?.legal?.find((item) => item.slug === key);
  const title = fixedPage?.[0] || legal?.title || 'Документ';
  const content = fixedPage ? data?.settings?.[fixedPage[1]] : legal?.content;
  const meta = pageMeta[key];
  const safeContent = useMemo(() => sanitizeContent(content || '<h1>' + title + '</h1>'), [content, title]);

  if (error) return <div className="max-w-4xl mx-auto p-8 text-red-600">{error}</div>;
  if (!data) return <div className="max-w-4xl mx-auto p-8">Загрузка…</div>;
  if (!fixedPage && !legal) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <Seo title="Документ не найден — MacLuck" noindex />
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Документ не найден</h1>
      <Link to="/" className="text-brand-600 hover:underline">Вернуться на главную</Link>
    </div>;
  }

  return (
    <main className="bg-slate-50 min-h-[70vh] pb-16 md:pb-24">
      <Seo title={`${title} — ${data.settings.siteName}`} description={legal?.seoDescription || meta?.subtitle} />

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.35),transparent_38%),radial-gradient(circle_at_10%_100%,rgba(14,165,233,0.18),transparent_40%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-20">
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8" aria-label="Хлебные крошки">
            <Link to="/" className="hover:text-white transition">Главная</Link>
            <ChevronRight size={14} />
            <span className="text-slate-200">{title}</span>
          </nav>

          <div className="max-w-3xl">
            <p className="text-brand-400 uppercase tracking-[0.22em] text-xs font-bold mb-3">{meta?.eyebrow || 'Macluck'}</p>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-[1.08]">{meta?.title || title}</h1>
            {meta?.subtitle && <p className="mt-5 text-base md:text-xl leading-relaxed text-slate-300 max-w-2xl">{meta.subtitle}</p>}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 -mt-7 relative z-10">
        {meta?.stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10">
            {meta.stats.map(({ icon: Icon, value, label }) => (
              <div key={value} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <span className="w-11 h-11 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center shrink-0"><Icon size={22} /></span>
                <span><strong className="block text-lg text-slate-950">{value}</strong><span className="text-sm text-slate-500">{label}</span></span>
              </div>
            ))}
          </div>
        )}

        <article className="bg-white border border-slate-200 rounded-3xl shadow-sm px-5 py-7 sm:px-8 md:px-14 md:py-12">
          <div className="content-rich" dangerouslySetInnerHTML={{ __html: safeContent }} />
        </article>
      </div>
    </main>
  );
}