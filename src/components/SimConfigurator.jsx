import { useEffect, useMemo } from 'react';
import { getSimConfigForProduct } from '../data/simConfig';

export default function SimConfigurator({ product, selectedSim, onChange, compact }) {
  const options = useMemo(() => getSimConfigForProduct(product.id), [product.id]);
  const currentValue = selectedSim || options?.[0];

  // Auto-select on mount
  useEffect(() => {
    if (options?.length && !selectedSim) {
      onChange(options[0]);
    }
  }, [onChange, options, selectedSim]);

  if (!options || options.length === 0) return null;

  const btnClass = (opt) =>
    `px-3 py-1.5 rounded-lg border text-xs transition ${
      currentValue === opt
        ? 'border-brand-600 bg-brand-50 text-brand-600 font-medium'
        : 'border-gray-200 text-gray-500 hover:border-gray-300'
    }`;

  if (compact) {
    // Compact inline pill buttons for product card
    return (
      <div className="min-h-[2rem] mb-3">
        <div className="flex flex-wrap gap-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(opt);
              }}
              className={btnClass(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full version for config modal — segmented control buttons
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Конфигурация SIM</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={btnClass(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
