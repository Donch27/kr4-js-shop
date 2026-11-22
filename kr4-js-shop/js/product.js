/* КР №4: карточка одного товара из data.js, безопасное обновление DOM. */
'use strict';

function initProductPage() {
  const root = document.querySelector('#product');
  if (!root) return;
  const requestedId = new URLSearchParams(location.search).get('id') || 'stick';
  const product = PRODUCTS[requestedId];
  if (!product) {
    const error = makeElement('p', 'catalog-empty', 'Товар не найден. Вернитесь в каталог.');
    root.replaceChildren(error);
    return;
  }
  document.title = `${product.title} — IceForce`;
  const select = (id) => document.querySelector(`#${id}`);
  select('breadcrumb-product').textContent = product.title;
  select('product-category').textContent = CATEGORIES[product.category];
  select('product-title').textContent = product.title;
  select('product-price').textContent = formatPrice(product.price);
  select('product-lead').textContent = product.lead;
  select('product-sizes').textContent = product.sizes.join(', ');
  select('product-order-link').href = `order.html?product=${encodeURIComponent(product.id)}`;
  select('product-table-caption').textContent = `Характеристики товара «${product.title}»`;
  select('product-figure').replaceChildren(createPicture(product, 'product__image', '(min-width: 1280px) 500px, (min-width: 768px) 40vw, 90vw'));
  select('product-features').replaceChildren(...product.features.map((name) => makeElement('li', '', name)));
  select('product-specs').replaceChildren(...product.specs.map(([name, value, info]) => {
    const row = document.createElement('tr');
    const head = makeElement('th', '', name);
    head.scope = 'row';
    const val = makeElement('td', '', value);
    val.dataset.label = 'Значение';
    const note = makeElement('td', '', info);
    note.dataset.label = 'Комментарий';
    row.append(head, val, note);
    return row;
  }));
  select('product-description').replaceChildren(...product.description.map((desc) => makeElement('p', '', desc)));
  const related = products.filter((p) => p.id !== product.id && p.category === product.category)
    .concat(products.filter((p) => p.id !== product.id && p.category !== product.category)).slice(0, 3);
  select('related-products').replaceChildren(...related.map((p) => createProductCard(p)));
  const add = select('product-add-cart');
  add.dataset.addCart = product.id;
  add.disabled = !product.isAvailable;
  const fav = select('product-favorite');
  fav.dataset.toggleFavorite = product.id;
  refreshFavoriteButtons();
}
