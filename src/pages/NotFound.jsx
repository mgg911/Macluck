import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

export default function NotFound() {
  return <div className="max-w-xl mx-auto px-4 py-24 text-center">
    <Seo title="Страница не найдена — MacLuck" noindex />
    <div className="text-7xl font-bold text-brand-600">404</div>
    <h1 className="text-2xl font-bold mt-4">Страница не найдена</h1>
    <p className="text-gray-500 mt-2 mb-6">Возможно, адрес изменился или страница была удалена.</p>
    <Link to="/" className="inline-flex rounded-xl bg-brand-600 px-6 py-3 text-white">На главную</Link>
  </div>;
}
