import { readFileSync, mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { resolve, dirname, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = path => readFileSync(resolve(root, path), 'utf8');
const json = path => JSON.parse(read(path));
const escaped = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const rawJson = data => JSON.stringify(data).replaceAll('<', '\\u003c');
const svg = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
// Deterministic Portuguese display in the static build, independent of the host's ICU version.
const format = cents => `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}\u00a0€`;
const business = json('src/business.json');
const menu = json('src/menu.json');
const media = json('src/media.json');
const whatsapp = business.whatsapp;
const checkedDate = new Date(`${menu.checkedOn}T00:00:00Z`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(menu.checkedOn) || Number.isNaN(+checkedDate) || checkedDate.toISOString().slice(0, 10) !== menu.checkedOn) {
  throw Error('Indique a data de consulta da carta em checkedOn (AAAA-MM-DD).');
}
const dateLabel = menu.checkedOn.split('-').reverse().join('/');
const operator = business.operator;
if (operator && (!operator.name?.trim() || !operator.address?.trim() || !/^[0-9]{9}$/.test(operator.taxId) || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(operator.email))) {
  throw Error('O operador requer denominação, morada, NIF/NIPC e e-mail confirmados.');
}
if (whatsapp && !/^[1-9]\d{7,14}$/.test(whatsapp)) throw Error('Configure o WhatsApp oficial em formato internacional, sem sinal +.');

function dataUri(path, mime) { return `data:${mime};base64,${readFileSync(path).toString('base64')}`; }
function mediaFile(file, extensions) {
  const assets = realpathSync(resolve(root, 'src/assets'));
  const absolute = realpathSync(resolve(assets, file));
  const local = relative(assets, absolute);
  if (!local || local === ".." || local.startsWith(`..${sep}`) || isAbsolute(local) || !extensions.some(type => absolute.toLowerCase().endsWith(`.${type}`))) {
    throw Error(`Ficheiro de multimédia inválido: ${file}`);
  }
  return absolute;
}
function photoUri(file) {
  const path = mediaFile(file, ['webp', 'avif']);
  return dataUri(path, path.endsWith('.avif') ? 'image/avif' : 'image/webp');
}
function mediaMarkup(asset, hero = false) {
  if (!asset) return '';
  if (asset.authorized !== true || !asset.source || !asset.alt || !Number.isInteger(asset.width) || asset.width < 1 || !Number.isInteger(asset.height) || asset.height < 1) {
    throw Error(`O ficheiro ${asset.file} requer autorização, origem, alt e dimensões.`);
  }
  const src = photoUri(asset.file);
  const variants = (asset.variants || []).map(image => {
    if (!Number.isInteger(image.width) || image.width < 1) throw Error('Largura de imagem inválida.');
    return `${photoUri(image.file)} ${image.width}w`;
  });
  if (variants.length) variants.push(`${src} ${asset.width}w`);
  const image = `<img src="${src}" ${variants.length ? `srcset="${variants.join(', ')}" sizes="(max-width: 760px) 90vw, 42vw" ` : ''}alt="${escaped(asset.alt)}" width="${asset.width}" height="${asset.height}" ${hero ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  const video = asset.video ? `<template class="video-slot"><video muted autoplay loop playsinline preload="none" poster="${src}" aria-hidden="true" disablepictureinpicture src="${dataUri(mediaFile(asset.video, ['mp4']), 'video/mp4')}"></video></template>` : '';
  return `<div class="media-slot"><picture>${image}</picture>${video}</div>`;
}

const listed = new Map();
const groups = new Set(menu.categories.flatMap(category => category.groups));
for (const item of menu.items) {
  if (!/^[a-z0-9-]+$/.test(item.id) || listed.has(item.id) || !item.name || !item.description || !groups.has(item.group) || !Number.isInteger(item.cents) || item.cents <= 0) {
    throw Error(`Artigo da carta inválido: ${item.id}`);
  }
  listed.set(item.id, item);
}
const featured = menu.featured.map(id => {
  if (!listed.has(id)) throw Error(`Destaque fora da carta: ${id}`);
  return listed.get(id);
});
const addButton = (item, withLabel) => `<button type="button" class="add-button" data-add="${item.id}" aria-label="Adicionar ${escaped(item.name)} ao pedido" hidden>${svg('add')}${withLabel ? '<span>Adicionar</span>' : ''}</button>`;
const featuredGrid = items => `<div class="featured-grid">${items.map(item => {
  const visual = mediaMarkup(media.featured[item.id]);
  return `<article class="featured card" data-card="${item.id}">
      <div class="featured-decoration" aria-hidden="true"></div>
      ${visual ? `<div class="featured-media">${visual}</div>` : ''}
      <div class="featured-body"><span class="featured-index">${escaped(item.group)}</span><h3>${escaped(item.name)}</h3><p>${escaped(item.description)}</p></div>
      <div class="featured-action"><span class="featured-price">${format(item.cents)}</span>${addButton(item, true)}</div>
    </article>`;
}).join('')}</div>`;
const renderGroup = (name, items) => `<div class="menu-group"><h3>${escaped(name)}</h3><ul class="menu-rows">${items.map(item => `<li class="menu-row">
      <div><h4>${escaped(item.name)}</h4><p>${escaped(item.description)}</p></div>
      <div class="menu-row-action"><span class="menu-price">${format(item.cents)}</span>${addButton(item, false)}</div>
    </li>`).join('')}</ul></div>`;
const tabs = menu.categories.map((category, i) => `<button type="button" id="tab-${category.id}" role="tab" aria-controls="menu-${category.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${escaped(category.name)}</button>`).join('');
const menus = menu.categories.map(category => {
  const picks = featured.filter(item => category.groups.includes(item.group));
  return `<div class="menu-panel" role="tabpanel" id="menu-${category.id}" aria-labelledby="tab-${category.id}" tabindex="0">
    ${picks.length ? featuredGrid(picks) : ''}
    <div class="menu-groups">${category.groups.map(name => renderGroup(name, menu.items.filter(item => item.group === name && !picks.includes(item)))).join('')}</div>
  </div>`;
}).join('\n');
const structured = {
  '@context': 'https://schema.org', '@type': 'Restaurant', name: business.name,
  alternateName: 'Restaurante Brutta Maravilhoso', telephone: business.phone,
  address: { '@type': 'PostalAddress', streetAddress: 'Av. Patrão Joaquim Lopes 4', postalCode: '2770-134', addressLocality: 'Paço de Arcos', addressRegion: 'Oeiras', addressCountry: 'PT' },
  geo: { '@type': 'GeoCoordinates', latitude: 38.6959432, longitude: -9.2909224 },
  servesCuisine: 'Pizza napolitana', openingHours: ['Tu-Su 12:00-15:00', 'Tu-Su 19:00-22:00'],
  hasMenu: business.menuSource, hasMap: business.maps, sameAs: [business.instagram]
};
const appData = { business: { name: business.name, phone: business.phone, whatsapp, delivery: business.delivery }, items: menu.items.map(({ id, name, cents }) => ({ id, name, cents })) };
const style = read('src/style.css').replace(/\{\{FONT_(\w+)\}\}/g, (_all, key) => {
  const filename = { FRAUNCES: 'fraunces', ITALIC: 'fraunces-italic', MANROPE: 'manrope' }[key];
  return dataUri(resolve(root, `src/assets/fonts/${filename}.woff2`), 'font/woff2');
});
const slots = {
  ROBOTS: business.indexable ? 'index, follow' : 'noindex, follow',
  REVIEW_LABEL: business.indexable ? '' : ' <span class="review-label">· Versão para revisão</span>',
  FONT_LICENSES: ['fraunces', 'manrope'].map(font => read(`src/assets/fonts/OFL-${font}.txt`).replaceAll('--', '—')).join('\n\n'),
  MENU_DATE: menu.checkedOn, MENU_DATE_LABEL: escaped(dateLabel),
  OPERATOR_INFO: operator
    ? `<p><strong>Operador:</strong> ${escaped(operator.name)} · NIF/NIPC ${operator.taxId}<br>${escaped(operator.address)}<br><a href="mailto:${escaped(operator.email)}">${escaped(operator.email)}</a>${operator.registration ? `<br>${escaped(operator.registration)}` : ''}</p>`
    : '',
  WA_PRIVACY: whatsapp ? ' Se escolher o WhatsApp, o resumo é incluído numa mensagem que pode rever antes de enviar.' : '',
  STRUCTURED_DATA: rawJson(structured), STYLE: style, STORE_DATA: rawJson(appData), APP: read('src/app.js'),
  HERO_MEDIA: mediaMarkup(media.hero, true), CASA_MEDIA: mediaMarkup(media.casa), VISITA_MEDIA: mediaMarkup(media.visita),
  GAL_NOITES: mediaMarkup(media.gallery.noites), GAL_AMORE: mediaMarkup(media.gallery.amore), GAL_SALADAS: mediaMarkup(media.gallery.saladas),
  TABS: tabs, MENUS: menus,
  PHONE: escaped(business.phone), PHONE_LABEL: escaped(business.phoneLabel), MAPS: escaped(business.maps), INSTAGRAM: escaped(business.instagram), MENU_SOURCE: escaped(business.menuSource),
  CONTACT_CTA: whatsapp
    ? `<a class="btn btn-bordered" href="https://wa.me/${whatsapp}" rel="noopener noreferrer" target="_blank">WhatsApp ${svg('chat')}</a>`
    : `<a class="btn btn-bordered" href="tel:${escaped(business.phone)}">Ligar para a Brutta ${svg('phone')}</a>`,
  WA_CONSENT: whatsapp
    ? '<div class="wa-consent" id="wa-consent" hidden><label><input type="checkbox" id="wa-agree" required><span>Concordo em partilhar o resumo quando o enviar pelo WhatsApp. <a class="text-link" href="#privacidade" data-legal>Política de privacidade</a></span></label></div>'
    : ''
};
const output = resolve(root, 'public/index.html');
const html = read('src/index.html').replace(/\{\{([\w]+)\}\}/g, (_all, key) => {
  if (!(key in slots)) throw Error(`Slot desconhecido: ${key}`);
  return slots[key];
});
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, html);
execFileSync(process.execPath, [resolve(root, 'tools/inject-anim.mjs'), 'public/index.html'], { cwd: root, stdio: 'inherit' });
const size = Buffer.byteLength(readFileSync(output));
if (size > 3_000_000) throw Error(`O HTML excede o orçamento de 3 MB (${size} bytes). Comprima as imagens e os vídeos.`);
console.log(`Brutta: ${size.toLocaleString('pt-PT')} bytes · ${menu.items.length} artigos · ficheiro único.`);
