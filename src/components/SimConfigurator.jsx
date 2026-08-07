import { useEffect, useMemo } from 'react';
import { getSimConfigForProduct } from '../data/simConfig';
import { isProductVariantAvailable } from '../utils/productVariants';

export default function SimConfigurator({ product, selectedSim, onChange, compact, selectedSpecs = {} }) {
  const options = useMemo(() => {
    const productOptions = (product.specs || [])
      .find((spec) => spec.name === 'SIM-конфигурация')
      ?.options?.filter((option) => option?.value != null)
      .map((option) => ({ label: String(option.label || option.value), value: String(option.value) })) || [];
    if (productOptions.length) return productOptions;
    return (getSimConfigForProduct(product.id) || []).map((value) => ({ label: value, value }));
  }, [product.id, product.specs]);
  const currentValue = selectedSim || options[0]?.value;

  // Auto-select on mount
  useEffect(() => {
    if (options.length && !selectedSim) {
      onChange(options[0].value);
    }
  }, [onChange, options, selectedSim]);

  if (options.length === 0) return null;

  const optionAvailable = (option) => isProductVariantAvailable(product, {
    ...selectedSpecs,
    'SIM-конфигурация': option.value,
  });
  const btnClass = (option) =>
    `px-3 py-1.5 rounded-lg border text-xs transition ${
      currentValue === option.value
        ? 'border-brand-600 bg-brand-50 text-brand-600 font-medium'
        : 'border-gray-200 text-gray-500 hover:border-gray-300'
    } ${optionAvailable(option) ? '' : 'line-through opacity-60'}`;

  if (compact) {
    // Compact inline pill buttons for product card
    return (
      <div className="min-h-[2rem] mb-3">
        <div className="flex flex-wrap gap-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(option.value);
              }}
              className={btnClass(option)}
            >
              {option.label}{optionAvailable(option) ? '' : ' · нет'}
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
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={btnClass(option)}
          >
            {option.label}{optionAvailable(option) ? '' : ' · нет в наличии'}
          </button>
        ))}
      </div>
    </div>
  );
}
