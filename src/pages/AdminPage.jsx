import { useEffect, useMemo, useState } from 'react';
import { api, uploadImage } from '../lib/api';
import Seo from '../components/Seo';

const sections = [
  ['products', 'Товары'], ['categories', 'Категории'], ['filters', 'Фильтры'],
  ['news', 'Новости'], ['banners', 'Баннеры'], ['orders', 'Заказы'],
  ['legal', 'Документы'], ['settings', 'Настройки'],
];

const templates = {
  products: { name: '', slug: '', brand: '', category: '', subcategory: '', price: 0, originalPrice: 0, image: '', description: '', inStock: true, specs: [], techSpecs: [], filters: {}, published: true },
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

function Editor({ section, value, onClose, onSaved }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
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
    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
      <h2 className="text-xl font-bold mb-3">{value.id ? 'Редактирование' : 'Новая запись'}</h2>
      <p className="text-sm text-gray-500 mb-3">Поля представлены в JSON: строки — в кавычках, списки — в квадратных скобках.</p>
      {error && <p className="bg-red-50 text-red-700 p-3 rounded-lg mb-3">{error}</p>}
      <textarea aria-label="Данные записи" value={text} onChange={e => setText(e.target.value)} className="w-full h-96 font-mono text-sm border rounded-xl p-3" />
      {['products', 'news', 'banners'].includes(section) && <label className="block mt-3 text-sm">
        Загрузить изображение
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={upload} disabled={uploading} className="block mt-1" />
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
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => uploadSetting('logo', e.target.files?.[0])} className="block mt-2" />
      </label>
      <label className="border rounded-lg p-3 text-sm">Загрузить favicon
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => uploadSetting('favicon', e.target.files?.[0])} className="block mt-2" />
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
