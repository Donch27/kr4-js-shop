/* КР №4: проверка формы без alert, ошибки рядом с полями и итоговый статус в DOM. */
'use strict';

function errorElementFor(field) {
  const ids = (field.getAttribute('aria-describedby') || '').split(/\s+/);
  const errorId = ids.find((id) => id.endsWith('-error'));
  return errorId ? document.getElementById(errorId) : null;
}

function errorMessage(field) {
  const validity = field.validity;
  if (validity.valueMissing) {
    if (field.type === 'checkbox') return 'Подтвердите согласие на обработку данных.';
    if (field.tagName === 'SELECT') return 'Выберите значение из списка.';
    return 'Заполните это поле.';
  }
  if (field.type === 'email' && validity.typeMismatch) return 'Введите email в формате name@example.ru.';
  if (field.type === 'tel' && (validity.customError || validity.patternMismatch)) return 'Введите телефон минимум с 10 цифрами.';
  if (validity.tooShort) return `Минимум ${field.minLength} символов.`;
  if (validity.rangeOverflow || validity.rangeUnderflow) return `Значение должно быть от ${field.min} до ${field.max}.`;
  if (validity.badInput || validity.typeMismatch) return 'Введите корректное значение.';
  return field.validationMessage || 'Исправьте значение.';
}

function validateField(field) {
  if (field.type === 'tel') {
    field.setCustomValidity('');
    if (field.value.trim() && field.value.replace(/\D/g, '').length < 10) {
      field.setCustomValidity('Введите не менее 10 цифр телефона.');
    }
  }
  const error = errorElementFor(field);
  const valid = field.checkValidity();
  field.classList.toggle('field-invalid', !valid);
  if (valid) field.removeAttribute('aria-invalid');
  else field.setAttribute('aria-invalid', 'true');
  if (error) error.textContent = valid ? '' : errorMessage(field);
  return valid;
}

function clearErrors(form) {
  form.querySelectorAll('[aria-invalid]').forEach((field) => {
    field.removeAttribute('aria-invalid');
    field.classList.remove('field-invalid');
    const error = errorElementFor(field);
    if (error) error.textContent = '';
    if (field.type === 'tel') field.setCustomValidity('');
  });
}

function enhanceForm(form, onSuccess) {
  if (!form || form.dataset.validated === 'true') return;
  form.dataset.validated = 'true';
  form.noValidate = true;
  const status = makeFormStatus(form);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = Array.from(form.elements).filter((field) => field.willValidate);
    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length) {
      status.textContent = `Проверьте форму: ошибок — ${invalid.length}.`;
      status.classList.add('form-status--error');
      invalid[0].focus();
      return;
    }
    status.classList.remove('form-status--error');
    const message = onSuccess(form);
    status.textContent = message || 'Заявка подготовлена. Это учебная форма: данные не отправляются на сервер.';
  });
  const recheck = (event) => {
    const field = event.target;
    if (field.getAttribute('aria-invalid') === 'true') validateField(field);
  };
  form.addEventListener('input', recheck);
  form.addEventListener('change', recheck);
  form.addEventListener('reset', () => clearErrors(form));
}

function makeFormStatus(form) {
  let status = form.querySelector('.form-status');
  if (status) return status;
  status = document.createElement('p');
  status.classList.add('form-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  form.append(status);
  return status;
}

function defaultSuccess(form) {
  showToast('Сообщение подготовлено. Демонстрационная форма проверена успешно.');
  form.reset();
  return 'Поля проверены, сообщение подготовлено. Реальной отправки нет.';
}
