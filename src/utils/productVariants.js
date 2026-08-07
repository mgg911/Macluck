import { getSimConfigForProduct } from '../data/simConfig.js';

const asPrice = (value) => {
  if (value === '' || value == null) return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
};

export function getVariantPriceKey(selectedSpecs = {}) {
  return Object.entries(selectedSpecs)
    .filter(([name, value]) => name !== 'Цвет' && value != null && String(value) !== '')
    .sort(([first], [second]) => first < second ? -1 : first > second ? 1 : 0)
    .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

export function isProductVariantAvailable(product, selectedSpecs = {}) {
  if (product?.inStock === false) return false;
  const unavailable = new Set(
    Array.isArray(product?.unavailableVariants) ? product.unavailableVariants.map(String) : []
  );
  if (!unavailable.size) return true;

  const entries = Object.entries(selectedSpecs)
    .filter(([name, value]) => name !== 'Цвет' && value != null && String(value) !== '');
  const keys = [
    getVariantPriceKey(Object.fromEntries(entries)),
    ...entries.map(([name, value]) => getVariantPriceKey({ [name]: value })),
  ].filter(Boolean);
  return !keys.some((key) => unavailable.has(key));
}

export function getProductPrice(product, selectedSpecs = {}) {
  let price = asPrice(product?.price) ?? 0;
  for (const spec of product?.specs || []) {
    const selected = selectedSpecs?.[spec.name];
    if (!selected) continue;
    const configured = asPrice(product?.configurationPrices?.[spec.name]?.[selected]);
    if (configured != null) price = configured;
  }
  const selectedSim = selectedSpecs?.['SIM-конфигурация'];
  const configuredSim = selectedSim
    ? asPrice(product?.configurationPrices?.['SIM-конфигурация']?.[selectedSim])
    : null;
  if (configuredSim != null) price = configuredSim;

  const variantKey = getVariantPriceKey(selectedSpecs);
  const exactPrice = variantKey ? asPrice(product?.variantPrices?.[variantKey]) : null;
  if (exactPrice != null) price = exactPrice;
  return price;
}

export function getProductImages(product, selectedSpecs = {}) {
  const color = selectedSpecs?.['Цвет'];
  const colorImages = color ? product?.colorImages?.[color] : null;
  const source = Array.isArray(colorImages) && colorImages.length
    ? colorImages
    : Array.isArray(product?.images) && product.images.length
      ? product.images
      : [product?.image];
  return [...new Set(source.filter(Boolean).map(String))];
}

export function sanitizeProductSpecs(product, selectedSpecs = {}) {
  const result = {};
  for (const spec of product?.specs || []) {
    const allowed = new Set((spec.options || []).map((option) => String(option.value)));
    const selected = selectedSpecs?.[spec.name];
    if (selected != null && allowed.has(String(selected))) result[spec.name] = String(selected);
    else if (spec.options?.[0]?.value != null) result[spec.name] = String(spec.options[0].value);
  }
  const simOptions = product?.id ? getSimConfigForProduct(product.id) : null;
  if (simOptions?.length) {
    const selectedSim = String(selectedSpecs?.['SIM-конфигурация'] || '');
    result['SIM-конфигурация'] = simOptions.includes(selectedSim) ? selectedSim : simOptions[0];
  }
  return result;
}
