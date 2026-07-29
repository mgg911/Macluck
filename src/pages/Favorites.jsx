import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useFavorites } from '../context/FavoritesContext';
import { useCatalog } from '../context/CatalogContext';
import Seo from '../components/Seo';

export default function Favorites() {
  const { favorites } = useFavorites();
  const { products } = useCatalog();

  const favoriteProducts = products.filter((p) => favorites.some((f) => f.id === p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Seo title="Избранное — MacLuck" noindex />
      <div className="flex items-center gap-2 mb-6">
        <Heart size={24} className="text-brand-600" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Избранное</h1>
        {favorites.length > 0 && (
          <span className="text-sm text-gray-500 mt-1">({favorites.length})</span>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 mb-4">В избранном пока нет товаров</p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl hover:bg-brand-700 transition font-medium"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
