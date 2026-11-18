import { MAX_QUANTITY, changeQuantity, cleanSelection, money, orderChannel, orderDetails, orderSummary } from './order.mjs';
import { escapeHtml, icon, productCard } from './markup.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const { business, categories, products } = JSON.parse($('#menu-data').textContent);
const productIndex = new Map(products.map(product => [product.id, product]));
const media = matchMedia('(prefers-reduced-motion: reduce)');
const STORAGE_KEY = 'avomaria:pizza-selection:v1';
const MENU_LIMIT = 6;
let selection = {};
try { selection = cleanSelection(JSON.parse(localStorage.getItem(STORAGE_KEY)), productIndex); } catch { /* browser storage may be unavailable */ }

const menuList = $('#menu-list');
const menuMore = $('#menu-more');
let activeCategory = categories[0];
let menuExpanded = false;

function drawMenu(animate = true) {
  const items = products.filter(product => product.category === activeCategory.id);
  const visibleItems = menuExpanded ? items : items.slice(0, MENU_LIMIT);
  menuList.innerHTML = visibleItems.map(product => productCard(product, activeCategory)).join('');
  if (animate && !media.matches && !document.documentElement.classList.contains('motion-paused')) {
    menuList.classList.remove('menu-updated');
    requestAnimationFrame(() => menuList.classList.add('menu-updated'));
  }
  menuMore.hidden = items.length <= MENU_LIMIT;
  menuMore.setAttribute('aria-controls', 'menu-list');
  menuMore.setAttribute('aria-expanded', String(menuExpanded));
  if (!menuMore.hidden) {
    menuMore.innerHTML = menuExpanded ? 'Mostrar menos <span aria-hidden="true">↑</span>' : `Ver mais ${escapeHtml(activeCategory.name.toLocaleLowerCase('pt-PT'))} (${items.length - MENU_LIMIT}) ${icon('down')}`;
  }
}

$('#category-controls').addEventListener('click', event => {
  const control = event.target.closest('[data-category]');
  if (!control || control.dataset.category === activeCategory.id) return;
  const category = categories.find(item => item.id === control.dataset.category);
  if (!category) return;
  activeCategory = category;
  menuExpanded = false;
  $$('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button === control)));
  drawMenu();
});
menuMore.addEventListener('click', () => {
  menuExpanded = !menuExpanded;
  drawMenu();
  if (menuExpanded) $$('.menu-item', menuList)[MENU_LIMIT]?.querySelector('button')?.focus();
  else $('#category-controls [aria-pressed="true"]').focus();
});
menuList.addEventListener('animationend', () => menuList.classList.remove('menu-updated'));
drawMenu(false);

function bindDialog(dialog) {
  let trigger = null;
  let outsideDown = false;
  const outside = event => {
    const rect = dialog.getBoundingClientRect();
    return event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  };
  dialog.addEventListener('pointerdown', event => { outsideDown = outside(event); });
  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-close]') || (outsideDown && outside(event))) dialog.close();
    outsideDown = false;
  });
  dialog.addEventListener('close', () => {
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    trigger = null;
  });
  return {
    open(button) {
      if (dialog.open) return;
      trigger = button;
      dialog.showModal();
    },
    dismissTo(heading) {
      trigger = null;
      dialog.close();
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: 'start' });
    },
  };
}

const orderDialog = $('#order-dialog');
const orderModal = bindDialog(orderDialog);
const orderItems = $('#order-items');
const modeOptions = $$('input[name="order-mode"]', orderDialog);
const modeHelp = $('#mode-help');
const modeError = $('#mode-error');
const summary = $('#order-summary');
const reviewActions = $('#review-actions');
const channelLink = $('#channel-link');
const copyFeedback = $('#copy-feedback');
const toast = $('#toast');
let toastTimer;
let reviewing = false;
let reviewVersion = 0;

function notify(text) {
  toast.textContent = text;
  toast.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('on');
    toast.textContent = '';
  }, 2800);
}

function saveSelection(animate) {
  try {
    if (Object.keys(selection).length) localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* the in-memory basket still works */ }
  const { count } = orderDetails(selection, productIndex);
  $$('[data-count]').forEach(node => {
    node.textContent = count;
    node.parentElement.setAttribute('aria-label', `O teu pedido, ${count} ${count === 1 ? 'item' : 'itens'}`);
    if (animate) {
      node.classList.remove('count-pop');
      requestAnimationFrame(() => node.classList.add('count-pop'));
    }
  });
  if (orderDialog.open) drawOrder();
}

