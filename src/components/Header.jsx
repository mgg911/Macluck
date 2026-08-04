import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Menu, X, Search, Truck, ChevronRight, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useCatalog } from '../context/CatalogContext';
import { useSite } from '../context/SiteContext';

const catalogMenu = [
  {
    id: 'iphone',
    label: 'iPhone',
    href: '/brand/iphone',
    children: [
      { label: 'Все модели', href: '/brand/iphone' },
      { label: 'iPhone 17 Pro Max', href: '/product/iphone-17-pro-max' },
      { label: 'iPhone 17 Pro', href: '/product/iphone-17-pro' },
      { label: 'iPhone 17e', href: '/product/iphone-17e' },
      { label: 'iPhone Air', href: '/product/iphone-air' },
      { label: 'iPhone 16 Pro Max', href: '/product/iphone-16-pro-max' },
      { label: 'iPhone 16 Pro', href: '/product/iphone-16-pro' },
      { label: 'iPhone 16e', href: '/product/iphone-16e' },
    ],
  },
  {
    id: 'ipad',
    label: 'iPad',
    href: '/brand/ipad',
    children: [
      { label: 'Все модели', href: '/brand/ipad' },
      { label: 'iPad Pro M4 13"', href: '/product/ipad-pro-m4' },
      { label: 'iPad Pro M4 11"', href: '/product/ipad-pro-m4-11' },
      { label: 'iPad Air M4 13"', href: '/product/ipad-air-m4-13' },
      { label: 'iPad Air M4 11"', href: '/product/ipad-air-m4-11' },
      { label: 'iPad mini A17 Pro', href: '/product/ipad-mini-a17-pro' },
      { label: 'iPad 11', href: '/product/ipad-11' },
    ],
  },
  {
    id: 'macbook',
    label: 'MacBook',
    href: '/brand/macbook',
    children: [
      { label: 'Все модели', href: '/brand/macbook' },
      { label: 'MacBook Pro 16" M4 Max', href: '/product/macbook-pro-16-m4-max' },
      { label: 'MacBook Pro 14" M4 Pro', href: '/product/macbook-pro-14-m4-pro' },
      { label: 'MacBook Pro 14" M4', href: '/product/macbook-pro-14-m4' },
      { label: 'MacBook Air 15" M4', href: '/product/macbook-air-15-m4' },
      { label: 'MacBook Air 13" M4', href: '/product/macbook-air-m4' },
    ],
  },
  {
    id: 'apple-watch',
    label: 'Apple Watch',
    href: '/brand/apple-watch',
    children: [
      { label: 'Все модели', href: '/brand/apple-watch' },
      { label: 'Apple Watch Ultra 3', href: '/product/apple-watch-ultra-3' },
      { label: 'Apple Watch Series 11', href: '/product/apple-watch-series-11' },
      { label: 'Apple Watch SE 3', href: '/product/apple-watch-se-3' },
    ],
  },
  {
    id: 'airpods',
    label: 'AirPods',
    href: '/brand/airpods',
    children: [
      { label: 'AirPods Pro 3', href: '/product/airpods-pro-3' },
      { label: 'AirPods 4', href: '/product/airpods-4' },
      { label: 'AirPods Max', href: '/product/airpods-max' },
    ],
  },
  {
    id: 'accessories',
    label: 'Аксессуары',
    href: '/brand/accessories',
    children: [
      { label: 'Все аксессуары', href: '/brand/accessories' },
      { label: 'Чехлы и защита', href: '/brand/accessories' },
      { label: 'AirTag', href: '/product/airtag' },
      { label: 'Apple Pencil Pro', href: '/product/apple-pencil-pro' },
      { label: 'Magic Keyboard', href: '/product/magic-keyboard-ipad-pro' },
      { label: 'MagSafe Charger', href: '/product/magsafe-charger' },
      { label: 'Power Bank', href: '/product/magsafe-battery-pack' },
      { label: 'HomePod mini', href: '/product/homepod-mini' },
      { label: 'Apple TV 4K', href: '/product/apple-tv-4k' },
    ],
  },
  {
    id: 'playstation',
    label: 'PlayStation',
    href: '/brand/playstation',
    children: [
      { label: 'Все модели', href: '/brand/playstation' },
      { label: 'PS5 Pro', href: '/product/ps5-pro' },
      { label: 'PS5 Slim', href: '/product/ps5-slim' },
      { label: 'DualSense Edge', href: '/product/dualsense-edge' },
    ],
  },
  {
    id: 'dyson',
    label: 'Dyson',
    href: '/brand/dyson',
    children: [
      { label: 'Все модели', href: '/brand/dyson' },
      { label: 'Dyson V15 Detect', href: '/product/dyson-v15-detect' },
      { label: 'Dyson Airwrap', href: '/product/dyson-airwrap' },
      { label: 'Dyson Supersonic', href: '/product/dyson-supersonic-nural' },
    ],
  },
];

