import { Link } from 'react-router-dom';
import { MapPin, Truck, Wallet, ArrowRight, Tag, ChevronRight } from 'lucide-react';
import BannerSlider from '../components/BannerSlider';
import ProductSection from '../components/ProductSection';
import NewsCard from '../components/NewsCard';
import { useCatalog } from '../context/CatalogContext';
import { useSite } from '../context/SiteContext';
import Seo from '../components/Seo';
import CategoryIcon from '../components/CategoryIcon';

export default function Home() {
  const { products, banners, categories } = useCatalog();
  const { data } = useSite();
  const news = data?.news || [];

  const hits = products.filter((p) => p.badge === 'Хит' || p.rating >= 4.7).slice(0, 10);
  const newItems = products.filter((p) => p.isNew).slice(0, 10);
  const iphones = products.filter((p) => p.subcategory === 'iPhone');
  const ipads = products.filter((p) => p.subcategory === 'iPad');
  const macbooks = products.filter((p) => p.subcategory === 'MacBook');
  const watches = products.filter((p) => p.subcategory === 'Apple Watch');
  const airpods = products.filter((p) => p.subcategory === 'AirPods');
  const playstations = products.filter((p) => p.brand === 'PlayStation' && !p.isClearance);
  const dysons = products.filter((p) => p.brand === 'Dyson' && !p.isClearance);
  const clearance = products.filter((p) => p.isClearance);
  const accessories = products.filter((p) => p.subcategory === 'Аксессуары');

  return (
    <div className="pb-8">
      <Seo title="MacLuck — техника и аксессуары" description="Интернет-магазин техники и аксессуаров MacLuck" />
      {/* Banner slider */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <BannerSlider banners={banners} />
      </div>

      {/* Хиты продаж */}
      <div className="max-w-7xl mx-auto px-4">
        <ProductSection title="Хиты продаж" subtitle="Самые популярные товары" products={hits} />
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-800 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Truck size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-sm leading-tight">Доставка по всей России</h3>
            <p className="text-brand-100 text-xs mt-0.5">Отправляем в любой регион страны</p>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <MapPin size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-sm leading-tight">Бесплатно доставим по Москве</h3>
            <p className="text-emerald-100 text-xs mt-0.5">За 3 часа</p>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Wallet size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-sm leading-tight">Оплата при получении</h3>
            <p className="text-amber-100 text-xs mt-0.5">Оплатите заказ при получении</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="py-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Категории</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/brand/${cat.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all p-6 flex flex-col items-center text-center w-[calc((100%-2rem)/3)] sm:w-[calc((100%-2*1rem)/3)]"
              >
                <CategoryIcon category={cat} className="w-16 h-16 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-gray-900">{cat.name}</h3>
                <span className="mt-2 text-sm text-brand-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Смотреть <ArrowRight size={14} />
                </span>
              </Link>
            ))}
            <Link
              to="/clearance"
              className="group bg-white rounded-2xl border border-orange-200 hover:shadow-lg hover:border-orange-300 transition-all p-6 flex flex-col items-center text-center w-[calc((100%-2rem)/3)] sm:w-[calc((100%-2*1rem)/3)]"
            >
              <div className="w-16 h-16 mb-3 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Tag size={32} className="text-orange-500" />
              </div>
              <h3 className="font-bold text-gray-900">Уценка</h3>
              <span className="mt-2 text-sm text-orange-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Смотреть <ArrowRight size={14} />
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* News section */}
      <div className="max-w-7xl mx-auto px-4 mt-8 mb-4">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Новости</h2>
              <p className="text-sm text-gray-500 mt-0.5">Последние новости из мира Apple</p>
            </div>
            <Link
              to="/news"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition"
            >
              Все новости
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {news.slice(0, 3).map((article) => (
              <NewsCard key={article.id} article={article} compact />
            ))}
          </div>
          <Link
            to="/news"
            className="sm:hidden flex items-center justify-center gap-1 mt-5 text-sm font-medium text-brand-600 hover:text-brand-700 transition pt-4 border-t border-gray-100"
          >
            Все новости
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Product sections */}
      <div className="max-w-7xl mx-auto px-4">
        <ProductSection title="Новинки" subtitle="Только что в продаже" products={newItems} />
        <ProductSection title="iPhone" subtitle="iPhone 17 Pro Max – 16e всех цветов и памяти" products={iphones} />
        <ProductSection title="iPad" subtitle="От iPad 11 до iPad Pro M4" products={ipads} />
        <ProductSection title="MacBook" subtitle="От Air M4 до Pro M4 Max" products={macbooks} />
        <ProductSection title="Apple Watch" subtitle="Ultra 3, Series 11, SE 3" products={watches} />
        <ProductSection title="AirPods" subtitle="Беспроводные наушники Apple" products={airpods} />
        <ProductSection title="PlayStation" subtitle="Консоли, геймпады, игры и аксессуары" products={playstations} />
        <ProductSection title="Dyson" subtitle="Пылесосы, фены, стайлеры и очистители воздуха" products={dysons} />
        <ProductSection title="Аксессуары Apple" subtitle="Чехлы, стёкла, зарядки, стилусы и многое другое" products={accessories} />
        <ProductSection title="Уценка" subtitle="Выгодные цены на технику" products={clearance} />
      </div>
    </div>
  );
}
