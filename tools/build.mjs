import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = (file) => readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
const output = new URL('../public/', import.meta.url);
const { whatsapp, categories, products } = JSON.parse(src('catalogo.json'));
const media = JSON.parse(src('midia.json'));
const mime = new Map([['.woff2', 'font/woff2'], ['.svg', 'image/svg+xml'], ['.webp', 'image/webp'], ['.avif', 'image/avif'], ['.mp4', 'video/mp4']]);
const esc = (str) => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const data = (file) => {
  const type = mime.get(extname(file).toLowerCase());
  if (file !== basename(file) || !type) throw new Error(`Ativo inválido: ${file}`);
  return `data:${type};base64,${readFileSync(new URL(`../src/assets/${file}`, import.meta.url)).toString('base64')}`;
};
const icon = (name, classes = '') => `<svg class="icon ${classes}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const renderMedia = (config, eager = false) => {
  if (!config) return '';
  const { photo, alt, width, height, mobile, video } = config;
  const isImage = file => /\.(webp|avif)$/i.test(file);
  if (!isImage(photo) || typeof alt !== 'string' || !alt.trim() || !Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1 || (mobile && !isImage(mobile)) || (video && !/\.mp4$/i.test(video))) {
    throw new Error(`Configure WebP/AVIF, alt, dimensões reais e (opcional) MP4: ${photo}`);
  }
  const photoUrl = data(photo);
  return `<div class="media-slot"><picture>${mobile ? `<source media="(max-width: 620px)" srcset="${data(mobile)}">` : ''}` +
    `<img src="${photoUrl}" width="${width}" height="${height}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>` +
    (video ? `<video data-src="${data(video)}" poster="${photoUrl}" width="${width}" height="${height}" muted autoplay loop playsinline preload="none" aria-hidden="true" hidden></video>` : '') + '</div>';
};

const fonts = [
  ['Fraunces', 'normal', '100 900', 'fraunces-normal.woff2'],
  ['Fraunces', 'italic', '100 900', 'fraunces-italic.woff2'],
  ['DM Sans', 'normal', '100 1000', 'dm-sans.woff2'],
].map(([family, style, weight, file]) => `@font-face{font-family:"${family}";font-style:${style};font-weight:${weight};font-display:swap;src:url("${data(file)}") format("woff2");}`).join('\n');

const productCards = products.map(p => {
  const { singular, icon: pictogram } = categories[p.category];
  const options = p.options ? `<div class="product-option js-only"><label for="flavor-${p.id}">Sabor da massa</label><select id="flavor-${p.id}" aria-describedby="error-${p.id}" required><option value="">Selecione um sabor</option>${p.options.map(option => `<option value="${esc(option)}">${esc(option)}</option>`).join('')}</select><p class="option-error" id="error-${p.id}" role="alert" hidden>Escolha o sabor para continuar.</p></div>` : '';
  return `<article class="card product-card tone-${p.tone}" data-product="${p.id}" data-category="${p.category}" aria-labelledby="name-${p.id}">
    <div class="product-visual">
      ${renderMedia(media.produtos?.[p.id])}<span class="product-category">${icon(pictogram)} ${esc(singular)}</span>${icon('star', 'product-mark')}
    </div>
    <div class="product-copy">
      <h3 id="name-${p.id}">${esc(p.name)}</h3>
      <p>${esc(p.description)}</p>${options}
      <div class="product-actions js-only">
        <button type="button" class="btn add-btn" data-add="${p.id}" aria-label="Adicionar ${esc(p.orderName)}">${icon('plus')} <span>Adicionar</span></button>
        <span class="line-in-order" data-line-count hidden></span>
      </div>
    </div>
  </article>`;
}).join('\n');

const posts = [
  { id: 'doce-de-leite', name: 'Doce de leite e canela', type: 'Sorvetes', tone: 'caramelo', url: 'https://www.instagram.com/p/CN-TQ03rvVK/' },
  { id: 'maracuja-milho', name: 'Maracujá e milho verde', type: 'Sorvetes', tone: 'baunilha', url: 'https://www.instagram.com/p/CG3KXw6Lhm3/' },
  { id: 'paleta-coco', name: 'Paleta de coco recheada', type: 'Paletas', tone: 'rosa', url: 'https://www.instagram.com/p/CGIHytFjWXU/' },
];
const gallery = posts.map((p, i) => `<a class="gallery-tile tone-${p.tone} ${['rv-scale', 'rv-fade', 'rv-right'][i]}" href="${p.url}" target="_blank" rel="noopener noreferrer">
    ${renderMedia(media.galeria?.[p.id])}<span class="gallery-top">${icon('instagram')} ${p.type} · Instagram</span>
    <span class="gallery-bottom"><strong>${esc(p.name)}</strong><span class="tile-arrow">${icon('external')}</span></span>
  </a>`).join('\n');

const labels = [...Object.values(categories).map(c => c.label), 'Santa Cruz', 'Sorvete Supremo'];
const run = `<div class="ribbon-run">${[...labels, ...labels].map(label => `<span>${esc(label)}</span>${icon('star')}`).join('')}</div>`;
const values = {
  FONTS: fonts,
  STYLES: src('styles.css'),
  SCRIPTS: src('site.js'),
  LOGO: data('logo.webp'),
  HERO_MEDIA: renderMedia(media.hero, true) || `<img class="marbling" src="${data('marmore.svg')}" width="720" height="580" alt="" fetchpriority="high" decoding="async">`,
  ABOUT_MEDIA: renderMedia(media.experiencia),
  CTA_MEDIA: renderMedia(media.cta),
  PRODUCTS: productCards,
  PRODUCT_COUNT: products.length,
  FILTERS: Object.entries(categories).map(([key, c]) => `<button class="filter" type="button" data-filter="${key}" aria-pressed="false" aria-controls="produtos">${icon(c.icon)} ${c.label}</button>`).join('\n'),
  RIBBON: run.repeat(2),
  GALLERY: gallery,
  JS_DATA: `const orderData = ${JSON.stringify({ whatsapp, products: products.map(({ id, orderName, tone, options }) => ({ id, orderName, tone, options })) }).replace(/</g, '\\u003c')};`,
  WHATSAPP: whatsapp,
  MAPS: esc('https://www.google.com/maps/place/Sorvete+Supremo/@-22.920799,-43.6897084,17z/data=!3m1!4b1!4m6!3m5!1s0x9bfa4232024f7b:0x28ed4e855a6093a4!8m2!3d-22.920799!4d-43.6897084!16s%2Fg%2F11c1s_2mpz'),
};

const html = src('index.html').replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
  if (!(key in values)) throw new Error(`Token sem valor: ${key}`);
  return values[key];
});
mkdirSync(output, { recursive: true });
const index = fileURLToPath(new URL('index.html', output));
writeFileSync(index, html);
execFileSync(process.execPath, [fileURLToPath(new URL('inject-anim.mjs', import.meta.url)), index], { stdio: 'inherit' });