function isActive(href, pathname) {
  if (href === pathname) return true;
  if (href.startsWith('/brand/') && pathname.startsWith(href)) return true;
  if (href.startsWith('/product/') && pathname === href) return true;
  return false;
}

function isCategoryActive(section, pathname) {
  return section.children.some((c) => isActive(c.href, pathname)) || isActive(section.href, pathname);
}

export default function Header() {
  const { data: siteData } = useSite();
  const { totalItems, setIsOpen } = useCart();
  const { favoritesCount } = useFavorites();
  const { products, categories } = useCatalog();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [hoveredSection, setHoveredSection] = useState(null);
  const catalogRef = useRef(null);
  const searchRef = useRef(null);
  const hoverTimeout = useRef(null);
  const menuSections = useMemo(() => categories.length ? categories.map((category) => ({
    id: category.slug,
    label: category.name,
    href: `/brand/${category.slug}`,
    children: (category.children || []).map((child) => ({
      label: child.name,
      href: `/brand/${child.slug}`,
    })),
  })) : catalogMenu, [categories]);

  // Live search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter((p) => {
        const description = p.description?.toLowerCase() || '';
        const techText = p.techSpecs?.map((t) => t.value?.toLowerCase() || '').join(' ') || '';
        return (
          String(p.name || '').toLowerCase().includes(q) ||
          String(p.brand || '').toLowerCase().includes(q) ||
          String(p.subcategory || '').toLowerCase().includes(q) ||
          description.includes(q) ||
          techText.includes(q)
        );
      })
      .slice(0, 8);
  }, [searchQuery, products]);

  // Close catalog dropdown on click outside
  useEffect(() => {
    function handleClick(e) {
      if (catalogRef.current && !catalogRef.current.contains(e.target)) {
        setCatalogOpen(false);
      }
    }
    if (catalogOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [catalogOpen]);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close catalog on route change
  useEffect(() => {
    setCatalogOpen(false);
    setMobileMenu(false);
  }, [pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchFocused(false);
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navigateToProduct = (id) => {
    setSearchQuery('');
    setSearchFocused(false);
    navigate(`/product/${id}`);
  };

  const formatPrice = (price) => {
    return price.toLocaleString('ru-RU') + ' ₽';
  };

  const showDropdown = searchFocused && searchResults.length > 0;

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-gray-900 text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-center md:justify-between items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Truck size={14} className="text-brand-400" />
            Доставка по всей России
          </span>
          <span className="hidden md:inline text-gray-400">Бесплатная доставка по Москве до 3 часов</span>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Mobile menu button */}
        <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition">
          {mobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img src={siteData?.settings?.logo || "/images/macluck-logo.png"} alt={siteData?.settings?.siteName || "MacLuck"} className="h-12 w-12 object-contain" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 ml-6">
          {/* Catalog dropdown */}
          <div ref={catalogRef} className="relative">
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              onMouseEnter={() => setCatalogOpen(true)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition flex items-center gap-1.5 ${
                catalogOpen || pathname.startsWith('/brand') || pathname.startsWith('/catalog')
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-gray-700 hover:text-brand-600 hover:bg-brand-50'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Каталог
            </button>

            {/* Dropdown panel — two-column layout */}
            <div
              onMouseLeave={() => {
                setCatalogOpen(false);
                setHoveredSection(null);
              }}
              className={`absolute left-0 top-full mt-1 w-[560px] bg-white rounded-2xl shadow-xl border border-gray-100 transition-all duration-200 origin-top-left flex ${
                catalogOpen
                  ? 'opacity-100 visible translate-y-0 scale-100'
                  : 'opacity-0 invisible translate-y-1 scale-95'
              }`}
              style={{ pointerEvents: catalogOpen ? 'auto' : 'none' }}
            >
              {/* Left column — categories */}
              <div className="w-[220px] flex-shrink-0 py-3 border-r border-gray-100">
                <Link
                  to="/catalog"
                  onClick={() => {
                    setCatalogOpen(false);
                    setHoveredSection(null);
                  }}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm transition ${
                    pathname === '/catalog' || pathname === '/search'
                      ? 'bg-brand-50 text-brand-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Все товары
                </Link>
                <div className="border-t border-gray-100 my-2 mx-4" />
                {menuSections.map((section) => {
                  const active = isCategoryActive(section, pathname);
                  const isHovered = hoveredSection === section.id;
                  return (
                    <Link
                      key={section.id}
                      to={section.href}
                      onMouseEnter={() => {
                        setHoveredSection(section.id);
                        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
                      }}
                      onClick={() => {
                        setCatalogOpen(false);
                        setHoveredSection(null);
                      }}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm transition ${
                        isHovered
                          ? 'bg-brand-50 text-brand-600 font-medium'
                          : active
                            ? 'text-brand-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {section.label}
                      <ChevronRight size={14} className={`text-gray-300 transition ${isHovered ? 'text-brand-400' : ''}`} />
                    </Link>
                  );
                })}
                {/* Divider */}
                <div className="border-t border-gray-100 my-2 mx-4" />
                <Link
                  to="/clearance"
                  onClick={() => {
                    setCatalogOpen(false);
                    setHoveredSection(null);
                  }}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium transition ${
                    pathname === '/clearance'
                      ? 'text-orange-600 font-medium'
                      : 'text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                  }`}
                >
                  Уценка
                </Link>
              </div>

              {/* Right column — subcategories */}
              <div className="flex-1 py-4 px-5 min-h-[280px]">
                {hoveredSection && (() => {
                  const section = menuSections.find((s) => s.id === hoveredSection);
                  if (!section) return null;
                  return (
                    <div key={section.id}>
                      <Link
                        to={section.href}
                        onClick={() => {
                          setCatalogOpen(false);
                          setHoveredSection(null);
                        }}
                        className="text-sm font-semibold text-gray-900 hover:text-brand-600 transition block mb-3"
                      >
                        {section.label}
                      </Link>
                      <ul className="space-y-1">
                        {section.children.map((child) => {
                          const childActive = isActive(child.href, pathname);
                          return (
                            <li key={child.label}>
                              <Link
                                to={child.href}
                                onClick={() => {
                                  setCatalogOpen(false);
                                  setHoveredSection(null);
                                }}
                                className={`block text-sm py-1 transition ${
                                  childActive
                                    ? 'text-brand-600 font-medium'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })()}
                {!hoveredSection && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-gray-300">Наведите на категорию</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Link
            to="/clearance"
            className="px-3 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition"
          >
            Уценка
          </Link>
        </nav>

        {/* News button */}
        <Link
          to="/news"
          className="hidden lg:inline-flex px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
        >
          Новости
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-lg hidden md:block relative" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Поиск по каталогу..."
              className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchFocused(true); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </form>

          {/* Search dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-[slideIn_0.15s_ease-out]">
              <div className="py-2 max-h-[420px] overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => navigateToProduct(product.id)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Package size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{product.brand}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{product.subcategory}</span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      {formatPrice(product.price)}
                    </div>
                  </button>
                ))}
              </div>
              <Link
                to={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                onClick={() => setSearchFocused(false)}
                className="flex items-center justify-center gap-1 px-4 py-3 text-sm font-medium text-brand-600 hover:bg-brand-50 border-t border-gray-100 transition"
              >
                Все результаты
                <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <Search size={20} className="text-gray-700" />
          </button>
          <Link
            to="/favorites"
            className="relative p-2 hover:bg-gray-100 rounded-lg transition"
            title="Избранное"
          >
            <Heart size={20} className="text-gray-700" />
            {favoritesCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {favoritesCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition"
            title="Корзина"
          >
            <ShoppingCart size={20} className="text-gray-700" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3 animate-[slideIn_0.2s_ease-out]">
          <form onSubmit={handleSearch} className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по каталогу..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition text-sm"
            />
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="lg:hidden border-t border-gray-100 bg-white max-h-[calc(100vh-4rem)] overflow-y-auto animate-[slideIn_0.2s_ease-out]">
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/catalog"
              onClick={() => setMobileMenu(false)}
              className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-600 rounded-lg transition"
            >
              Все товары
            </Link>

            {menuSections.map((section) => {
              const isExpanded = expandedSection === section.id;
              const active = isCategoryActive(section, pathname);
              return (
                <div key={section.id}>
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                      active
                        ? 'text-brand-600 bg-brand-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {section.label}
                    <ChevronRight
                      size={16}
                      className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-4 space-y-0.5 pb-1">
                      <Link
                        to={section.href}
                        onClick={() => setMobileMenu(false)}
                        className="block px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      >
                        Все {section.label.toLowerCase()}
                      </Link>
                      {section.children.map((child) => {
                        const childActive = isActive(child.href, pathname);
                        return (
                          <Link
                            key={child.label}
                            to={child.href}
                            onClick={() => setMobileMenu(false)}
                            className={`block px-3 py-2 text-sm rounded-lg transition ${
                              childActive
                                ? 'text-brand-600 bg-brand-50 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <Link
              to="/news"
              onClick={() => setMobileMenu(false)}
              className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-600 rounded-lg transition"
            >
              Новости
            </Link>
            <Link
              to="/clearance"
              onClick={() => setMobileMenu(false)}
              className="block px-3 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition"
            >
              Уценка
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
