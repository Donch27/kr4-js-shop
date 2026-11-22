/* Проверка учебных данных и основных расчётов: node tests/smoke.js */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const load = (file) => fs.readFileSync(path.join(root, 'js', file), 'utf8');
const saved = new Map();
const sandbox = {
  localStorage: {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, String(value))
  },
  document: {querySelectorAll: () => [], querySelector: () => null},
  showToast: () => {},
  console
};
vm.createContext(sandbox);
vm.runInContext(load('data.js') + '\n' + load('cart.js'), sandbox);
const results = vm.runInContext(`
  (function () {
    const valid = products.length >= 8 && products.length <= 12 &&
      new Set(products.map((item) => item.id)).size === products.length &&
      products.every((item) => typeof item.title === 'string' &&
        typeof item.price === 'number' && Number.isFinite(item.price) &&
        typeof item.isAvailable === 'boolean' && CATEGORIES[item.category]);
    addToCart('stick');
    addToCart('helmet', 2);
    const subtotal = cartTotal();
    const count = cartLines().reduce((sum, line) => sum + line.quantity, 0);
    setCartQuantity('stick', 3);
    const updated = cartTotal();
    toggleFavorite('stick');
    const liked = currentFavorites.includes('stick');
    removeFromCart('helmet');
    const removed = cartLines().length === 1;
    return {valid, subtotal, count, updated, liked, removed};
  })()
`, sandbox);
assert.equal(results.valid, true, 'Структура массива товаров');
assert.equal(results.subtotal, 12990 + 2 * 9990, 'Сумма через reduce');
assert.equal(results.count, 3, 'Количество товаров');
assert.equal(results.updated, 3 * 12990 + 2 * 9990, 'Изменение количества');
assert.equal(results.liked, true, 'Избранное');
assert.equal(results.removed, true, 'Удаление из корзины');
assert.ok(saved.has('iceforce_kr4_cart'), 'Сохранение корзины');
console.log('OK: 12 товаров, суммы, счётчик, корзина, избранное и localStorage.');
// Все модули вместе загружаются, а инициализация допускает страницы без виджетов.
const callbacks = new Map();
const emptyPage = {
  ...sandbox,
  document: {
    documentElement: {classList: {toggle: () => false, contains: () => false}},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener: (type, callback) => callbacks.set(type, callback)
  },
  window: {matchMedia: () => ({matches: false})},
  location: {search: '', pathname: '/index.html'},
  URLSearchParams,
  setTimeout,
  clearTimeout
};
vm.createContext(emptyPage);
for (const file of ['data.js', 'validation.js', 'cart.js', 'catalog.js', 'product.js', 'modal.js', 'main.js']) {
  vm.runInContext(load(file), emptyPage, {filename: file});
}
assert.equal(typeof callbacks.get('DOMContentLoaded'), 'function');
callbacks.get('DOMContentLoaded')();
console.log('OK: все JS-модули и общая инициализация на страницах без виджетов.');
