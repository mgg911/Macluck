import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { colorMap } from '../data/products';

function FilterSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-b-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-1"
      >
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-300 ${open ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>
      <div
        className={`filter-section-content ${open ? 'open' : ''}`}
      >
        <div className="pt-2">{children}</div>
      </div>
    </div>
  );
}

export default function FilterSidebar({
  brands,
  selectedBrands,
  onToggleBrand,
  priceBounds,
  priceRange,
  onPriceChange,
  colors,
  selectedColors,
  onToggleColor,
  storageOptions,
  selectedStorage,
  onToggleStorage,
  screenDiagonals,
  selectedScreens,
  onToggleScreen,
  years,
  selectedYears,
  onToggleYear,
  ramOptions,
  selectedRam,
  onToggleRam,
  showRam,
  simOptions,
  selectedSim,
  onToggleSim,
  showSim,
  availabilityOptions,
  selectedAvailability,
  onToggleAvailability,
  customFilters = [],
  selectedCustom = {},
  onToggleCustom,
  onReset,
  activeCount,
}) {
  // Price input state
  const [localMin, setLocalMin] = useState(priceRange.min);
  const [localMax, setLocalMax] = useState(priceRange.max);

  // Sync local state when priceRange changes externally (e.g. reset)
  useEffect(() => {
    setLocalMin(priceRange.min);
    setLocalMax(priceRange.max);
  }, [priceRange.min, priceRange.max]);

  const commitPrice = useCallback(() => {
    const min = Math.min(localMin, localMax);
    const max = Math.max(localMin, localMax);
    const clampedMin = Math.max(priceBounds.min, min);
    const clampedMax = Math.min(priceBounds.max, max);
    onPriceChange({ min: clampedMin, max: clampedMax });
  }, [localMin, localMax, priceBounds, onPriceChange]);

  const handleMinInput = (val) => {
    const cleaned = val.replace(/[^\d]/g, '');
    const num = cleaned === '' ? 0 : Number(cleaned);
    if (!isNaN(num)) setLocalMin(Math.max(0, Math.min(priceBounds.max, num)));
  };

  const handleMaxInput = (val) => {
    const cleaned = val.replace(/[^\d]/g, '');
    const num = cleaned === '' ? 0 : Number(cleaned);
    if (!isNaN(num)) setLocalMax(Math.max(0, Math.min(priceBounds.max, num)));
  };

  return (
    <div className="space-y-1">
      {customFilters.filter(filter => filter.published !== false).map(filter => (
        <FilterSection key={filter.id || filter.slug} title={filter.name}>
          <div className="space-y-1.5">
            {(filter.values || []).map(value => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(selectedCustom[filter.slug] || []).includes(value)} onChange={() => onToggleCustom(filter.slug, value)} className="w-4 h-4 rounded border-gray-300 text-brand-600" />
                <span className="text-sm text-gray-600">{value}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      ))}
      {/* Price */}
      <FilterSection title="Цена">
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={localMin}
            onChange={(e) => handleMinInput(e.target.value)}
            onBlur={commitPrice}
            className="w-1/2 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-brand-500 outline-none"
            placeholder="От"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="text"
            inputMode="numeric"
            value={localMax}
            onChange={(e) => handleMaxInput(e.target.value)}
            onBlur={commitPrice}
            className="w-1/2 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-brand-500 outline-none"
            placeholder="До"
          />
        </div>
      </FilterSection>

      {/* Brand */}
      {brands.length > 1 && (
        <FilterSection title="Бренд">
          <div className="space-y-1.5">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => onToggleBrand(brand)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">{brand}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Color */}
      {colors.length > 0 && (
        <FilterSection title="Цвет">
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const hex = colorMap[c.label] || '#d4d4d4';
              const isSelected = selectedColors.includes(c.label);
              return (
                <button
                  key={c.label}
                  onClick={() => onToggleColor(c.label)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50 text-brand-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0"
                    style={{ backgroundColor: hex }}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Storage */}
      {storageOptions.length > 0 && (
        <FilterSection title="Память">
          <div className="flex flex-wrap gap-1.5">
            {storageOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => onToggleStorage(opt)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                  selectedStorage.includes(opt)
                    ? 'border-brand-600 bg-brand-50 text-brand-600 font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Screen diagonal */}
      {screenDiagonals.length > 0 && (
        <FilterSection title="Диагональ экрана">
          <div className="space-y-1.5">
            {screenDiagonals.map((d) => (
              <label key={d} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedScreens.includes(d)}
                  onChange={() => onToggleScreen(d)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">{d}"</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Year */}
      {years.length > 0 && (
        <FilterSection title="Год выпуска">
          <div className="space-y-1.5">
            {years.map((y) => (
              <label key={y} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedYears.includes(y)}
                  onChange={() => onToggleYear(y)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">{y}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* RAM */}
      {showRam && ramOptions.length > 0 && (
        <FilterSection title="Оперативная память (RAM)">
          <div className="flex flex-wrap gap-1.5">
            {ramOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => onToggleRam(opt)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                  selectedRam.includes(opt)
                    ? 'border-brand-600 bg-brand-50 text-brand-600 font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* SIM-конфигурация */}
      {showSim && simOptions.length > 0 && (
        <FilterSection title="SIM-конфигурация">
          <div className="space-y-1.5">
            {simOptions.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedSim.includes(opt)}
                  onChange={() => onToggleSim(opt)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">{opt}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Availability */}
      <FilterSection title="Наличие">
        <div className="space-y-1.5">
          {availabilityOptions.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedAvailability.includes(opt)}
                onChange={() => onToggleAvailability(opt)}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">{opt}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Reset */}
      {activeCount > 0 && (
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium pt-2"
        >
          <RotateCcw size={14} />
          Сбросить фильтры
        </button>
      )}
    </div>
  );
}
