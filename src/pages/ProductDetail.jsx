import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ShoppingCart, Heart, Star, Truck, Shield, Clock } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { colorMap } from '../data/products';
import SimConfigurator from '../components/SimConfigurator';
import ProductCard from '../components/ProductCard';
import Seo from '../components/Seo';
import { getProductImages, getProductPrice, sanitizeProductSpecs } from '../utils/productVariants';

export default function ProductDetail() {
  const { id } = useParams();
  const { products, categories, loading } = useCatalog();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedSpecs, setSelectedSpecs] = useState({});
  const [selectedSim, setSelectedSim] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const product = products.find((p) => String(p.id) === id || p.slug === id);
  const productCategory = categories.find((category) => category.slug === product?.category);
  const productSubcategory = productCategory?.children?.find(
    (subcategory) => subcategory.name.toLowerCase() === product?.subcategory?.toLowerCase()
  );
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const sameSubcategory = products.filter(
      (p) => p.id !== product.id && p.subcategory === product.subcategory
    );
    const sameCategory = products.filter(
      (p) => p.id !== product.id && p.category === product.category && p.subcategory !== product.subcategory
    );
    return [...sameSubcategory, ...sameCategory].slice(0, 5);
  }, [products, product]);
  const effectiveSpecs = useMemo(
    () => sanitizeProductSpecs(product, {
      ...selectedSpecs,
      ...(selectedSim ? { 'SIM-конфигурация': selectedSim } : {}),
    }),
    [product, selectedSpecs, selectedSim]
  );
  const galleryImages = useMemo(
    () => getProductImages(product, effectiveSpecs),
    [product, effectiveSpecs]
  );
  const currentPrice = getProductPrice(product, effectiveSpecs);
  const productId = product?.id;
  const selectedColor = effectiveSpecs['Цвет'];

  useEffect(() => {
    setActiveImageIndex(0);
  }, [productId, selectedColor]);

  useEffect(() => {
    if (activeImageIndex >= galleryImages.length) setActiveImageIndex(0);
  }, [activeImageIndex, galleryImages.length]);

  if (!product) {
    if (loading) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500">Загрузка...</p>
        </div>
      );
    }
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Seo title="Товар не найден — MacLuck" noindex />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Товар не найден</h1>
        <Link to="/" className="text-brand-600 hover:underline">Вернуться на главную</Link>
      </div>
    );
  }

  const formatPrice = (p) => (p ?? 0).toLocaleString('ru-RU') + ' ₽';

  const handleAddToCart = () => {
    addToCart(product, effectiveSpecs, quantity);
  };

  const allSelected = (product.specs || []).every(
    (spec) => spec.options.length === 0 || effectiveSpecs[spec.name]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Seo
        title={product.seoTitle || `${product.name} — купить в MacLuck`}
        description={product.seoDescription || product.description}
        image={galleryImages[0] || product.image}
        schema={{ '@context': 'https://schema.org', '@type': 'Product', name: product.name, image: galleryImages, description: product.description, offers: { '@type': 'Offer', priceCurrency: 'RUB', price: currentPrice, availability: 'https://schema.org/InStock' } }}
      />
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-brand-600">Главная</Link>
        <ChevronRight size={14} />
        <Link to={`/brand/${product.category}`} className="hover:text-brand-600">{product.brand}</Link>
        <ChevronRight size={14} />
        <Link to={`/brand/${productSubcategory?.slug || product.category}`} className="hover:text-brand-600">{product.subcategory}</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div className="min-w-0">
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
            <img
              src={galleryImages[activeImageIndex] || product.image}
              alt={`${product.name}${galleryImages.length > 1 ? `, фото ${activeImageIndex + 1}` : ''}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "data:image/svg+xml," +
                  encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f3f4f6"/><text x="200" y="200" text-anchor="middle" font-size="16" fill="#9ca3af" font-family="Arial">${product.name}</text></svg>`
                  );
              }}
            />
          </div>
          {galleryImages.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1" aria-label="Фотографии товара">
              {galleryImages.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() => setActiveImageIndex(index)}
                  className={`w-20 h-20 flex-none rounded-xl border-2 overflow-hidden bg-white ${activeImageIndex === index ? 'border-brand-600' : 'border-gray-200'}`}
                  aria-label={`Показать фото ${index + 1}`}
                  aria-current={activeImageIndex === index ? 'true' : undefined}
                >
                  <img src={image} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start gap-2 mb-2">
            {product.isNew && <span className="bg-brand-600 text-white text-xs font-bold px-2 py-1 rounded-md">Новинка</span>}
            {product.badge && <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md">{product.badge}</span>}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={star <= Math.round(product.rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">{product.rating} · {product.reviewCount} отзывов</span>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>

          {/* Specs selection */}
          <div className="space-y-4 mb-6">
            {product.specs.map((spec) => (
              <div key={spec.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{spec.name}</label>
                <div className="flex flex-wrap gap-2">
                  {spec.name === 'Цвет' ? (
                    spec.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedSpecs({ ...selectedSpecs, [spec.name]: opt.value })}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition ${
                          effectiveSpecs[spec.name] === opt.value
                            ? 'border-brand-600 bg-brand-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-gray-200"
                          style={{ backgroundColor: colorMap[opt.label] || '#d4d4d4' }}
                        />
                        <span className="text-sm">{opt.label}</span>
                      </button>
                    ))
                  ) : (
                    spec.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedSpecs({ ...selectedSpecs, [spec.name]: opt.value })}
                        className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                          effectiveSpecs[spec.name] === opt.value
                            ? 'border-brand-600 bg-brand-50 text-brand-600'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))}

            {/* SIM configurator */}
            <SimConfigurator
              product={product}
              selectedSim={selectedSim}
              onChange={setSelectedSim}
            />
          </div>

          {/* Price & add to cart */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-6">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(currentPrice)}</span>
              {product.originalPrice > currentPrice && (
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
              )}
              {product.discount && (
                <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-md">-{product.discount}%</span>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 rounded-full hover:bg-gray-100 transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>
                </button>
                <span className="text-sm font-medium w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(99, quantity + 1))}
                  className="p-1 rounded-full hover:bg-gray-100 transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!allSelected || !product.inStock}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white font-medium py-3 rounded-xl hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={18} />
                {product.inStock ? 'Добавить в корзину' : 'Нет в наличии'}
              </button>
              <button
                onClick={() => toggleFavorite(product, effectiveSpecs)}
                className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
                title={isFavorite(product.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
              >
                <Heart
                  size={20}
                  className={isFavorite(product.id) ? 'text-brand-600' : 'text-gray-400'}
                  fill={isFavorite(product.id) ? 'currentColor' : 'none'}
                />
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Truck size={16} className="text-brand-600" />
              Доставка по РФ
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield size={16} className="text-brand-600" />
              Гарантия 1 год
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} className="text-brand-600" />
              Бесплатно по Москве за 3 часа
            </div>
          </div>
        </div>
      </div>

      {/* Tech specs */}
      {product.techSpecs && product.techSpecs.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Характеристики</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {product.techSpecs.map((spec, idx) => (
              <div
                key={spec.label}
                className={`flex items-center justify-between px-5 py-4 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
              >
                <span className="text-sm text-gray-500">{spec.label}</span>
                <span className="text-sm font-medium text-gray-900">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">С этим товаром часто покупают</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
