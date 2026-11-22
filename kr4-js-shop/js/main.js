/* КР №4: общая инициализация и функции исходного проекта КР №3. */
'use strict';

const NBSP = '\u00a0';
function formatPrice(value) {
  return Number(value).toLocaleString('ru-RU') + NBSP + '₽';
}
function limitSizes(select, productId) {
  if (!select) return;
  const product = PRODUCTS[productId];
  Array.from(select.options).forEach((option) => {
    if (!option.value) return;
    option.disabled = Boolean(product) && !product.sizes.includes(option.value);
  });
  if (select.selectedOptions[0] && select.selectedOptions[0].disabled) select.value = '';
}

/* ---------- 3. Мобильное меню ---------- */
function initMobileNav() {
  const button = document.querySelector('.site-header__menu-button');
  const nav = document.getElementById('site-nav');
  if (!button || !nav) return;

  const desktop = window.matchMedia('(min-width: 1024px)');

  const setOpen = (open) => {
    button.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('site-nav--open', open);
  };

  button.addEventListener('click', () => {
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });

  // Esc закрывает меню и возвращает фокус на кнопку
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus();
    }
  });

  // Клик вне шапки закрывает меню
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) setOpen(false);
  });

  // При переходе на desktop меню сбрасывается в исходное состояние
  desktop.addEventListener('change', () => setOpen(false));
}

/* ---------- 4. Кнопка «Наверх» и уведомления ---------- */
function initScrollTop() {
  const button = document.getElementById('scroll-top');
  if (!button) return;

  const update = () => {
    button.classList.toggle('scroll-top--visible', window.scrollY > 400);
  };

  window.addEventListener('scroll', update, { passive: true });
  update();

  button.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    // Переносим фокус в начало контента, чтобы клавиатура тоже «поднялась»
    const main = document.getElementById('main');
    if (main) main.focus({ preventScroll: true });
  });
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = '';
  // Небольшая пауза, чтобы скринридер объявил даже повторное сообщение
  window.setTimeout(() => {
    toast.textContent = message;
  }, 50);
  toastTimer = window.setTimeout(() => {
    toast.textContent = '';
  }, 6000);
}


/* ---------- 7. Карусели категорий ---------- */
function initCarousels() {
  const tracks = document.querySelectorAll('.category-carousel');
  if (!tracks.length) return;

  const updateButtons = (track) => {
    const max = track.scrollWidth - track.clientWidth;
    document.querySelectorAll(`[data-scroll-target="${track.id}"]`).forEach((button) => {
      button.disabled = button.dataset.direction === 'left'
        ? track.scrollLeft <= 2
        : track.scrollLeft >= max - 2;
    });
  };

  tracks.forEach((track) => {
    // Колесо мыши листает ленту, но у края отпускает прокрутку страницы
    track.addEventListener('wheel', (event) => {
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const delta = event.deltaY;
      const atStart = track.scrollLeft <= 0 && delta < 0;
      const atEnd = track.scrollLeft >= max - 1 && delta > 0;
      if (atStart || atEnd) return;
      event.preventDefault();
      track.scrollLeft += delta;
    }, { passive: false });

    track.addEventListener('scroll', () => updateButtons(track), { passive: true });
    window.addEventListener('resize', () => updateButtons(track));
    updateButtons(track);
  });

  document.querySelectorAll('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const track = document.getElementById(button.dataset.scrollTarget);
      const item = track && track.querySelector('.category-carousel__item');
      if (!track) return;
      const step = item ? item.getBoundingClientRect().width + 16 : 250;
      track.scrollBy({ left: (button.dataset.direction === 'right' ? 1 : -1) * step });
    });
  });
}


/* ---------- 10. Страница заявки ---------- */
function initOrderPage() {
  const form = document.getElementById('order-page-form');
  if (!form) return;

  const productSelect = form.elements.product;
  const sizeSelect = form.elements.size;
  const quantity = form.elements.quantity;
  const address = form.elements.address;
  const addressField = document.getElementById('order-address-field');
  const dateInput = form.elements.date;
  const $ = (selector) => document.getElementById(selector);

  // Товар из адреса: order.html?product=helmet
  const fromUrl = new URLSearchParams(window.location.search).get('product');
  if (PRODUCTS[fromUrl]) productSelect.value = fromUrl;

  // Нельзя выбрать дату в прошлом
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  dateInput.min = today.toISOString().slice(0, 10);

  const update = () => {
    const product = PRODUCTS[productSelect.value];
    limitSizes(sizeSelect, productSelect.value);
    const qty = Math.min(Math.max(Number(quantity.value) || 1, 1), 10);
    const courier = form.elements.delivery.value === 'courier';

    addressField.hidden = !courier;
    address.required = courier;
    if (!courier) {
      address.removeAttribute('aria-invalid');
      $('order-address-error').textContent = '';
    }

    $('summary-product').textContent = product ? product.name : 'не выбран';
    $('summary-size').textContent = sizeSelect.value || '—';
    $('summary-quantity').textContent = String(qty);
    $('summary-delivery').textContent = courier ? 'Курьер' : 'Самовывоз';
    $('summary-total').textContent = formatPrice(product ? product.price * qty : 0);
  };

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('reset', () => window.setTimeout(update, 0));
  update();

  enhanceForm(form, () => {
    const product = PRODUCTS[productSelect.value];
    showToast(`Заявка на «${product.name}» подготовлена! Это учебный проект: серверная отправка не выполняется.`);
    form.reset();
  });
}


/* На страницах, где нет нужного элемента, соответствующий модуль не запускается. */
document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initScrollTop();
  initCarousels();
  initTheme();
  initCart();
  initCatalog();
  initProductPage();
  initOrderPage();
  initPopularProducts();
  initOrderDialog();
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) enhanceForm(contactForm, defaultSuccess);
});
