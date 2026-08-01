import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, ArrowLeft, User, Phone, MapPin, Home, Truck, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import Seo from '../components/Seo';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();
  const formatPrice = (p) => p.toLocaleString('ru-RU') + ' ₽';

  const [deliveryMethod, setDeliveryMethod] = useState('courier');
  const [form, setForm] = useState({ name: '', surname: '', phone: '', city: '', address: '', pickupAddress: '' });
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const courierFilled = form.name.trim() && form.phone.trim() && form.city.trim() && form.address.trim();
  const cdekFilled = form.surname.trim() && form.name.trim() && form.phone.trim() && form.pickupAddress.trim();
  const allFieldsFilled = (deliveryMethod === 'courier' ? courierFilled : cdekFilled) && consent;

  const handleSubmit = async () => {
    if (!allFieldsFilled) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await api('/orders', {
        method: 'POST',
        body: {
          customer: form,
          deliveryMethod,
          consent,
          items: items.map(item => ({ id: item.productId, quantity: item.quantity })),
        },
      });
      setOrderNumber(result.number);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <Seo title={`Заказ ${orderNumber} оформлен — MacLuck`} noindex />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Спасибо за заказ!</h2>
        <p className="font-medium text-gray-800 mb-1">Номер заказа: {orderNumber}</p>
        <p className="text-gray-500 mb-6">Мы свяжемся с вами для подтверждения.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl hover:bg-brand-700 transition font-medium"
        >
          На главную
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Seo title="Корзина — MacLuck" noindex />
      <div className="flex items-center gap-2 mb-6">
        <Link to="/" className="p-2 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Корзина</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" strokeWidth={1} />
          <p className="text-gray-500 mb-4">Корзина пуста</p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl hover:bg-brand-700 transition font-medium"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Cart items */}
          <div className="lg:col-span-3 space-y-3">
            {items.map((item) => (
              <div key={item.cartId} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100">
                <img src={item.image} alt={item.name} className="w-24 h-24 rounded-xl object-cover bg-gray-50 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                  {item.specs && Object.entries(item.specs).map(([key, val]) => (
                    <p key={key} className="text-xs text-gray-500 mt-0.5">{key}: {val}</p>
                  ))}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)} className="p-1.5 rounded-md hover:bg-white transition">
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)} className="p-1.5 rounded-md hover:bg-white transition">
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-base font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.cartId)} className="p-1 hover:text-red-500 transition self-start">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Order form & summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24 space-y-4">
              <h2 className="font-bold text-gray-900 text-base">Способ доставки</h2>

              {/* Delivery method selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeliveryMethod('courier')}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-sm transition ${
                    deliveryMethod === 'courier'
                      ? 'border-brand-600 bg-brand-50 text-brand-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Truck size={18} />
                  <span className="text-xs font-medium leading-tight text-center">Курьером<br />по Москве</span>
                </button>
                <button
                  onClick={() => setDeliveryMethod('cdek')}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-sm transition ${
                    deliveryMethod === 'cdek'
                      ? 'border-brand-600 bg-brand-50 text-brand-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Package size={18} />
                  <span className="text-xs font-medium leading-tight text-center">СДЭК<br />по России</span>
                </button>
              </div>

              <hr className="border-gray-100" />
              <h2 className="font-bold text-gray-900 text-base">Данные получателя</h2>

              {deliveryMethod === 'courier' ? (
                <>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Имя *"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm transition"
                    />
                  </div>

                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="Телефон *"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm transition"
                    />
                  </div>

                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Город *"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm transition"
                    />
                  </div>

                  <div className="relative">
                    <Home size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Адрес *"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm transition"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.surname}
                      onChange={(e) => updateField('surname', e.target.value)}
                      placeholder="Фамилия *"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm transition"
                    />
                  </div>

                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Имя *"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm transition"
                    />
                  </div>

                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="Телефон *"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm transition"
                    />
                  </div>

                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.pickupAddress}
                      onChange={(e) => updateField('pickupAddress', e.target.value)}
                      placeholder="Адрес пункта выдачи *"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm transition"
                    />
                  </div>
                </>
              )}

              {/* Consent checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-700 transition">
                  Я согласен на{' '}
                  <a href="#" className="text-brand-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                    обработку персональных данных
                  </a>
                </span>
              </label>

              <hr className="border-gray-100" />

              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.cartId} className="flex justify-between text-sm text-gray-600">
                    <span className="truncate mr-2">{item.name} × {item.quantity}</span>
                    <span className="font-medium flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <hr className="border-gray-100" />

              <div className="flex items-center justify-between">
                <span className="text-base text-gray-600">Итого:</span>
                <span className="text-2xl font-bold text-gray-900">{formatPrice(totalPrice)}</span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!allFieldsFilled || submitting}
                className={`w-full py-3.5 rounded-xl text-base font-medium transition ${
                  allFieldsFilled
                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Оформляем…' : 'Оформить заказ'}
              </button>
              {submitError && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{submitError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
