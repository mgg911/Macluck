import { getSimConfigForProduct } from '../data/simConfig.js';

const asPrice = (value) => {
  if (value === '' || value == null) return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
};

export function getProductPrice(product, selectedSpecs = {}) {
  let price = asPrice(product?.price) ?? 0;
  for (const spec of product?.specs || []) {
    const selected = selectedSpecs?.[spec.name];
    if (!selected) continue;
    const configured = asPrice(product?.configurationPrices?.[spec.name]?.[selected]);
    if (configured != null) price = configured;
  }
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
