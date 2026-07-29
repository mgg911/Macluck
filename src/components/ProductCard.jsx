import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Minus, Plus, X } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import { colorMap } from '../data/products';
import SimConfigurator from './SimConfigurator';

function getMemoryOptions(specs) {
  const memSpec = specs.find((s) => s.name === 'Память' || s.name === 'Объём памяти');
  return memSpec ? memSpec.options : [];
}

export default function ProductCard({ product, activeColor, initialMemory }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const [showConfigModal, setShowConfigModal] = useState(false);

  const colorOptions = useMemo(() => product.specs.find((s) => s.name === 'Цвет')?.options || [], [product.specs]);
  const [selectedColor, setSelectedColor] = useState(
    activeColor
      ? colorOptions.find((c) => c.unifiedColor === activeColor)?.value ?? colorOptions[0]?.value
      : colorOptions[0]?.value
  );

  useEffect(() => {
    if (!activeColor) return;
    const found = colorOptions.find((c) => c.unifiedColor === activeColor);
    if (found) setSelectedColor(found.value);
  }, [activeColor, colorOptions]);

  const memoryOptions = getMemoryOptions(product.specs);
  const [selectedMemory, setSelectedMemory] = useState(initialMemory ?? memoryOptions[0]?.value);
  const [selectedSim, setSelectedSim] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  // Build spec selections for the modal — all specs except color & memory (handled separately)
  const otherSpecs = product.specs.filter((s) => s.name !== 'Цвет' && s.name !== 'Память' && s.name !== 'Объём памяти');
  const [otherSelections, setOtherSelections] = useState(() => {
    const init = {};
    otherSpecs.forEach((s) => { init[s.name] = s.options[0]?.value; });
    return init;
  });

  const handleOpenConfig = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setModalQuantity(1);
    setShowConfigModal(true);
  };

  const handleConfirmAdd = () => {
    const specs = {};
    if (selectedColor) specs.Цвет = selectedColor;
    if (selectedMemory) specs.Память = selectedMemory;
    if (selectedSim) specs['SIM-конфигурация'] = selectedSim;
    otherSpecs.forEach((s) => {
      if (otherSelections[s.name]) specs[s.name] = otherSelections[s.name];
    });
    addToCart(product, specs, modalQuantity);
    setShowConfigModal(false);
  };

  const formatPrice = (p) => p.toLocaleString('ru-RU') + ' ₽';

  return (
    <>
      <Link
        to={`/product/${product.id}`}
        className="group bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden flex flex-col h-full"
      >
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "data:image/svg+xml," +
                encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f3f4f6"/><text x="200" y="200" text-anchor="middle" font-size="16" fill="#9ca3af" font-family="Arial">${product.name}</text></svg>`
                );
            }}
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNew && (
              <span className="bg-brand-600 text-white text-xs font-bold px-2 py-1 rounded-md">Новинка</span>
            )}
            {product.badge && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md">{product.badge}</span>
            )}
          </div>
          {product.discount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
              -{product.discount}%
            </div>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const specs = {};
              if (selectedColor) specs.Цвет = selectedColor;
              if (selectedMemory) specs.Память = selectedMemory;
              if (selectedSim) specs['SIM-конфигурация'] = selectedSim;
              toggleFavorite(product, specs);
            }}
            className="absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition"
            title={isFavorite(product.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
          >
            <Heart
              size={18}
              className={isFavorite(product.id) ? 'text-brand-600' : 'text-gray-400'}
              fill={isFavorite(product.id) ? 'currentColor' : 'none'}
            />
          </button>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-medium text-gray-900 text-sm leading-snug mb-2 line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Color swatches */}
          {colorOptions.length > 1 && (
            <div className="min-h-[1.5rem] mb-3">
              <div className="flex flex-wrap gap-1.5">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedColor(opt.value);
                    }}
                    title={opt.label}
                    className={`w-5 h-5 rounded-full border-2 transition ${
                      selectedColor === opt.value
                        ? 'border-brand-600 ring-1 ring-brand-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: colorMap[opt.label] || '#d4d4d4' }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Memory options */}
          {memoryOptions.length > 0 && (
            <div className="min-h-[2rem] mb-3">
              <div className="flex flex-wrap gap-1">
                {memoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedMemory(opt.value);
                    }}
                    className={`text-xs px-2 py-1 rounded-md border transition ${
                      selectedMemory === opt.value
                        ? 'border-brand-600 bg-brand-50 text-brand-600 font-medium'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SIM configurator */}
          <SimConfigurator
            product={product}
            selectedSim={selectedSim}
            onChange={setSelectedSim}
            compact
          />

          {/* Price & cart */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
            {product.inStock ? (
              <button
                onClick={handleOpenConfig}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-brand-700 transition"
              >
                <ShoppingCart size={16} />
                В корзину
              </button>
            ) : (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 text-sm font-medium py-2.5 rounded-xl cursor-not-allowed"
              >
                Нет в наличии
              </button>
            )}
          </div>
        </div>
      </Link>
    {/* Config modal */}
    {showConfigModal && (
      <>
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowConfigModal(false)} />
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-[slideIn_0.2s_ease-out]">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="font-bold text-gray-900 text-base">Выберите конфигурацию</h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Product info */}
              <div className="flex gap-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-20 rounded-xl bg-gray-50 object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-lg font-bold text-brand-600 mt-1">
                    {(product.price * modalQuantity).toLocaleString('ru-RU') + ' ₽'}
                  </p>
                </div>
              </div>

              {/* Color */}
              {colorOptions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Цвет</p>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedColor(opt.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
                          selectedColor === opt.value
                            ? 'border-brand-600 bg-brand-50 text-brand-600 font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                          style={{ backgroundColor: colorMap[opt.label] || '#d4d4d4' }}
                        />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Memory */}
              {memoryOptions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Память</p>
                  <div className="flex flex-wrap gap-2">
                    {memoryOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedMemory(opt.value)}
                        className={`px-4 py-2 rounded-lg border text-sm transition ${
                          selectedMemory === opt.value
                            ? 'border-brand-600 bg-brand-50 text-brand-600 font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Other specs */}
              {otherSpecs.map((spec) => (
                <div key={spec.name}>
                  <p className="text-sm font-medium text-gray-700 mb-2">{spec.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {spec.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setOtherSelections((prev) => ({ ...prev, [spec.name]: opt.value }))}
                        className={`px-4 py-2 rounded-lg border text-sm transition ${
                          otherSelections[spec.name] === opt.value
                            ? 'border-brand-600 bg-brand-50 text-brand-600 font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* SIM configurator */}

              <SimConfigurator
                product={product}
                selectedSim={selectedSim}
                onChange={setSelectedSim}
              />

              {/* Quantity */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Количество</p>
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 w-fit">
                  <button
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    className="p-2 rounded-md hover:bg-white transition"
                  >
                    <Minus size={16} className="text-gray-600" />
                  </button>
                  <span className="text-base font-bold w-10 text-center">{modalQuantity}</span>
                  <button
                    onClick={() => setModalQuantity(Math.min(99, modalQuantity + 1))}
                    className="p-2 rounded-md hover:bg-white transition"
                  >
                    <Plus size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 rounded-b-2xl flex gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmAdd}
                className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition text-sm"
              >
                Добавить {modalQuantity > 1 ? '(' + modalQuantity + ' шт.)' : ''}
              </button>
            </div>
          </div>
        </div>
      </>
    )}
    </>
  );
}
