import { MapPin, Truck, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

function safeExternalUrl(value) {
  try {
    const url = new URL(String(value));
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

export default function Footer() {
  const { data } = useSite();
  const settings = data?.settings || {};
  const socialLinks = Object.entries(settings.social || {})
    .map(([name, value]) => [name, safeExternalUrl(value)])
    .filter(([name, url]) => name !== 'telegram' && url);
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img src={settings.logo || "/images/macluck-logo.png"} alt={settings.siteName || "MacLuck"} className="h-24 w-auto max-w-full object-contain bg-white rounded-xl p-1 mb-3" />
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Truck size={16} className="text-brand-400" />
              Доставка по всей России
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin size={16} className="text-brand-400" />
              Бесплатно доставим по Москве за 3 часа
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Wallet size={16} className="text-emerald-400" />
              Оплата при получении
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-white mb-4">Контакты</h3>
          <ul className="space-y-2 text-sm">
            {settings.address && <li>{settings.address}</li>}
            {settings.phone && <li><a href={`tel:${settings.phone}`}>{settings.phone}</a></li>}
            {settings.email && <li><a href={`mailto:${settings.email}`}>{settings.email}</a></li>}
            {settings.hours && <li>{settings.hours}</li>}
          </ul>
          {settings.business && <div className="mt-5 pt-4 border-t border-gray-800 text-xs text-gray-400 space-y-1">
            {settings.business.operatorName && <p>ИП {settings.business.operatorName}</p>}
            <p>ИНН {settings.business.inn}</p>
            <p>ОГРНИП {settings.business.ogrnip}</p>
            {settings.business.domain && <p><a href={`https://${settings.business.domain}`} target="_blank" rel="noopener noreferrer">{settings.business.domain}</a></p>}
          </div>}
          <div className="flex flex-wrap gap-3 mt-4 text-sm">
            {socialLinks.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="hover:text-white">{{ telegram: 'Telegram', vk: 'VK', whatsapp: 'WhatsApp' }[name] || name}</a>)}
          </div>
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-x-5 gap-y-2 text-sm border-t border-gray-800 pt-5">
          <Link to="/about">О нас</Link><Link to="/delivery">Оплата и доставка</Link>
          <Link to="/privacy">Политика конфиденциальности</Link>
          <Link to="/consent">Согласие на обработку данных</Link>
          <Link to="/terms">Пользовательское соглашение</Link>
          <Link to="/cookies">Cookie</Link>
          <Link to="/legal/sales">Условия продажи и возврата</Link>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} {settings.siteName || 'MacLuck'}. Все права защищены.
      </div>
    </footer>
  );
}
