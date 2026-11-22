/* Модальное окно быстрого заказа, перенесено из КР №3. */
'use strict';
/* ---------- 6. Модальное окно быстрого заказа ---------- */
function initOrderDialog() {
  const dialog = document.getElementById('order-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const form = dialog.querySelector('#order-form');
  const productName = dialog.querySelector('#dialog-product');
  const productId = dialog.querySelector('#dialog-product-id');
  const sizeSelect = dialog.querySelector('#dialog-size');
  const fullFormLink = dialog.querySelector('#dialog-full-form');
  let lastTrigger = null;

  const open = (id, trigger) => {
    const product = PRODUCTS[id];
    if (!product) return;
    lastTrigger = trigger;
    form.reset();
    productName.value = `${product.name} — ${formatPrice(product.price)}`;
    productId.value = id;
    limitSizes(sizeSelect, id);
    fullFormLink.href = `order.html?product=${id}`;
    dialog.showModal();
    document.body.classList.add('has-dialog');
    sizeSelect.focus();
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  document.querySelectorAll('[data-order-product]').forEach((button) => {
    button.addEventListener('click', () => open(button.dataset.orderProduct, button));
  });

  dialog.querySelectorAll('[data-dialog-close]').forEach((button) => {
    button.addEventListener('click', close);
  });

  // Клик по затемнённому фону закрывает окно
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  // Esc закрывает окно нативно; после закрытия фокус возвращается на кнопку
  dialog.addEventListener('close', () => {
    document.body.classList.remove('has-dialog');
    if (lastTrigger) lastTrigger.focus();
  });

  enhanceForm(form, () => {
    const product = PRODUCTS[productId.value];
    const size = sizeSelect.value;
    close();
    showToast(`Заявка на «${product.name}», размер ${size}, подготовлена! Это демонстрационная форма.`);
    form.reset();
  });
}