function formatLine({ product, quantity, total }) {
  const name = escapeHtml(product.name);
  const id = escapeHtml(product.id);
  return `<li class="order-item" data-line="${id}">
    <h3>${name}</h3><span class="order-item-value">${total === null ? 'A confirmar' : money(total)}</span>
    <button class="line-link" type="button" data-order-action="remove" aria-label="Remover ${name}">Remover</button>
    <div class="order-qty">
      <button type="button" class="icon-button" data-order-action="minus" aria-label="Diminuir quantidade de ${name}">${icon('minus')}</button>
      <span aria-label="Quantidade">${quantity}</span>
      <button type="button" class="icon-button" data-order-action="plus" aria-label="Aumentar quantidade de ${name}" ${quantity >= MAX_QUANTITY ? 'disabled' : ''}>${icon('plus')}</button>
    </div>
  </li>`;
}

function drawOrder() {
  const details = orderDetails(selection, productIndex);
  const hasItems = details.count > 0;
  if (!hasItems) reviewing = false;
  $('#order-empty').hidden = hasItems;
  $('#order-edit').hidden = !hasItems || reviewing;
  $('#order-review').hidden = !reviewing;
  $('#order-actions').hidden = !hasItems;
  $('#edit-actions').hidden = reviewing;
  reviewActions.hidden = !reviewing;
  if (!reviewing) orderItems.innerHTML = details.lines.map(formatLine).join('');
  $('#order-total').textContent = details.subtotal === null ? 'A confirmar' : money(details.subtotal);
}

function clearModeError() {
  modeError.hidden = true;
  modeOptions.forEach(option => option.removeAttribute('aria-invalid'));
}

function openOrder(button) {
  closeNav();
  reviewing = false;
  reviewVersion++;
  clearModeError();
  drawOrder();
  orderModal.open(button);
  $('#drawer-scroll').scrollTop = 0;
}

orderItems.addEventListener('click', event => {
  const button = event.target.closest('[data-order-action]');
  if (!button) return;
  const id = button.closest('[data-line]').dataset.line;
  const action = button.dataset.orderAction;
  const rowIndex = $$('[data-line]', orderItems).findIndex(row => row.dataset.line === id);
  const previous = selection[id] ?? 0;
  selection = changeQuantity(selection, id, action === 'remove' ? -previous : action === 'plus' ? 1 : -1, productIndex);
  saveSelection(true);
  const rows = $$('[data-line]', orderItems);
  const currentRow = rows.find(row => row.dataset.line === id);
  const destination = currentRow && $(`[data-order-action="${action}"]:not(:disabled)`, currentRow)
    || currentRow && $('[data-order-action="minus"]', currentRow)
    || rows[Math.max(0, Math.min(rowIndex, rows.length - 1))]?.querySelector('button')
    || $('#order-empty button');
  destination?.focus({ preventScroll: true });
});

modeOptions.forEach(input => input.addEventListener('change', () => {
  clearModeError();
  modeHelp.textContent = input.value === 'delivery' ? 'Confirma a morada e disponibilidade de entrega na Uber Eats.' : 'Combina a hora de recolha diretamente com a pizzaria.';
}));

$('#review-button').addEventListener('click', () => {
  const chosen = modeOptions.find(option => option.checked);
  if (!chosen) {
    modeError.hidden = false;
    modeOptions.forEach(option => option.setAttribute('aria-invalid', 'true'));
    modeOptions[0]?.focus();
    return;
  }
  const details = orderDetails(selection, productIndex);
  const text = orderSummary(details, chosen.value, $('#order-notes').value, business.name);
  const channel = orderChannel(business, chosen.value, text);
  if (!text || !channel) return;
  summary.value = text;
  $('#channel-note').textContent = channel.note;
  copyFeedback.textContent = '';
  channelLink.hidden = false;
  channelLink.href = channel.href;
  channelLink.innerHTML = `${channel.external ? icon('external') : icon('phone')} ${escapeHtml(channel.label)}`;
  if (channel.external) {
    channelLink.target = '_blank';
    channelLink.rel = 'noopener';
  } else {
    channelLink.removeAttribute('target');
    channelLink.removeAttribute('rel');
  }
  reviewing = true;
  reviewVersion++;
  drawOrder();
  $('#drawer-scroll').scrollTop = 0;
  summary.focus({ preventScroll: true });
});

$('#copy-button').addEventListener('click', async () => {
  if (!reviewing || !summary.value) return;
  const version = reviewVersion;
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summary.value);
      copied = true;
    }
  } catch { /* e.g. iframe permissions — selection is a fallback */ }
  if (!orderDialog.open || !reviewing || version !== reviewVersion) return;
  if (!copied) {
    summary.focus();
    summary.select();
    try { copied = document.execCommand('copy'); } catch { /* select manually */ }
  }
  copyFeedback.textContent = copied ? 'Resumo copiado. O pedido ainda não foi enviado.' : 'O resumo está selecionado. Usa a opção Copiar do teu dispositivo.';
});

