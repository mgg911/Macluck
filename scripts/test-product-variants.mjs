import assert from 'node:assert/strict';
import { getProductPrice, getVariantPriceKey, isProductVariantAvailable, sanitizeProductSpecs } from '../src/utils/productVariants.js';

const product = {
  id: 'iphone-17-pro',
  price: 100000,
  specs: [
    { name: 'Цвет', options: [{ label: 'Black', value: 'black' }] },
    { name: 'Память', options: [{ label: '128 ГБ', value: '128gb' }, { label: '256 ГБ', value: '256gb' }] },
  ],
  configurationPrices: { Память: { '128gb': 100000, '256gb': 110000 } },
  variantPrices: {},
  unavailableVariants: [],
};

const exactSelection = { Цвет: 'black', Память: '256gb', 'SIM-конфигурация': 'Dual eSIM' };
const exactKey = getVariantPriceKey(exactSelection);
product.variantPrices[exactKey] = 115000;

assert.equal(exactKey, 'SIM-%D0%BA%D0%BE%D0%BD%D1%84%D0%B8%D0%B3%D1%83%D1%80%D0%B0%D1%86%D0%B8%D1%8F=Dual%20eSIM&%D0%9F%D0%B0%D0%BC%D1%8F%D1%82%D1%8C=256gb');
assert.equal(getProductPrice(product, exactSelection), 115000);
assert.equal(getProductPrice(product, { Память: '256gb', 'SIM-конфигурация': 'Nano-SIM + eSIM' }), 110000);
assert.equal(isProductVariantAvailable(product, exactSelection), true);
product.unavailableVariants.push(exactKey);
assert.equal(isProductVariantAvailable(product, exactSelection), false);
assert.equal(isProductVariantAvailable(product, { Цвет: 'black', Память: '128gb', 'SIM-конфигурация': 'Dual eSIM' }), true);

const unavailableMemoryKey = getVariantPriceKey({ Память: '128gb' });
product.unavailableVariants.push(unavailableMemoryKey);
assert.equal(isProductVariantAvailable(product, { Цвет: 'black', Память: '128gb', 'SIM-конфигурация': 'Nano-SIM + eSIM' }), false);

const sanitized = sanitizeProductSpecs(product, exactSelection);
assert.equal(sanitized['SIM-конфигурация'], 'Dual eSIM');
assert.equal(sanitized.Память, '256gb');

const customProduct = {
  id: 'new-product-from-admin',
  price: 50000,
  specs: [
    { name: 'Память', options: [{ label: '256 ГБ', value: '256-gb' }] },
    { name: 'SIM-конфигурация', options: [
      { label: 'Nano-SIM + eSIM', value: 'nano-sim-esim' },
      { label: 'Dual eSIM', value: 'dual-esim' },
    ] },
  ],
};
assert.equal(sanitizeProductSpecs(customProduct, {})['SIM-конфигурация'], 'nano-sim-esim');
assert.equal(sanitizeProductSpecs(customProduct, { 'SIM-конфигурация': 'dual-esim' })['SIM-конфигурация'], 'dual-esim');

console.log(JSON.stringify({ ok: true, exactKey, exactPrice: getProductPrice(product, exactSelection) }));
