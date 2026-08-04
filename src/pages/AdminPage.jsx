import { useEffect, useMemo, useState } from 'react';
import { api, uploadImage } from '../lib/api';
import Seo from '../components/Seo';

const sections = [
  ['products', 'Товары'], ['categories', 'Категории'], ['filters', 'Фильтры'],
  ['news', 'Новости'], ['banners', 'Баннеры'], ['orders', 'Заказы'],
  ['legal', 'Документы'], ['settings', 'Настройки'],
];

const templates = {
  products: { name: '', slug: '', brand: '', category: '', subcategory: '', price: 0, originalPrice: 0, image: '', images: [], description: '', inStock: true, specs: [], configurationPrices: {}, colorImages: {}, techSpecs: [], filters: {}, published: true },
  categories: { name: '', slug: '', children: [] },
  filters: { name: '', slug: '', values: [] },
  news: { title: '', slug: '', summary: '', content: '', image: '', date: '', category: '', published: true, seoTitle: '', seoDescription: '' },
  banners: { title: '', subtitle: '', footer: '', image_url: '', link: '', gradient: 'from-blue-600 to-blue-900', published: true },
  legal: { slug: '', title: '', content: '', seoTitle: '', seoDescription: '' },
};

function Login({ onLogin }) {
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setError('');
    try { await api('/auth/login', { method: 'POST', body: form }); onLogin(); }
    catch (err) { setError(err.message); }
  };
  return <div className="min-h-[65vh] grid place-items-center px-4">
    <Seo title="Вход в админ-панель" noindex />
    <form onSubmit={submit} className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h1 className="text-2xl font-bold mb-5">Вход в админ-панель</h1>
      {error && <p role="alert" className="bg-red-50 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</p>}
      <label className="block text-sm mb-4">Логин
        <input autoComplete="username" required value={form.login} onChange={e => setForm({ ...form, login: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
      </label>
      <label className="block text-sm mb-5">Пароль
        <input type="password" autoComplete="current-password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
      </label>
      <button className="w-full bg-brand-600 text-white rounded-lg py-2.5 font-medium">Войти</button>
    </form>
  </div>;
}

function ProductVariantEditor({ product, onChange, setError, uploading, setUploading }) {
  const priceSpecs = (product.specs || []).filter(
    (spec) => spec.name !== 'Цвет' && Array.isArray(spec.options) && spec.options.length
  );
  const colorSpec = (product.specs || []).find(
    (spec) => spec.name === 'Цвет' && Array.isArray(spec.options) && spec.options.length
  );
  const clone = () => JSON.parse(JSON.stringify(product));

  const updatePrice = (specName, optionValue, value) => {
    const next = clone();
    next.configurationPrices ||= {};
    next.configurationPrices[specName] ||= {};
    if (value === '') delete next.configurationPrices[specName][optionValue];
    else next.configurationPrices[specName][optionValue] = Math.max(0, Number(value) || 0);
    onChange(next);
  };

  const setColorImages = (color, images) => {
    const next = clone();
    next.colorImages ||= {};
    const cleaned = images.map(String);
    if (cleaned.length) next.colorImages[color] = cleaned;
    else delete next.colorImages[color];
    onChange(next);
  };

  const uploadColorImages = async (color, files) => {
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of files) uploaded.push((await uploadImage(file)).url);
      const current = product.colorImages?.[color] || [];
      setColorImages(color, [...current, ...uploaded]);
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return <div className="space-y-5 mb-5">
    <section className="border rounded-xl p-4 bg-gray-50">
      <h3 className="font-semibold text-lg">Цены конфигураций</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">Укажите полную цену товара для каждого варианта. Пустое поле использует основную цену товара.</p>
      {!priceSpecs.length ? <p className="text-sm text-amber-700">Сначала добавьте варианты памяти или другой конфигурации в поле specs.</p> :
        <div className="space-y-4">
          {priceSpecs.map((spec) => <div key={spec.name}>
            <p className="font-medium mb-2">{spec.name}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {spec.options.map((option) => <label key={option.value} className="text-sm">
                {option.label}
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={product.configurationPrices?.[spec.name]?.[option.value] ?? ''}
                    onChange={(event) => updatePrice(spec.name, option.value, event.target.value)}
                    placeholder={String(product.price || 0)}
                    className="w-full border rounded-lg px-3 py-2 pr-8 bg-white"
                  />
                  <span className="absolute right-3 top-2 text-gray-400">₽</span>
                </div>
              </label>)}
            </div>
          </div>)}
        </div>}
    </section>

    <section className="border rounded-xl p-4 bg-gray-50">
      <h3 className="font-semibold text-lg">Фотографии по цветам</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">При выборе цвета покупатель увидит только привязанную к нему галерею. Можно загрузить сразу несколько фотографий.</p>
      {!colorSpec ? <p className="text-sm text-amber-700">Сначала добавьте характеристику «Цвет» и её варианты в поле specs.</p> :
        <div className="space-y-4">
          {colorSpec.options.map((option) => {
            const images = product.colorImages?.[option.value] || [];
            return <div key={option.value} className="bg-white border rounded-xl p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="font-medium">{option.label}</p>
                <label className="text-sm text-brand-600 cursor-pointer">
                  {uploading ? 'Загрузка…' : 'Загрузить фотографии'}
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    disabled={uploading}
                    onChange={(event) => uploadColorImages(option.value, [...(event.target.files || [])])}
                    className="sr-only"
                  />
                </label>
              </div>
              <div className="space-y-2">
                {images.map((image, index) => <div key={`${option.value}-${index}`} className="flex items-center gap-2">
                  {image && <img src={image} alt="" className="w-12 h-12 object-contain border rounded-lg flex-none" />}
                  <input
                    type="text"
                    value={image}
                    onChange={(event) => setColorImages(option.value, images.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                    placeholder="/uploads/photo.webp или https://..."
                    className="min-w-0 flex-1 border rounded-lg px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={() => setColorImages(option.value, images.filter((_, itemIndex) => itemIndex !== index))} className="text-red-600 px-2" aria-label="Удалить фотографию">Удалить</button>
                </div>)}
                <button type="button" onClick={() => setColorImages(option.value, [...images, ''])} className="text-sm text-brand-600">+ Добавить ссылку на фотографию</button>
              </div>
            </div>;
          })}
        </div>}
    </section>
  </div>;
}
function Editor({ section, value, onClose, onSaved }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const updateField = (field, nextValue) => {
    try {
      const parsed = JSON.parse(text);
      parsed[field] = nextValue;
      setText(JSON.stringify(parsed, null, 2));
      setError('');
    } catch {
      setError('Сначала исправьте JSON, затем измените поле');
    }
  };
  let parsedRecord = null;
  try { parsedRecord = JSON.parse(text); } catch {}
  const updateRecord = (nextRecord) => {
    setText(JSON.stringify(nextRecord, null, 2));
    setError('');
  };
  let bannerLink = '';
  if (section === 'banners') {
    try { bannerLink = JSON.parse(text).link || ''; } catch {}
  }
  const save = async () => {
    try {
      const parsed = JSON.parse(text);
      const method = value.id ? 'PUT' : 'POST';
      const path = `/admin/${section}${value.id ? `/${encodeURIComponent(value.id)}` : ''}`;
      await api(path, { method, body: parsed });
      onSaved();
    } catch (err) { setError(err.message); }
  };
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(file);
      const parsed = JSON.parse(text);
      if (section === 'banners') parsed.image_url = result.url;
      else parsed.image = result.url;
      setText(JSON.stringify(parsed, null, 2));
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };
  const removeImage = async () => {
    try {
      const parsed = JSON.parse(text);
      const current = section === 'banners' ? parsed.image_url : parsed.image;
      if (current?.startsWith('/uploads/')) {
        await api('/admin/upload', { method: 'DELETE', body: { url: current } });
      }
      if (section === 'banners') parsed.image_url = '';
      else parsed.image = '';
      setText(JSON.stringify(parsed, null, 2));
    } catch (err) { setError(err.message); }
  };
  return <div className="fixed inset-0 z-50 bg-black/50 p-4 grid place-items-center" role="dialog" aria-modal="true">
    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto p-6">
      <h2 className="text-xl font-bold mb-3">{value.id ? 'Редактирование' : 'Новая запись'}</h2>
      <p className="text-sm text-gray-500 mb-3">Поля представлены в JSON: строки — в кавычках, списки — в квадратных скобках.</p>
      {error && <p className="bg-red-50 text-red-700 p-3 rounded-lg mb-3">{error}</p>}
      {section === 'banners' && <label className="block mb-3 text-sm font-medium">
        Ссылка при нажатии на баннер
        <input
          type="text"
          value={bannerLink}
          onChange={(event) => updateField('link', event.target.value)}
          placeholder="/brand/iphone или /product/iphone-17-pro-max"
          className="mt-1 w-full border rounded-lg px-3 py-2 font-normal"
        />
        <span className="block mt-1 text-xs text-gray-500">Категория: /brand/iphone · товар: /product/iphone-17-pro-max · весь каталог: /catalog. Рекомендуемый размер баннера: 1920×640 px; важный текст и объекты размещайте по центру, чтобы они не обрезались на телефоне.</span>
      </label>}
      {section === 'products' && parsedRecord && <ProductVariantEditor
        product={parsedRecord}
        onChange={updateRecord}
        setError={setError}
        uploading={uploading}
        setUploading={setUploading}
      />}
      <details open={section !== 'products'} className="border rounded-xl p-3">
        <summary className="font-medium cursor-pointer">{section === 'products' ? 'Основные и расширенные данные товара' : 'Данные записи'}</summary>
        <p className="text-xs text-gray-500 my-2">Редактируйте JSON только если нужно изменить поля, которых нет в форме выше.</p>
        <textarea aria-label="Данные записи" value={text} onChange={e => setText(e.target.value)} className="w-full h-96 font-mono text-sm border rounded-xl p-3" />
      </details>
      {['products', 'news', 'banners'].includes(section) && <label className="block mt-3 text-sm">
        Загрузить изображение
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={uploading} className="block mt-1" />
        <button type="button" onClick={removeImage} className="mt-2 text-red-600">Удалить текущее изображение</button>
      </label>}
      <div className="flex justify-end gap-3 mt-5">
        <button onClick={onClose} className="px-4 py-2 border rounded-lg">Отмена</button>
        <button onClick={save} disabled={uploading} className="px-4 py-2 bg-brand-600 text-white rounded-lg">Сохранить</button>
      </div>
    </div>
  </div>;
}

function Settings({ value, onSaved }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [message, setMessage] = useState('');
  const save = async () => {
    try {
      await api('/admin/settings', { method: 'PUT', body: JSON.parse(text) });
      setMessage('Настройки сохранены');
      onSaved();
    } catch (e) { setMessage(e.message); }
  };
  const uploadSetting = async (field, file) => {
    if (!file) return;
    try {
      const result = await uploadImage(file);
      const parsed = JSON.parse(text);
      parsed[field] = result.url;
      setText(JSON.stringify(parsed, null, 2));
      setMessage(`${field === 'logo' ? 'Логотип' : 'Favicon'} загружен. Нажмите «Сохранить настройки».`);
    } catch (e) { setMessage(e.message); }
  };
  return <div>
    <p className="text-gray-500 mb-4">Здесь редактируются контакты, соцсети, логотип, favicon, SEO, страницы «О нас» и «Оплата и доставка».</p>
    {message && <p className="bg-blue-50 text-blue-800 p-3 rounded-lg mb-3">{message}</p>}
    <textarea value={text} onChange={e => setText(e.target.value)} className="w-full h-[520px] font-mono text-sm border rounded-xl p-4" />
    <div className="grid sm:grid-cols-2 gap-3 mt-3">
      <label className="border rounded-lg p-3 text-sm">Загрузить логотип
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => uploadSetting('logo', e.target.files?.[0])} className="block mt-2" />
      </label>
      <label className="border rounded-lg p-3 text-sm">Загрузить favicon
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => uploadSetting('favicon', e.target.files?.[0])} className="block mt-2" />
      </label>
    </div>
    <button onClick={save} className="mt-3 px-5 py-2.5 bg-brand-600 text-white rounded-lg">Сохранить настройки</button>
  </div>;
}

export default function AdminPage() {
  const [auth, setAuth] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [section, setSection] = useState('products');
  const [editor, setEditor] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const load = async () => {
    try { setSnapshot(await api('/admin/snapshot')); setAuth(true); setError(''); }
    catch (e) { if (/авторизац/i.test(e.message)) setAuth(false); else setError(e.message); }
  };
  useEffect(() => { api('/auth/me').then(load).catch(() => setAuth(false)); }, []);
  const rows = useMemo(() => {
    const source = snapshot?.[section] || [];
    const needle = query.toLowerCase();
    return source.filter(item => JSON.stringify(item).toLowerCase().includes(needle));
  }, [query, section, snapshot]);
  if (auth === null) return <div className="p-10 text-center">Проверка доступа…</div>;
  if (!auth) return <Login onLogin={load} />;
  const remove = async (item) => {
    if (!confirm(`Удалить «${item.name || item.title || item.number || item.id}»?`)) return;
    try { await api(`/admin/${section}/${encodeURIComponent(item.id)}`, { method: 'DELETE' }); load(); }
    catch (e) { setError(e.message); }
  };
  const logout = async () => { await api('/auth/logout', { method: 'POST' }); setAuth(false); };
  return <div className="max-w-7xl mx-auto px-4 py-8">
    <Seo title="Админ-панель MacLuck" noindex />
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-3xl font-bold">Управление сайтом</h1><p className="text-gray-500">MacLuck</p></div>
      <button onClick={logout} className="border rounded-lg px-4 py-2">Выйти</button>
    </div>
    {error && <p className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</p>}
    {snapshot?.system && <p className={`p-3 rounded-lg mb-4 text-sm ${snapshot.system.telegramConfigured ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
      Telegram-уведомления: {snapshot.system.telegramConfigured ? 'настроены' : 'не настроены — добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в переменные Timeweb'}
    </p>}
    {snapshot?.system?.persistentStorage === false && <p className="p-3 rounded-lg mb-4 text-sm bg-red-50 text-red-800">
      Постоянное хранилище не подключено: изменения каталога, изображения и заказы могут исчезнуть после нового деплоя.
    </p>}
    <div className="grid lg:grid-cols-[220px_1fr] gap-6">
      <nav className="bg-white border rounded-2xl p-2 h-fit" aria-label="Разделы админ-панели">
        {sections.map(([key, label]) => <button key={key} onClick={() => { setSection(key); setQuery(''); }} className={`w-full text-left px-4 py-2.5 rounded-xl ${section === key ? 'bg-brand-600 text-white' : 'hover:bg-gray-50'}`}>{label}</button>)}
      </nav>
      <section className="bg-white border rounded-2xl p-5 min-w-0">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
          <h2 className="text-xl font-bold">{sections.find(s => s[0] === section)?.[1]}</h2>
          {section !== 'settings' && section !== 'orders' && <button onClick={() => setEditor(templates[section])} className="bg-brand-600 text-white rounded-lg px-4 py-2">Добавить</button>}
        </div>
        {section === 'settings' ? <Settings value={snapshot.settings} onSaved={load} /> : <>
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск…" className="w-full border rounded-lg px-3 py-2 mb-4" />
          {!rows.length ? <p className="py-12 text-center text-gray-500">Записей нет</p> :
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="py-3">Название</th><th>Статус/цена</th><th className="text-right">Действия</th></tr></thead>
            <tbody>{rows.map(item => <tr key={item.id} className="border-b last:border-0">
              <td className="py-3 pr-4"><div className="font-medium">{item.name || item.title || item.number || item.slug || item.id}</div><div className="text-xs text-gray-400">{item.slug || item.createdAt || ''}</div></td>
              <td>{item.status || (item.price != null ? `${Number(item.price).toLocaleString('ru-RU')} ₽` : item.published === false ? 'Черновик' : '')}</td>
              <td className="text-right whitespace-nowrap"><button onClick={() => setEditor(item)} className="text-brand-600 px-2 py-1">Изменить</button>{section !== 'orders' && <button onClick={() => remove(item)} className="text-red-600 px-2 py-1">Удалить</button>}</td>
            </tr>)}</tbody>
          </table></div>}
        </>}
      </section>
    </div>
    {editor && <Editor section={section} value={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />}
  </div>;
}
