import { useEffect, useMemo, useState } from 'react';
import { api, uploadImage } from '../lib/api';
import Seo from '../components/Seo';
import NewsEditor from '../components/NewsEditor';
import { createNewsSlug } from '../lib/news';
import { getSimConfigForProduct } from '../data/simConfig';
import { getProductPrice, getVariantPriceKey } from '../utils/productVariants';

const sections = [
  ['products', 'Товары'], ['categories', 'Категории'], ['filters', 'Фильтры'],
  ['news', 'Новости'], ['banners', 'Баннеры'], ['orders', 'Заказы'],
  ['legal', 'Документы'], ['settings', 'Настройки'],
];

const templates = {
  products: { name: '', slug: '', brand: '', category: '', subcategory: '', price: 0, originalPrice: 0, image: '', images: [], description: '', inStock: true, specs: [], configurationPrices: {}, variantPrices: {}, unavailableVariants: [], colorImages: {}, techSpecs: [], filters: {}, published: true },
  categories: { name: '', slug: '', logo: '', children: [] },
  filters: { name: '', slug: '', values: [] },
  news: { title: '', slug: '', summary: '', content: '', image: '', date: '', category: '', author: 'MacLuck', published: true, seoTitle: '', seoDescription: '' },
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

function ProductFieldsEditor({ product, onChange, categories = [] }) {
  const update = (field, value) => onChange({ ...product, [field]: value });
  const selectedCategory = categories.find((category) => category.slug === product.category);
  const keyContains = (key, specName, optionValue) => {
    try { return new URLSearchParams(String(key)).get(specName) === String(optionValue); }
    catch { return false; }
  };

  const addSpec = (name = '') => {
    if (name && (product.specs || []).some((spec) => spec.name === name)) return;
    onChange({
      ...product,
      specs: [...(product.specs || []), { name, options: [{ label: '', value: '' }] }],
    });
  };

  const updateSpecName = (specIndex, name) => {
    const specs = structuredClone(product.specs || []);
    specs[specIndex].name = name;
    onChange({ ...product, specs });
  };

  const updateSpecOption = (specIndex, optionIndex, label) => {
    const specs = structuredClone(product.specs || []);
    const option = specs[specIndex].options[optionIndex];
    const previousAutoValue = createNewsSlug(option.label);
    option.label = label;
    if (!option.value || option.value === previousAutoValue) option.value = createNewsSlug(label);
    onChange({ ...product, specs });
  };

  const addSpecOption = (specIndex) => {
    const specs = structuredClone(product.specs || []);
    specs[specIndex].options.push({ label: '', value: '' });
    onChange({ ...product, specs });
  };

  const removeSpecOption = (specIndex, optionIndex) => {
    const specs = structuredClone(product.specs || []);
    const specName = specs[specIndex].name;
    const [removed] = specs[specIndex].options.splice(optionIndex, 1);
    const next = { ...product, specs };
    if (next.configurationPrices?.[specName]) {
      next.configurationPrices = structuredClone(next.configurationPrices);
      delete next.configurationPrices[specName][removed.value];
    }
    if (next.variantPrices) {
      next.variantPrices = Object.fromEntries(Object.entries(next.variantPrices).filter(([key]) => !keyContains(key, specName, removed.value)));
    }
    if (Array.isArray(next.unavailableVariants)) {
      next.unavailableVariants = next.unavailableVariants.filter((key) => !keyContains(key, specName, removed.value));
    }
    if (specName === 'Цвет' && next.colorImages) {
      next.colorImages = { ...next.colorImages };
      delete next.colorImages[removed.value];
    }
    onChange(next);
  };

  const removeSpec = (specIndex) => {
    const specs = structuredClone(product.specs || []);
    const [removed] = specs.splice(specIndex, 1);
    const next = { ...product, specs };
    if (removed?.name && next.configurationPrices?.[removed.name]) {
      next.configurationPrices = { ...next.configurationPrices };
      delete next.configurationPrices[removed.name];
    }
    if (removed?.name && next.variantPrices) {
      next.variantPrices = Object.fromEntries(Object.entries(next.variantPrices).filter(([key]) => {
        try { return !new URLSearchParams(String(key)).has(removed.name); }
        catch { return true; }
      }));
    }
    if (removed?.name && Array.isArray(next.unavailableVariants)) {
      next.unavailableVariants = next.unavailableVariants.filter((key) => {
        try { return !new URLSearchParams(String(key)).has(removed.name); }
        catch { return true; }
      });
    }
    if (removed?.name === 'Цвет') next.colorImages = {};
    onChange(next);
  };

  const addTechSpec = () => {
    onChange({
      ...product,
      techSpecs: [...(product.techSpecs || []), { label: '', value: '' }],
    });
  };

  const updateTechSpec = (index, field, value) => {
    const techSpecs = structuredClone(product.techSpecs || []);
    techSpecs[index][field] = value;
    onChange({ ...product, techSpecs });
  };

  const removeTechSpec = (index) => {
    const techSpecs = structuredClone(product.techSpecs || []);
    techSpecs.splice(index, 1);
    onChange({ ...product, techSpecs });
  };

  return <div className="space-y-5 mb-5">
    <section className="border rounded-xl p-4 bg-gray-50">
      <h3 className="font-semibold text-lg">Основная информация</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">Заполните обычные поля. Код редактировать не требуется.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm font-medium sm:col-span-2">Название товара <span className="text-red-600">*</span>
          <input value={product.name || ''} onChange={(event) => update('name', event.target.value)} placeholder="Например, iPhone 17" className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-medium">Адрес страницы
          <input value={product.slug || ''} onChange={(event) => update('slug', createNewsSlug(event.target.value))} placeholder="Создастся из названия" className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-medium">Бренд
          <input value={product.brand || ''} onChange={(event) => update('brand', event.target.value)} placeholder="Apple" className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-medium">Категория
          <select
            value={product.category || ''}
            onChange={(event) => {
              const category = categories.find((item) => item.slug === event.target.value);
              onChange({ ...product, category: event.target.value, brand: product.brand || category?.name || '', subcategory: '' });
            }}
            className="mt-1 w-full border rounded-lg px-3 py-2 bg-white font-normal"
          >
            <option value="">Выберите категорию</option>
            {categories.map((category) => <option key={category.id || category.slug} value={category.slug}>{category.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Подкатегория
          <select value={product.subcategory || ''} onChange={(event) => update('subcategory', event.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 bg-white font-normal">
            <option value="">Выберите подкатегорию</option>
            {(selectedCategory?.children || []).map((child) => <option key={child.id || child.slug} value={child.name}>{child.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Основная цена, ₽ <span className="text-red-600">*</span>
          <input type="number" min="0" step="1" value={product.price ?? ''} onChange={(event) => update('price', event.target.value === '' ? '' : Number(event.target.value))} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-medium">Старая цена, ₽
          <input type="number" min="0" step="1" value={product.originalPrice ?? ''} onChange={(event) => update('originalPrice', event.target.value === '' ? 0 : Number(event.target.value))} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">Описание
          <textarea rows="4" value={product.description || ''} onChange={(event) => update('description', event.target.value)} placeholder="Краткое описание товара" className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" />
        </label>
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={product.inStock !== false} onChange={(event) => update('inStock', event.target.checked)} /> Товар в наличии</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={product.published !== false} onChange={(event) => update('published', event.target.checked)} /> Показывать на сайте</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(product.isNew)} onChange={(event) => update('isNew', event.target.checked)} /> Новинка</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(product.isClearance)} onChange={(event) => update('isClearance', event.target.checked)} /> Уценка</label>
      </div>
    </section>

    <section className="border rounded-xl p-4 bg-gray-50">
      <h3 className="font-semibold text-lg">Характеристики и варианты</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">Добавьте память, SIM, цвета и другие варианты кнопками. Внутренние значения сайт сформирует сам.</p>
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" onClick={() => addSpec('Память')} className="border bg-white rounded-lg px-3 py-2 text-sm">+ Память</button>
        <button type="button" onClick={() => addSpec('SIM-конфигурация')} className="border bg-white rounded-lg px-3 py-2 text-sm">+ SIM-конфигурация</button>
        <button type="button" onClick={() => addSpec('Цвет')} className="border bg-white rounded-lg px-3 py-2 text-sm">+ Цвет</button>
        <button type="button" onClick={() => addSpec('')} className="border bg-white rounded-lg px-3 py-2 text-sm">+ Другая характеристика</button>
      </div>
      {!(product.specs || []).length ? <p className="text-sm text-amber-700">Характеристики пока не добавлены.</p> : <div className="space-y-4">
        {(product.specs || []).map((spec, specIndex) => <div key={`${spec.name}-${specIndex}`} className="bg-white border rounded-xl p-3">
          <div className="flex gap-2 items-end mb-3">
            <label className="text-sm font-medium flex-1">Название характеристики
              <input value={spec.name || ''} onChange={(event) => updateSpecName(specIndex, event.target.value)} placeholder="Например, Память" className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" />
            </label>
            <button type="button" onClick={() => removeSpec(specIndex)} className="text-red-600 px-2 py-2">Удалить характеристику</button>
          </div>
          <p className="text-sm font-medium mb-2">Варианты</p>
          <div className="space-y-2">
            {(spec.options || []).map((option, optionIndex) => <div key={`${option.value}-${optionIndex}`} className="flex gap-2">
              <input value={option.label || ''} onChange={(event) => updateSpecOption(specIndex, optionIndex, event.target.value)} placeholder="Например, 256 ГБ" className="min-w-0 flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button type="button" onClick={() => removeSpecOption(specIndex, optionIndex)} className="text-red-600 px-2" aria-label="Удалить вариант">Удалить</button>
            </div>)}
            <button type="button" onClick={() => addSpecOption(specIndex)} className="text-sm text-brand-600">+ Добавить вариант</button>
          </div>
        </div>)}
      </div>}
    </section>

    <section className="border rounded-xl p-4 bg-gray-50">
      <h3 className="font-semibold text-lg">Технические характеристики</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">Эти строки отображаются в карточке товара в таблице «Характеристики».</p>
      {!(product.techSpecs || []).length ? <p className="text-sm text-amber-700 mb-3">Технические характеристики пока не добавлены.</p> : <div className="space-y-2 mb-3">
        {(product.techSpecs || []).map((spec, index) => <div key={index} className="grid sm:grid-cols-[1fr_1.5fr_auto] gap-2 items-center">
          <input
            value={spec.label || ''}
            onChange={(event) => updateTechSpec(index, 'label', event.target.value)}
            placeholder="Название, например Дисплей"
            aria-label={`Название технической характеристики ${index + 1}`}
            className="min-w-0 border rounded-lg px-3 py-2 text-sm bg-white"
          />
          <input
            value={spec.value || ''}
            onChange={(event) => updateTechSpec(index, 'value', event.target.value)}
            placeholder="Значение, например 6,3 дюйма OLED"
            aria-label={`Значение технической характеристики ${index + 1}`}
            className="min-w-0 border rounded-lg px-3 py-2 text-sm bg-white"
          />
          <button type="button" onClick={() => removeTechSpec(index)} className="text-red-600 px-2 py-2">Удалить</button>
        </div>)}
      </div>}
      <button type="button" onClick={addTechSpec} className="border bg-white rounded-lg px-3 py-2 text-sm text-brand-600">+ Добавить характеристику</button>
    </section>
  </div>;
}

function ProductVariantEditor({ product, onChange, setError, uploading, setUploading }) {
  const priceSpecs = (product.specs || []).filter(
    (spec) => spec.name !== 'Цвет' && Array.isArray(spec.options) && spec.options.length
  );
  const colorSpec = (product.specs || []).find(
    (spec) => spec.name === 'Цвет' && Array.isArray(spec.options) && spec.options.length
  );
  const configuredSimOptions = getSimConfigForProduct(String(product.id || product.slug || '')) || [];
  const hasSimSpec = priceSpecs.some((spec) => spec.name === 'SIM-конфигурация');
  const variantSpecs = configuredSimOptions.length && !hasSimSpec
    ? [...priceSpecs, {
        name: 'SIM-конфигурация',
        options: configuredSimOptions.map((value) => ({ label: value, value })),
      }]
    : priceSpecs;
  const usesSimMatrix = variantSpecs.some((spec) => spec.name === 'SIM-конфигурация');
  const variantCombinations = variantSpecs.reduce(
    (combinations, spec) => combinations.flatMap((combination) => spec.options.map((option) => ({
      selections: { ...combination.selections, [spec.name]: option.value },
      labels: [...combination.labels, `${spec.name}: ${option.label}`],
    }))),
    [{ selections: {}, labels: [] }]
  );
  const clone = () => JSON.parse(JSON.stringify(product));

  const variantKeyContainsOption = (key, specName, optionValue) => {
    try {
      return new URLSearchParams(String(key)).get(specName) === String(optionValue);
    } catch {
      return false;
    }
  };

  const removeSpecOption = (specName, optionValue, optionLabel) => {
    const currentSpec = (product.specs || []).find((spec) => spec.name === specName);
    if (!currentSpec) return;
    if ((currentSpec.options || []).length <= 1) {
      setError(`Нельзя удалить последний вариант характеристики «${specName}».`);
      return;
    }
    if (!window.confirm(`Удалить вариант «${optionLabel}» из характеристики «${specName}»?`)) return;

    const next = clone();
    const spec = (next.specs || []).find((item) => item.name === specName);
    spec.options = (spec.options || []).filter(
      (option) => String(option.value) !== String(optionValue)
    );

    if (next.configurationPrices?.[specName]) {
      delete next.configurationPrices[specName][optionValue];
      if (!Object.keys(next.configurationPrices[specName]).length) {
        delete next.configurationPrices[specName];
      }
    }
    if (next.variantPrices) {
      next.variantPrices = Object.fromEntries(
        Object.entries(next.variantPrices).filter(
          ([key]) => !variantKeyContainsOption(key, specName, optionValue)
        )
      );
    }
    if (Array.isArray(next.unavailableVariants)) {
      next.unavailableVariants = next.unavailableVariants.filter(
        (key) => !variantKeyContainsOption(key, specName, optionValue)
      );
    }
    if (specName === 'Цвет' && next.colorImages) delete next.colorImages[optionValue];
    setError('');
    onChange(next);
  };

  const updatePrice = (specName, optionValue, value) => {
    const next = clone();
    next.configurationPrices ||= {};
    next.configurationPrices[specName] ||= {};
    if (value === '') delete next.configurationPrices[specName][optionValue];
    else next.configurationPrices[specName][optionValue] = Math.max(0, Number(value) || 0);
    onChange(next);
  };

  const updateVariantPrice = (selections, value) => {
    const next = clone();
    const key = getVariantPriceKey(selections);
    next.variantPrices ||= {};
    if (value === '') delete next.variantPrices[key];
    else next.variantPrices[key] = Math.max(0, Number(value) || 0);
    onChange(next);
  };

  const updateVariantAvailability = (selections, available) => {
    const next = clone();
    const key = getVariantPriceKey(selections);
    const unavailable = new Set(Array.isArray(next.unavailableVariants) ? next.unavailableVariants : []);
    if (available) unavailable.delete(key);
    else unavailable.add(key);
    next.unavailableVariants = [...unavailable];
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
      <h3 className="font-semibold text-lg">Варианты товара</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">
        Здесь можно безопасно удалить несуществующий объём памяти, цвет или другой вариант. Связанные цены и настройки наличия удалятся автоматически.
      </p>
      <div className="space-y-4">
        {(product.specs || []).filter((spec) => Array.isArray(spec.options) && spec.options.length).map((spec) => <div key={spec.name}>
          <p className="font-medium mb-2">{spec.name}</p>
          <div className="flex flex-wrap gap-2">
            {spec.options.map((option) => <div key={option.value} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
              <span>{option.label}</span>
              <button
                type="button"
                onClick={() => removeSpecOption(spec.name, option.value, option.label)}
                className="font-medium text-red-600 hover:text-red-800"
                aria-label={`Удалить вариант ${option.label}`}
              >
                Удалить
              </button>
            </div>)}
          </div>
        </div>)}
      </div>
    </section>

    <section className="border rounded-xl p-4 bg-gray-50">
      <h3 className="font-semibold text-lg">Цены конфигураций</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">Укажите полную цену товара для каждого варианта. Пустое поле использует основную цену товара.</p>
      {!variantSpecs.length ? <p className="text-sm text-amber-700">Сначала добавьте варианты памяти или другой конфигурации в поле specs.</p> : usesSimMatrix ?
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Точные цены по памяти и SIM</p>
          <div className="grid md:grid-cols-2 gap-3">
            {variantCombinations.map((combination) => {
              const key = getVariantPriceKey(combination.selections);
              const fallbackPrice = getProductPrice({ ...product, variantPrices: {} }, combination.selections);
              const available = !product.unavailableVariants?.includes(key);
              return <div key={key} className={`text-sm bg-white border rounded-xl p-3 ${available ? '' : 'border-red-200 bg-red-50/40'}`}>
                <span className="block min-h-10 text-gray-700">{combination.labels.join(' · ')}</span>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={product.variantPrices?.[key] ?? ''}
                    onChange={(event) => updateVariantPrice(combination.selections, event.target.value)}
                    placeholder={String(fallbackPrice)}
                    className="w-full border rounded-lg px-3 py-2 pr-8 bg-white"
                  />
                  <span className="absolute right-3 top-2 text-gray-400">₽</span>
                </div>
                <label className="mt-3 flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(event) => updateVariantAvailability(combination.selections, event.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className={available ? 'text-green-700' : 'text-red-700'}>
                    {available ? 'Доступно к заказу' : 'Нет в наличии'}
                  </span>
                </label>
              </div>;
            })}
          </div>
        </div> :
        <div className="space-y-4">
          {priceSpecs.map((spec) => <div key={spec.name}>
            <p className="font-medium mb-2">{spec.name}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {spec.options.map((option) => {
                const selections = { [spec.name]: option.value };
                const key = getVariantPriceKey(selections);
                const available = !product.unavailableVariants?.includes(key);
                return <div key={option.value} className={`text-sm border rounded-xl p-3 ${available ? 'bg-white' : 'border-red-200 bg-red-50/40'}`}>
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
                  <label className="mt-3 flex items-center gap-2 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={available}
                      onChange={(event) => updateVariantAvailability(selections, event.target.checked)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span className={available ? 'text-green-700' : 'text-red-700'}>
                      {available ? 'Доступно к заказу' : 'Нет в наличии'}
                    </span>
                  </label>
                </div>;
              })}
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
function Editor({ section, value, categories, onClose, onSaved }) {
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
      if (section === 'products') {
        parsed.name = String(parsed.name || '').trim();
        if (!parsed.name) throw new Error('Введите название товара');
        parsed.slug = createNewsSlug(parsed.slug || parsed.name);
        if (!parsed.slug) throw new Error('Не удалось создать адрес товара — измените название');
        if (!Number.isFinite(Number(parsed.price)) || Number(parsed.price) < 0) throw new Error('Укажите корректную цену товара');
        if ((parsed.specs || []).some((spec) => !String(spec.name || '').trim() || !Array.isArray(spec.options) || !spec.options.length || spec.options.some((option) => !String(option.label || '').trim()))) {
          throw new Error('Заполните названия всех характеристик и вариантов либо удалите пустые строки');
        }
        if ((parsed.techSpecs || []).some((spec) => !String(spec.label || '').trim() || !String(spec.value || '').trim())) {
          throw new Error('Заполните название и значение каждой технической характеристики либо удалите пустую строку');
        }
      }
      if (section === 'news') {
        parsed.title = String(parsed.title || '').trim();
        if (!parsed.title) throw new Error('Введите заголовок новости');
        parsed.slug = createNewsSlug(parsed.slug || parsed.title);
        if (!parsed.slug) throw new Error('Не удалось создать адрес новости — измените заголовок');
        if (!parsed.date) parsed.date = new Date().toISOString().slice(0, 10);
        if (!parsed.author) parsed.author = 'MacLuck';
      }
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
      else if (section === 'categories') parsed.logo = result.url;
      else parsed.image = result.url;
      setText(JSON.stringify(parsed, null, 2));
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };
  const removeImage = async () => {
    try {
      const parsed = JSON.parse(text);
      const current = section === 'banners' ? parsed.image_url : section === 'categories' ? parsed.logo : parsed.image;
      if (current?.startsWith('/uploads/')) {
        await api('/admin/upload', { method: 'DELETE', body: { url: current } });
      }
      if (section === 'banners') parsed.image_url = '';
      else if (section === 'categories') parsed.logo = '';
      else parsed.image = '';
      setText(JSON.stringify(parsed, null, 2));
    } catch (err) { setError(err.message); }
  };
  return <div className="fixed inset-0 z-50 bg-black/50 p-4 grid place-items-center" role="dialog" aria-modal="true">
    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto p-6">
      <h2 className="text-xl font-bold mb-3">{value.id ? 'Редактирование' : 'Новая запись'}</h2>
      <p className="text-sm text-gray-500 mb-3">{section === 'products' ? 'Заполните форму ниже. Открывать или редактировать код не нужно.' : section === 'news' ? 'Заполните поля новости. Адрес страницы создастся автоматически.' : 'Поля представлены в JSON: строки — в кавычках, списки — в квадратных скобках.'}</p>
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
      {section === 'products' && parsedRecord && <>
        <ProductFieldsEditor product={parsedRecord} onChange={updateRecord} categories={categories} />
        <ProductVariantEditor
          product={parsedRecord}
          onChange={updateRecord}
          setError={setError}
          uploading={uploading}
          setUploading={setUploading}
        />
      </>}
      {section === 'news' && parsedRecord && <NewsEditor article={parsedRecord} onChange={updateRecord} />}
      <details open={!['products', 'news'].includes(section)} className="border rounded-xl p-3">
        <summary className="font-medium cursor-pointer">{section === 'products' ? 'Для разработчика (JSON) — обычно не открывать' : section === 'news' ? 'Дополнительные настройки (JSON)' : 'Данные записи'}</summary>
        <p className="text-xs text-gray-500 my-2">Редактируйте JSON только если нужно изменить поля, которых нет в форме выше.</p>
        <textarea aria-label="Данные записи" value={text} onChange={e => setText(e.target.value)} className="w-full h-96 font-mono text-sm border rounded-xl p-3" />
      </details>
      {['products', 'categories', 'news', 'banners'].includes(section) && <label className="block mt-3 text-sm">
        {section === 'categories' ? 'Загрузить иконку категории' : section === 'news' ? 'Загрузить изображение новости' : 'Загрузить изображение'}
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={uploading} className="block mt-1" />
        {section === 'categories' && <span className="block mt-1 text-xs text-gray-500">Рекомендуется квадратное изображение PNG или WebP размером 512×512 px.</span>}
        {section === 'banners' && <span className="block mt-1 text-xs text-gray-500">Рекомендуемый размер: 2160×720 px, пропорция 3:1. Форматы JPG, PNG или WebP.</span>}
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
  const [telegramTest, setTelegramTest] = useState({ loading: false, message: '' });
  const [orderSending, setOrderSending] = useState('');
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
  const testTelegram = async () => {
    setTelegramTest({ loading: true, message: '' });
    try {
      await api('/admin/telegram-test', { method: 'POST' });
      setTelegramTest({ loading: false, message: 'Проверочное сообщение отправлено в Telegram' });
    } catch (telegramError) {
      setTelegramTest({ loading: false, message: telegramError.message });
    }
  };
  const sendOrderTelegram = async (order) => {
    setOrderSending(order.id);
    setError('');
    try {
      await api(`/admin/orders/${encodeURIComponent(order.id)}/telegram`, { method: 'POST' });
      setTelegramTest({ loading: false, message: `Заказ ${order.number} отправлен в Telegram` });
      await load();
    } catch (sendError) {
      setError(`Заказ ${order.number}: ${sendError.message}`);
    } finally {
      setOrderSending('');
    }
  };
  return <div className="max-w-7xl mx-auto px-4 py-8">
    <Seo title="Админ-панель MacLuck" noindex />
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-3xl font-bold">Управление сайтом</h1><p className="text-gray-500">MacLuck</p></div>
      <button onClick={logout} className="border rounded-lg px-4 py-2">Выйти</button>
    </div>
    {error && <p className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</p>}
    {snapshot?.system && <div className={`p-3 rounded-lg mb-4 text-sm ${snapshot.system.telegramConfigured ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>Telegram-уведомления: {snapshot.system.telegramConfigured
          ? `настроены${snapshot.system.telegramRecipient ? `, получатель ${snapshot.system.telegramRecipient}` : ''}`
          : 'не настроены — добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в переменные Timeweb'}</span>
        {snapshot.system.telegramConfigured && <button type="button" onClick={testTelegram} disabled={telegramTest.loading} className="px-3 py-1.5 rounded-lg bg-white border border-green-200 font-medium disabled:opacity-60">
          {telegramTest.loading ? 'Отправляем…' : 'Отправить тест'}
        </button>}
      </div>
      {telegramTest.message && <p className="mt-2 font-medium" role="status">{telegramTest.message}</p>}
    </div>}
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
              <td className="text-right whitespace-nowrap">
                {section === 'orders' && <button
                  type="button"
                  onClick={() => sendOrderTelegram(item)}
                  disabled={orderSending === item.id}
                  className="text-green-700 px-2 py-1 disabled:opacity-50"
                >{orderSending === item.id ? 'Отправляем…' : 'В Telegram'}</button>}
                <button onClick={() => setEditor(item)} className="text-brand-600 px-2 py-1">{section === 'orders' ? 'Открыть' : 'Изменить'}</button>
                {section !== 'orders' && <button onClick={() => remove(item)} className="text-red-600 px-2 py-1">Удалить</button>}
              </td>
            </tr>)}</tbody>
          </table></div>}
        </>}
      </section>
    </div>
    {editor && <Editor section={section} value={editor} categories={snapshot?.categories || []} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />}
  </div>;
}
