import { Minus, Plus, Trash2, ShoppingBag, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const formatPrice = (p) => p.toLocaleString('ru-RU') + ' ₽';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={() => setIsOpen(false)} />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag size={20} />
            Корзина {totalItems > 0 && <span className="text-sm text-gray-500 font-normal">({totalItems})</span>}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <ShoppingBag size={48} strokeWidth={1} />
            <p className="text-sm">Корзина пуста</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div key={item.cartId} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover bg-white flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                    {item.specs && Object.entries(item.specs).map(([key, val]) => (
                      <p key={key} className="text-xs text-gray-500">{key}: {val}</p>
                    ))}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                          className="p-1 rounded-full hover:bg-gray-200 transition"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                          className="p-1 rounded-full hover:bg-gray-200 transition"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className="p-1 hover:text-red-500 transition self-start"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Итого:</span>
                <span className="text-xl font-bold text-gray-900">{formatPrice(totalPrice)}</span>
              </div>
              <Link
                to="/cart"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition"
              >
                Перейти в корзину <ExternalLink size={16} />
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
