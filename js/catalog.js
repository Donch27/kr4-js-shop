/* КР №4: безопасная генерация карточек и каталог (DOM API без innerHTML). */
'use strict';

function makeElement(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = String(value);
  return node;
}

function createPicture(product, className = 'product-card__image', sizes = '(min-width: 1024px) 300px, (min-width: 480px) 42vw, 82vw') {
  const picture = document.createElement('picture');
  ['avif', 'webp'].forEach((ext) => {
    const source = document.createElement('source');
    source.type = `image/${ext}`;
    source.srcset = `images/${product.image}-400.${ext} 400w, images/${product.image}-800.${ext} 800w`;
    source.sizes = sizes;
    picture.append(source);
  });
  const img = makeElement('img', className);
  img.src = `images/${product.image}-800.jpg`;
  img.srcset = `images/${product.image}-400.jpg 400w, images/${product.image}-800.jpg 800w`;
  img.sizes = sizes;
  img.alt = product.alt;
  img.width = 800;
  img.height = 800;
  img.loading = 'lazy';
  img.decoding = 'async';
  picture.append(img);
  return picture;
}

function createProductCard(product, featured = false) {
  const item = document.createElement('li');
  item.dataset.productItem = product.id;
  const article = makeElement('article', 'product-card');
  if (featured) article.classList.add('product-card--featured');
  article.dataset.category = product.category;
  article.dataset.price = product.price;
  article.dataset.name = product.title;

  const imageBox = makeElement('div', 'product-card__image-wrapper');
  if (product.badge) {
    const badge = makeElement('span', 'product-card__badge', product.badge.text);
    if (product.badge.mod) badge.classList.add(`product-card__badge--${product.badge.mod}`);
    imageBox.append(badge);
  }
  imageBox.append(createPicture(product));
  const category = makeElement('p', 'product-card__category', CATEGORIES[product.category]);
  const heading = makeElement('h3', 'product-card__title');
  const productLink = makeElement('a', 'product-card__link', product.title);
  productLink.href = `product.html?id=${encodeURIComponent(product.id)}`;
  heading.append(productLink);
  const desc = makeElement('p', 'product-card__description', product.short);
  const price = makeElement('p', 'product-card__price', formatPrice(product.price));
  const availability = makeElement('p', 'stock-note', product.isAvailable ? 'В наличии' : 'Нет в наличии');

  const actions = makeElement('div', 'product-card__actions');
  const detail = makeElement('a', 'button button--secondary', 'Подробнее');
  detail.href = productLink.href;
  const add = makeElement('button', 'button button--primary', 'В корзину');
  add.type = 'button';
  add.dataset.addCart = product.id;
  add.disabled = !product.isAvailable;
  const favorite = makeElement('button', 'favorite-button', '♡ В избранное');
  favorite.type = 'button';
  favorite.dataset.toggleFavorite = product.id;
  favorite.setAttribute('aria-pressed', 'false');
  favorite.setAttribute('aria-label', `Добавить в избранное: ${product.title}`);
  actions.append(detail, add);

  // На главной оставляем быстрый заказ через уже существующее модальное окно.
  if (featured || document.querySelector('#popular')) {
    const quick = makeElement('button', 'button button--secondary', 'Быстрый заказ');
    quick.type = 'button';
    quick.dataset.orderProduct = product.id;
    actions.append(quick);
  }
  article.append(imageBox, category, heading, desc, price, availability, actions, favorite);
  item.append(article);
  return item;
}

function initPopularProducts() {
  const grid = document.querySelector('#popular .products-grid');
  if (!grid) return;
  const featuredIds = ['stick', 'chest', 'helmet'];
  grid.replaceChildren(...featuredIds.map((id, index) => createProductCard(PRODUCTS[id], index === 0)));
  refreshFavoriteButtons();
}

function initCatalog() {
  const form = document.querySelector('#filters-form');
  const grid = document.querySelector('#products-grid');
  if (!form || !grid) return;
  const count = document.querySelector('#products-count');
  const empty = document.querySelector('#catalog-empty');
  const toggle = document.querySelector('.catalog-filters__toggle');
  const search = form.querySelector('#catalog-search');
  const params = new URLSearchParams(location.search);

  form.querySelectorAll('[name="category"]').forEach((box) => {
    box.checked = params.getAll('category').includes(box.value);
    const amount = products.filter((p) => p.category === box.value).length;
    const countLabel = box.closest('label').querySelector('.filters-form__count');
    if (countLabel) countLabel.textContent = `(${amount})`;
  });
  search.value = params.get('search') || '';
  form.elements['price-from'].value = params.get('price-from') || '';
  form.elements['price-to'].value = params.get('price-to') || '';
  form.elements.sort.value = ['price-asc', 'price-desc', 'name'].includes(params.get('sort')) ? params.get('sort') : 'default';

  const setPanel = (open) => {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Скрыть фильтры' : 'Показать фильтры';
    form.classList.toggle('filters-form--open', open);
  };
  if (toggle) {
    toggle.addEventListener('click', () => setPanel(toggle.getAttribute('aria-expanded') !== 'true'));
  }
  if (params.toString()) setPanel(true);

  function updateUrl() {
    const query = new URLSearchParams();
    form.querySelectorAll('[name="category"]:checked').forEach((checkbox) => query.append('category', checkbox.value));
    if (search.value.trim()) query.set('search', search.value.trim());
    for (const name of ['price-from', 'price-to']) {
      if (form.elements[name].value) query.set(name, form.elements[name].value);
    }
    if (form.elements.sort.value !== 'default') query.set('sort', form.elements.sort.value);
    const target = `${location.pathname}${query.toString() ? '?' + query.toString() : ''}`;
    try { history.replaceState(null, '', target); }
    catch (_) { /* file:// может ограничивать изменение адреса: фильтры продолжают работать. */ }
  }

  function apply() {
    const category = Array.from(form.querySelectorAll('[name="category"]:checked'), (checkbox) => checkbox.value);
    const query = search.value.trim().toLocaleLowerCase('ru-RU');
    const min = form.elements['price-from'].value === '' ? 0 : Number(form.elements['price-from'].value);
    const max = form.elements['price-to'].value === '' ? Infinity : Number(form.elements['price-to'].value);
    let selected = products.filter((p) =>
      p.title.toLocaleLowerCase('ru-RU').includes(query) &&
      (category.length === 0 || category.includes(p.category)) &&
      p.price >= min && p.price <= max
    );
    // Копия массива: исходный products никогда не сортируется.
    selected = [...selected];
    switch (form.elements.sort.value) {
      case 'price-asc': selected.sort((a, b) => a.price - b.price); break;
      case 'price-desc': selected.sort((a, b) => b.price - a.price); break;
      case 'name': selected.sort((a, b) => a.title.localeCompare(b.title, 'ru')); break;
    }
    grid.replaceChildren(...selected.map((product) => createProductCard(product)));
    count.textContent = `Найдено товаров: ${selected.length} из ${products.length}`;
    empty.hidden = selected.length !== 0;
    refreshFavoriteButtons();
    updateUrl();
  }

  let delay;
  form.addEventListener('input', () => {
    clearTimeout(delay);
    delay = setTimeout(apply, 120);
  });
  form.addEventListener('change', apply);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    apply();
    if (toggle && !matchMedia('(min-width: 1024px)').matches) setPanel(false);
  });
  form.addEventListener('reset', () => setTimeout(apply, 0));
  document.querySelectorAll('[data-filters-reset]').forEach((button) => {
    button.addEventListener('click', () => {
      form.reset();
      search.focus();
    });
  });
  apply();
}
