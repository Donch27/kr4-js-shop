/* КР №4: корзина, reduce, localStorage, избранное, промокод и тема. */
'use strict';
const CART_KEY = 'iceforce_kr4_cart';
const FAVORITES_KEY = 'iceforce_kr4_favorites';
const THEME_KEY = 'iceforce_kr4_theme';

function getStored(key, fallback) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return data === null ? fallback : data;
  } catch (_) {
    return fallback;
  }
}
function setStored(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch (_) { /* Без доступа к хранилищу сайт остаётся работоспособен. */ }
}
let currentCart = getStored(CART_KEY, {});
if (!currentCart || typeof currentCart !== 'object' || Array.isArray(currentCart)) currentCart = {};
let currentFavorites = getStored(FAVORITES_KEY, []);
if (!Array.isArray(currentFavorites)) currentFavorites = [];
currentFavorites = currentFavorites.filter((id) => Boolean(PRODUCTS[id]));
let appliedPromo = false;

function cartLines() {
  return Object.entries(currentCart).filter(([id, qty]) =>
    PRODUCTS[id] && Number.isInteger(qty) && qty > 0 && qty <= 99
  ).map(([id, quantity]) => ({ product: PRODUCTS[id], quantity }));
}
function cartTotal(lines = cartLines()) {
  return lines.reduce((sum, {product, quantity}) => sum + product.price * quantity, 0);
}
function saveCart() {
  setStored(CART_KEY, currentCart);
  document.querySelectorAll('.cart-counter').forEach((node) => {
    node.textContent = String(cartLines().reduce((sum, item) => sum + item.quantity, 0));
  });
  renderCart();
}
function addToCart(id, quantity = 1) {
  if (!PRODUCTS[id] || !PRODUCTS[id].isAvailable) return;
  currentCart[id] = Math.min(99, (Number(currentCart[id]) || 0) + quantity);
  saveCart();
  showToast(`«${PRODUCTS[id].title}» добавлен в корзину.`);
}
function removeFromCart(id) {
  delete currentCart[id];
  saveCart();
}
function setCartQuantity(id, quantity) {
  if (!PRODUCTS[id]) return;
  if (quantity <= 0) delete currentCart[id];
  else currentCart[id] = Math.min(99, Math.floor(quantity));
  saveCart();
}
function toggleFavorite(id) {
  if (!PRODUCTS[id]) return;
  currentFavorites = currentFavorites.includes(id)
    ? currentFavorites.filter((value) => value !== id)
    : [...currentFavorites, id];
  setStored(FAVORITES_KEY, currentFavorites);
  refreshFavoriteButtons();
  renderFavorites();
  showToast(currentFavorites.includes(id) ? 'Товар добавлен в избранное.' : 'Товар удалён из избранного.');
}
function refreshFavoriteButtons() {
  document.querySelectorAll('.favorites-counter').forEach((node) => {
    node.textContent = String(currentFavorites.length);
  });
  document.querySelectorAll('[data-toggle-favorite]').forEach((button) => {
    const isFavorite = currentFavorites.includes(button.dataset.toggleFavorite);
    button.setAttribute('aria-pressed', String(isFavorite));
    button.classList.toggle('favorite-button--active', isFavorite);
    button.textContent = isFavorite ? '♥ В избранном' : '♡ В избранное';
  });
}


function renderFavorites() {
  const grid = document.querySelector('#favorites-grid');
  if (!grid) return;
  const empty = document.querySelector('#favorites-empty');
  const count = document.querySelector('#favorites-count');
  const favorites = currentFavorites.map((id) => PRODUCTS[id]).filter(Boolean);
  count.textContent = `Избранных товаров: ${favorites.length}`;
  empty.hidden = favorites.length > 0;
  grid.hidden = favorites.length === 0;
  grid.replaceChildren(...favorites.map((product) => createProductCard(product)));
  refreshFavoriteButtons();
}

