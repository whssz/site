import { money } from './order.mjs';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const icon = name => `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${escapeHtml(name)}"/></svg>`;
const itemPrice = product => Number.isSafeInteger(product.price) && product.price >= 0 ? money(product.price) : 'A confirmar';

function addControl(product, compact = false) {
  return `<button type="button" class="add-button" data-add="${escapeHtml(product.id)}" aria-label="Adicionar ${escapeHtml(product.name)} ao pedido">${icon('plus')}${compact ? '' : '<span>Adicionar</span>'}</button>`;
}

function productCard(product, category) {
  const media = product.photo;
  const image = media ? `<img class="menu-product-image" src="${escapeHtml(media.src)}" width="${media.width}" height="${media.height}" loading="lazy" decoding="async" alt="${escapeHtml(media.alt)}">` :
    `<span class="menu-glyph" aria-hidden="true">${icon(category.icon)}</span>`;
  return `<article class="menu-item">${image}<div><h3>${escapeHtml(product.name)}</h3>${product.description ? `<p>${escapeHtml(product.description)}</p>` : ''}</div><div class="menu-item-end"><span class="item-price">${itemPrice(product)}</span>${addControl(product, true)}</div></article>`;
}

function favoriteCard(product, i) {
  return `<article class="favorite-card card"><span class="serial">${icon('star')} N.º ${i + 1} · Favorita</span><h3>${escapeHtml(product.name)}</h3>${product.description ? `<p>${escapeHtml(product.description)}</p>` : ''}<div class="favorite-foot"><span class="item-price">${itemPrice(product)}</span>${addControl(product)}</div></article>`;
}

function filterButton(category, index) {
  return `<button type="button" class="category-control" data-category="${escapeHtml(category.id)}" aria-pressed="${index === 0}" aria-controls="menu-list">${icon(category.icon)}${escapeHtml(category.name)}</button>`;
}

export { escapeHtml, icon, productCard, favoriteCard, filterButton };
