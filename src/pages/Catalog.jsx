import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import { useCatalog } from '../context/CatalogContext';
import { useSite } from '../context/SiteContext';
import Seo from '../components/Seo';

const RAM_RELEVANT = ['MacBook'];
const SIM_RELEVANT = ['iPhone', 'iPad'];

// Extract RAM value from techSpecs
function extractRam(p) {
  return p.techSpecs?.find((t) => t.label === 'Оперативная память')?.value || null;
}

// Extract screen diagonal from techSpecs Дисплей
function extractScreen(p) {
  const display = p.techSpecs?.find((t) => t.label === 'Дисплей')?.value;
  if (!display) return null;
  const m = display.match(/([\d.]+)"/);
  if (!m) return null;
  const d = parseFloat(m[1]);
  return Math.round(d); // round to nearest integer for grouping
}

export default function Catalog() {
  const { products } = useCatalog();
  const { data: siteData } = useSite();
  const customFilters = siteData?.filters || [];
  const [searchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // Category from URL
  const [categoryFilter, setCategoryFilter] = useState(() => {
    const cat = searchParams.get('category');
    return cat ? [cat] : [];
  });

  // Individual filter states
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedStorage, setSelectedStorage] = useState([]);
  const [selectedScreens, setSelectedScreens] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedRam, setSelectedRam] = useState([]);
  const [selectedSim, setSelectedSim] = useState([]);
  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [selectedCustom, setSelectedCustom] = useState({});
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500000 });
  const [sort, setSort] = useState('popular');

  // Price bounds (global)
  const allPrices = products.map((p) => p.price);
  const priceBounds = { min: Math.min(...allPrices), max: Math.max(...allPrices) };

  // Determine which context-sensitive filters to show based on current category
  const filterContext = useMemo(() => {
    const ctx = categoryFilter.length > 0
      ? products.filter((p) => categoryFilter.includes(p.category))
      : products;
    const subs = new Set(ctx.map((p) => p.subcategory));
    return {
      showRam: RAM_RELEVANT.some((s) => subs.has(s)),
      showSim: SIM_RELEVANT.some((s) => subs.has(s)),
    };
  }, [products, categoryFilter]);

  // Derived filter options
  const filterMeta = useMemo(() => {
    // Brands
    const brandSet = new Set(products.map((p) => p.brand));

    // Colors from Цвет spec
    const colorMap = {};
    products.forEach((p) => {
      const spec = p.specs.find((s) => s.name === 'Цвет');
      if (spec) {
        spec.options.forEach((o) => {
          colorMap[o.label] = true;
        });
      }
    });

    // Storage from Память / Объём памяти spec
    const storageSet = new Set();
    products.forEach((p) => {
      const spec = p.specs.find((s) => s.name === 'Память' || s.name === 'Объём памяти');
      if (spec) {
        spec.options.forEach((o) => storageSet.add(o.label));
      }
    });

    // Screen diagonals
    const screenSet = new Set();
    products.forEach((p) => {
      const d = extractScreen(p);
      if (d) screenSet.add(d);
    });

    // Years
    const yearSet = new Set();
    products.forEach((p) => {
      if (p.year) yearSet.add(String(p.year));
    });

    // RAM — only from relevant subcategories
    const ramSet = new Set();
    products.forEach((p) => {
      if (RAM_RELEVANT.includes(p.subcategory)) {
        const r = extractRam(p);
        if (r) ramSet.add(r);
      }
    });

    // SIM — only from relevant subcategories
    const simSet = new Set();
    products.forEach((p) => {
      if (SIM_RELEVANT.includes(p.subcategory)) {
        const sim = p.techSpecs?.find((t) => t.label === 'SIM-конфигурация')?.value;
        if (sim) simSet.add(sim);
      }
    });

    return {
      brands: [...brandSet].sort(),
      colors: Object.keys(colorMap).sort(),
      storageOptions: [...storageSet].sort((a, b) => {
        const num = (s) => parseFloat(s.replace(/[^\d.]/g, ''));
        const unit = (s) => s.includes('ТБ') ? 1024 : 1;
        return num(a) * unit(a) - num(b) * unit(b);
      }),
      screenDiagonals: [...screenSet].sort((a, b) => a - b).map(String),
      years: [...yearSet].sort().reverse(),
      ramOptions: [...ramSet].sort(),
      simOptions: [...simSet].sort(),
    };
  }, [products]);

  // Availability options are always the same
  const availabilityOptions = ['В наличии', 'Под заказ'];

  // Toggle helpers
  const toggleBrand = (v) => setSelectedBrands((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleColor = (v) => setSelectedColors((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleStorage = (v) => setSelectedStorage((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleScreen = (v) => setSelectedScreens((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleYear = (v) => setSelectedYears((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleAvailability = (v) => setSelectedAvailability((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleRam = (v) => setSelectedRam((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleSim = (v) => setSelectedSim((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleCustom = (slug, value) => setSelectedCustom((prev) => {
    const current = prev[slug] || [];
    return { ...prev, [slug]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] };
  });

  // Active filter count
  const activeCount =
    selectedBrands.length +
    selectedColors.length +
    selectedStorage.length +
    selectedScreens.length +
    selectedYears.length +
    selectedRam.length +
    selectedSim.length +
    selectedAvailability.length +
    Object.values(selectedCustom).reduce((sum, values) => sum + values.length, 0) +
    (priceRange.min !== priceBounds.min || priceRange.max !== priceBounds.max ? 1 : 0);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const description = p.description?.toLowerCase() || '';
        const techText = p.techSpecs?.map((t) => t.value?.toLowerCase() || '').join(' ') || '';
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q) ||
          description.includes(q) ||
          techText.includes(q)
        );
      });
    }

    // Category (from URL)
    if (categoryFilter.length > 0) {
      result = result.filter((p) => categoryFilter.includes(p.category));
    }

    // Brand
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    // Color
    if (selectedColors.length > 0) {
      result = result.filter((p) => {
        const spec = p.specs.find((s) => s.name === 'Цвет');
        return spec && spec.options.some((o) => selectedColors.includes(o.label));
      });
    }

    // Storage
    if (selectedStorage.length > 0) {
      result = result.filter((p) => {
        const spec = p.specs.find((s) => s.name === 'Память' || s.name === 'Объём памяти');
        return spec && spec.options.some((o) => selectedStorage.includes(o.label));
      });
    }

    // Screen diagonal
    if (selectedScreens.length > 0) {
      result = result.filter((p) => {
        const d = extractScreen(p);
        return d && selectedScreens.some((s) => d === parseInt(s));
      });
    }

    // Year
    if (selectedYears.length > 0) {
      result = result.filter((p) => p.year && selectedYears.includes(String(p.year)));
    }

    // RAM
    if (selectedRam.length > 0) {
      result = result.filter((p) => {
        const r = extractRam(p);
        return r && selectedRam.includes(r);
      });
    }

    // SIM
    if (selectedSim.length > 0) {
      result = result.filter((p) => {
        const sim = p.techSpecs?.find((t) => t.label === 'SIM-конфигурация')?.value;
        return sim && selectedSim.includes(sim);
      });
    }

    // Availability
    if (selectedAvailability.length > 0) {
      const inStock = selectedAvailability.includes('В наличии');
      const preorder = selectedAvailability.includes('Под заказ');
      if (inStock && !preorder) {
        result = result.filter((p) => p.inStock);
      } else if (!inStock && preorder) {
        result = result.filter((p) => !p.inStock);
      }
    }

    for (const [slug, values] of Object.entries(selectedCustom)) {
      if (!values.length) continue;
      result = result.filter((p) => {
        const actual = p.filters?.[slug];
        return Array.isArray(actual) ? actual.some(v => values.includes(v)) : values.includes(actual);
      });
    }

    // Price
    result = result.filter((p) => p.price >= priceRange.min && p.price <= priceRange.max);

    // Sort
    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
        break;
      default:
        result.sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0));
        break;
    }

    return result;
  }, [products, searchQuery, categoryFilter, selectedBrands, selectedColors, selectedStorage, selectedScreens, selectedYears, selectedRam, selectedSim, selectedAvailability, selectedCustom, priceRange, sort]);

  const resetFilters = () => {
    setCategoryFilter([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedStorage([]);
    setSelectedScreens([]);
    setSelectedYears([]);
    setSelectedRam([]);
    setSelectedSim([]);
    setSelectedAvailability([]);
    setSelectedCustom({});
    setPriceRange({ min: priceBounds.min, max: priceBounds.max });
    setSearchQuery('');
  };

  if (products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Загрузка каталога...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Seo title="Каталог — MacLuck" description="Каталог техники и аксессуаров MacLuck" />
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4 flex-wrap">
        <a href="/" className="hover:text-brand-600 transition">Главная</a>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
        <span className="text-gray-900 font-medium">Каталог</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Все товары</h1>
          <p className="text-sm text-gray-500 mt-1">{filteredProducts.length} товаров</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 focus:border-brand-500 outline-none text-sm bg-white"
          >
            <option value="popular">Сначала популярные</option>
            <option value="price-asc">Цена: по возрастанию</option>
            <option value="price-desc">Цена: по убыванию</option>
            <option value="rating">По рейтингу</option>
            <option value="newest">Сначала новинки</option>
          </select>
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition relative"
          >
            <SlidersHorizontal size={16} />
            Фильтры
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск в категории..."
          className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition text-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition">
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Desktop filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 p-5 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <FilterSidebar
              brands={filterMeta.brands}
              selectedBrands={selectedBrands}
              onToggleBrand={toggleBrand}
              priceBounds={priceBounds}
              priceRange={priceRange}
              onPriceChange={setPriceRange}
              colors={filterMeta.colors.map((label) => ({ label }))}
              selectedColors={selectedColors}
              onToggleColor={toggleColor}
              storageOptions={filterMeta.storageOptions}
              selectedStorage={selectedStorage}
              onToggleStorage={toggleStorage}
              screenDiagonals={filterMeta.screenDiagonals}
              selectedScreens={selectedScreens}
              onToggleScreen={toggleScreen}
              years={filterMeta.years}
              selectedYears={selectedYears}
              onToggleYear={toggleYear}
              ramOptions={filterMeta.ramOptions}
              selectedRam={selectedRam}
              onToggleRam={toggleRam}
              showRam={filterContext.showRam}
              simOptions={filterMeta.simOptions}
              selectedSim={selectedSim}
              onToggleSim={toggleSim}
              showSim={filterContext.showSim}
              availabilityOptions={availabilityOptions}
              selectedAvailability={selectedAvailability}
              onToggleAvailability={toggleAvailability}
              customFilters={customFilters}
              selectedCustom={selectedCustom}
              onToggleCustom={toggleCustom}
              onReset={resetFilters}
              activeCount={activeCount}
            />
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-2">Товары не найдены.</p>
              <button onClick={resetFilters} className="text-brand-600 hover:underline text-sm">
                Сбросить фильтры и поиск
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters modal */}
      {showMobileFilters && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed right-0 top-0 h-full w-[85%] max-w-sm bg-white z-[60] shadow-2xl animate-[slideIn_0.2s_ease-out] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900">Фильтры</h3>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <FilterSidebar
                brands={filterMeta.brands}
                selectedBrands={selectedBrands}
                onToggleBrand={toggleBrand}
                priceBounds={priceBounds}
                priceRange={priceRange}
                onPriceChange={setPriceRange}
                colors={filterMeta.colors.map((label) => ({ label }))}
                selectedColors={selectedColors}
                onToggleColor={toggleColor}
                storageOptions={filterMeta.storageOptions}
                selectedStorage={selectedStorage}
                onToggleStorage={toggleStorage}
                screenDiagonals={filterMeta.screenDiagonals}
                selectedScreens={selectedScreens}
                onToggleScreen={toggleScreen}
                years={filterMeta.years}
                selectedYears={selectedYears}
                onToggleYear={toggleYear}
                ramOptions={filterMeta.ramOptions}
                selectedRam={selectedRam}
                onToggleRam={toggleRam}
                showRam={filterContext.showRam}
                simOptions={filterMeta.simOptions}
                selectedSim={selectedSim}
                onToggleSim={toggleSim}
                showSim={filterContext.showSim}
                availabilityOptions={availabilityOptions}
                selectedAvailability={selectedAvailability}
                onToggleAvailability={toggleAvailability}
                customFilters={customFilters}
                selectedCustom={selectedCustom}
                onToggleCustom={toggleCustom}
                onReset={resetFilters}
                activeCount={activeCount}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
