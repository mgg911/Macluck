/**
 * SIM-конфигурации для моделей iPhone.
 * Ключ — base ID модели (без суффикса -clearance).
 * Значение — массив реально существовавших конфигураций.
 *
 * Источник: официальные спецификации Apple.
 *
 * Конфигурации:
 *   - Nano-SIM + eSIM  — глобальная версия (Европа, Азия, Ближний Восток и т.д.)
 *   - Dual eSIM        — версия для США (без физического лотка, начиная с iPhone 14)
 *   - Dual Nano-SIM    — версия для материкового Китая, Гонконга, Макао
 *
 * iPhone Air не включён — без подтверждённых данных.
 */
const iphoneSimConfig = {
  // iPhone 13 series (2021) — только Nano-SIM + eSIM
  'iphone-13': ['Nano-SIM + eSIM'],
  'iphone-13-mini': ['Nano-SIM + eSIM'],
  'iphone-13-pro': ['Nano-SIM + eSIM'],
  'iphone-13-pro-max': ['Nano-SIM + eSIM'],

  // iPhone 14 series (2022) — все 3 конфигурации
  'iphone-14': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],
  'iphone-14-plus': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],
  'iphone-14-pro': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],
  'iphone-14-pro-max': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],

  // iPhone 15 series (2023) — все 3 конфигурации
  'iphone-15': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],
  'iphone-15-plus': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],
  'iphone-15-pro': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],
  'iphone-15-pro-max': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],

  // iPhone 16 series (2024) — все 3 конфигурации
  'iphone-16-pro': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],
  'iphone-16-pro-max': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],
  'iphone-16e': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],

  // iPhone 17 series (2026) — все 3 конфигурации (кроме iPhone Air)
  'iphone-17-pro-max': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],
  'iphone-17-pro': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],
  'iphone-17e': ['Nano-SIM + eSIM', 'Dual eSIM', 'Dual Nano-SIM'],

  // iPhone Air — только eSIM
  'iphone-air': ['Dual eSIM'],

  // Уценка — только Nano-SIM + eSIM, кроме 15 Pro и 15 Pro Max
  'iphone-13-clearance': ['Nano-SIM + eSIM'],
  'iphone-13-mini-clearance': ['Nano-SIM + eSIM'],
  'iphone-13-pro-clearance': ['Nano-SIM + eSIM'],
  'iphone-13-pro-max-clearance': ['Nano-SIM + eSIM'],
  'iphone-14-clearance': ['Nano-SIM + eSIM'],
  'iphone-14-plus-clearance': ['Nano-SIM + eSIM'],
  'iphone-14-pro-clearance': ['Nano-SIM + eSIM'],
  'iphone-14-pro-max-clearance': ['Nano-SIM + eSIM'],
  'iphone-15-clearance': ['Nano-SIM + eSIM'],
  'iphone-15-plus-clearance': ['Nano-SIM + eSIM'],
};

/**
 * Возвращает массив доступных SIM-конфигураций для ID продукта.
 * Автоматически обрабатывает суффикс -clearance.
 * Возвращает null для моделей без подтверждённых данных.
 */
export function getSimConfigForProduct(productId) {
  // Прямой поиск
  if (iphoneSimConfig[productId]) {
    return [...iphoneSimConfig[productId]];
  }
  // Поиск по базовому ID (убираем -clearance)
  const baseId = productId.replace(/-clearance$/, '');
  if (iphoneSimConfig[baseId]) {
    return [...iphoneSimConfig[baseId]];
  }
  return null;
}

/**
 * Проверяет, есть ли у продукта доступные SIM-конфигурации.
 */
export function hasSimConfig(productId) {
  return getSimConfigForProduct(productId) !== null;
}

export default iphoneSimConfig;