function initTheme() {
  const isDark = getStored(THEME_KEY, false) === true;
  document.documentElement.classList.toggle('theme-dark', isDark);
  const sync = () => document.querySelectorAll('.theme-toggle').forEach((button) => {
    const dark = document.documentElement.classList.contains('theme-dark');
    button.setAttribute('aria-pressed', String(dark));
    button.textContent = dark ? 'Светлая тема' : 'Тёмная тема';
  });
  document.querySelectorAll('.theme-toggle').forEach((button) => button.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('theme-dark');
    setStored(THEME_KEY, dark);
    sync();
  }));
  sync();
}

function renderCart() {
  const list = document.querySelector('#cart-items');
  if (!list) return;
  const lines = cartLines();
  const empty = document.querySelector('#cart-empty');
  const content = document.querySelector('#cart-content');
  const checkout = document.querySelector('#cart-checkout');
  empty.hidden = lines.length > 0;
  content.hidden = lines.length === 0;
  checkout.hidden = lines.length === 0;

  const elements = lines.map(({product, quantity}) => {
    const row = makeElement('li', 'cart-item');
    const picture = createPicture(product, 'cart-item__image', '110px');
    const info = makeElement('div', 'cart-item__info');
    const title = makeElement('a', 'cart-item__title', product.title);
    title.href = `product.html?id=${encodeURIComponent(product.id)}`;
    const price = makeElement('p', '', `Цена: ${formatPrice(product.price)}`);
    const subTotal = makeElement('strong', '', `Сумма: ${formatPrice(product.price * quantity)}`);
    const label = makeElement('label', 'cart-item__label', 'Количество');
    const qty = makeElement('input', 'order-form__input cart-item__quantity');
    qty.type = 'number';
    qty.min = '1';
    qty.max = '99';
    qty.value = quantity;
    qty.dataset.cartQuantity = product.id;
    qty.setAttribute('aria-label', `Количество: ${product.title}`);
    label.append(qty);
    const remove = makeElement('button', 'button button--secondary', 'Удалить');
    remove.type = 'button';
    remove.dataset.removeCart = product.id;
    info.append(title, price, label, subTotal, remove);
    row.append(picture, info);
    return row;
  });
  list.replaceChildren(...elements);
  const subtotal = cartTotal(lines);
  const discount = appliedPromo ? Math.round(subtotal * 0.1) : 0;
  document.querySelector('#cart-subtotal').textContent = formatPrice(subtotal);
  document.querySelector('#cart-discount').textContent = formatPrice(discount);
  document.querySelector('#cart-total').textContent = formatPrice(subtotal - discount);
  document.querySelector('#cart-quantity').textContent = String(lines.reduce((sum, {quantity}) => sum + quantity, 0));
}

function initCart() {
  document.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add-cart]');
    if (add) addToCart(add.dataset.addCart);
    const fav = event.target.closest('[data-toggle-favorite]');
    if (fav) toggleFavorite(fav.dataset.toggleFavorite);
    const remove = event.target.closest('[data-remove-cart]');
    if (remove) removeFromCart(remove.dataset.removeCart);
  });
  document.addEventListener('change', (event) => {
    const qty = event.target.closest('[data-cart-quantity]');
    if (qty) {
      const parsed = Number(qty.value);
      if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 99) setCartQuantity(qty.dataset.cartQuantity, parsed);
      else { showToast('Введите количество от 1 до 99.'); renderCart(); }
    }
  });

  const promoForm = document.querySelector('#promo-form');
  if (promoForm) promoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = promoForm.querySelector('input').value.trim().toUpperCase();
    appliedPromo = value === 'ICE10';
    document.querySelector('#promo-message').textContent = appliedPromo
      ? 'Промокод применён: скидка 10 %.'
      : 'Такого демонстрационного промокода нет. Попробуйте ICE10.';
    renderCart();
  });

  const checkoutForm = document.querySelector('#cart-checkout-form');
  if (checkoutForm) enhanceForm(checkoutForm, (form) => {
    const number = cartLines().reduce((sum, {quantity}) => sum + quantity, 0);
    currentCart = {};
    appliedPromo = false;
    saveCart();
    form.reset();
    const message = document.querySelector('#cart-message');
    message.textContent = `Заявка на ${number} шт. подготовлена. Это демонстрация: данные не отправлены на сервер.`;
    message.focus();
    return 'Данные проверены. Заявка подготовлена.';
  });
  saveCart();
  refreshFavoriteButtons();
  renderFavorites();
}