$('#back-to-order').addEventListener('click', () => {
  reviewing = false;
  reviewVersion++;
  drawOrder();
  $('#drawer-scroll').scrollTop = 0;
  $('#review-button').focus({ preventScroll: true });
});
orderDialog.addEventListener('close', () => { reviewVersion++; });

const nav = $('#site-nav');
const navToggle = $('#menu-toggle');
function closeNav() { setNav(false); }
function setNav(open) {
  nav.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
  navToggle.innerHTML = icon(open ? 'close' : 'menu');
}
navToggle.addEventListener('click', () => setNav(!nav.classList.contains('open')));
nav.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || !nav.classList.contains('open')) return;
  closeNav();
  const section = document.getElementById(link.hash.slice(1));
  const heading = section?.querySelector('h2');
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: true });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) { closeNav(); navToggle.focus(); }
});
document.addEventListener('click', event => {
  if (nav.classList.contains('open') && !event.composedPath().includes($('#hdr'))) closeNav();
});
matchMedia('(max-width: 760px)').addEventListener('change', closeNav);

const photoDialog = $('#photo-dialog');
const photoModal = bindDialog(photoDialog);
const photos = $$('[data-gallery]').map(button => ({
  image: button.querySelector('img'),
  label: button.closest('figure').querySelector('figcaption').lastChild.textContent.trim(),
}));
let activePhoto = 0;
function showPhoto(idx) {
  activePhoto = (idx + photos.length) % photos.length;
  const { image, label } = photos[activePhoto];
  $('#photo-large').src = image.src;
  $('#photo-large').alt = image.alt;
  $('#photo-count').textContent = `${activePhoto + 1} / ${photos.length} — ${label}`;
}
$('[data-prev]').addEventListener('click', () => showPhoto(activePhoto - 1));
$('[data-next]').addEventListener('click', () => showPhoto(activePhoto + 1));
photoDialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showPhoto(activePhoto + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});
const legalDialog = $('#legal-dialog');
const legalModal = bindDialog(legalDialog);

// Delegation keeps actions live when a category re-renders its cards.
document.addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  const order = event.target.closest('[data-open-order]');
  const explore = event.target.closest('[data-order-menu]');
  const photo = event.target.closest('[data-gallery]');
  const legal = event.target.closest('[data-legal]');
  if (add) {
    const product = productIndex.get(add.dataset.add);
    if (!product) return;
    if (selection[product.id] >= MAX_QUANTITY) {
      notify(`Limite de ${MAX_QUANTITY} unidades por item neste resumo.`);
      return;
    }
    selection = changeQuantity(selection, product.id, 1, productIndex);
    saveSelection(true);
    add.classList.add('added');
    setTimeout(() => add.classList.remove('added'), 520);
    notify(`${product.name}: ${selection[product.id]} no pedido.`);
  } else if (order) openOrder(order);
  else if (explore) {
    const heading = $('#menu-title');
    heading.setAttribute('tabindex', '-1');
    orderModal.dismissTo(heading);
  } else if (photo) {
    showPhoto(Number(photo.dataset.gallery));
    photoModal.open(photo);
  } else if (legal) {
    const privacy = legal.dataset.legal === 'privacy';
    $('#legal-title').textContent = privacy ? 'Privacidade' : 'Termos de utilização';
    $('#legal-content').replaceChildren($(`#legal-${privacy ? 'privacy' : 'terms'}`).content.cloneNode(true));
    legalModal.open(legal);
  }
});

const motionControl = $('#motion-control');
motionControl.addEventListener('click', () => {
  const paused = document.documentElement.classList.toggle('motion-paused');
  motionControl.setAttribute('aria-pressed', String(paused));
  syncFilm();
});

const film = $('#hero-film');
const filmViewport = matchMedia('(min-width: 761px)');
let filmVisible = false;
function syncFilm() {
  if (!film) return;
  if (!filmVisible || !filmViewport.matches || media.matches || document.documentElement.classList.contains('motion-paused')) {
    film.pause();
    film.hidden = true;
    return;
  }
  if (!film.src) film.src = $('#hero-film-source').content.querySelector('source').getAttribute('src');
  film.muted = true;
  film.play().then(() => {
    film.hidden = film.paused || media.matches || !filmViewport.matches;
  }).catch(() => { film.hidden = true; });
}
if (film && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => { filmVisible = entry.isIntersecting; syncFilm(); }, { threshold: .15 }).observe(film.parentElement);
  media.addEventListener('change', syncFilm);
  filmViewport.addEventListener('change', syncFilm);
}

saveSelection(false);
