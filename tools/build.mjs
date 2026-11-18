import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { formatPrice, hasPrice } from '../src/pedido.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const input = readFileSync(join(root, 'content/site.json'), 'utf8');
const data = JSON.parse(input);
const assetRoot = realpathSync(join(root, 'assets'));
const read = file => readFileSync(join(root, file), 'utf8');
const esc = str => String(str).replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]));
const svg = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#${id}"></use></svg>`;
const ic = (id, cls) => svg(`i-${id}`, cls);
const external = 'target="_blank" rel="noopener noreferrer"';
const money = cents => `<span class="item-price">${esc(formatPrice(cents))}</span>`;
function https(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error(`URL não autorizada: ${url}`);
  return esc(parsed.href);
}
function id(value) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) throw new Error(`Identificador inválido: ${value}`);
  return value;
}
function dimensions(asset) {
  if (![asset.width, asset.height].every(value => Number.isInteger(value) && value > 0)) throw new Error('Indique width e height reais.');
  return `width="${asset.width}" height="${asset.height}"`;
}
const mime = { '.woff2': 'font/woff2', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
function inlineAsset(asset, expected) {
  if (asset.authorized !== true || !asset.source?.trim()) throw new Error(`Registe a origem e confirme a licença de cada ficheiro: ${asset.file}`);
  const path = realpathSync(resolve(root, asset.file));
  const filename = relative(assetRoot, path);
  const type = mime[extname(path).toLowerCase()];
  if (isAbsolute(filename) || filename.startsWith('..') || !type?.startsWith(expected)) throw new Error(`Ficheiro inválido para ${expected}: ${asset.file}`);
  return `data:${type};base64,${readFileSync(path).toString('base64')}`;
}
function image(asset, options = {}) {
  if (!asset.alt?.trim() && !options.decorative) throw new Error(`Escreva o texto alternativo de ${asset.file}.`);
  const src = inlineAsset(asset, 'image/');
  const attrs = options.decorative ? 'alt=""' : `alt="${esc(asset.alt)}"`;
  const mode = options.eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  const variants = Array.isArray(asset.variants) ? asset.variants : [];
  const srcset = variants.length ? ` srcset="${[...variants, asset].map(variant => {
    dimensions({ width: variant.width, height: variant.height ?? asset.height });
    return `${variant === asset ? src : inlineAsset({ ...asset, ...variant }, 'image/')} ${variant.width}w`;
  }).join(', ')}" sizes="${esc(options.sizes ?? '(max-width: 620px) 100vw, 45vw')}"` : '';
  return `<img src="${src}" ${attrs} ${dimensions(asset)}${srcset} ${mode} decoding="async">`;
}
function font(name) {
  return `data:font/woff2;base64,${readFileSync(join(assetRoot, `fonts/${name}.woff2`)).toString('base64')}`;
}

const { location, media, gallery, news, order } = data;
if (order.whatsapp !== null && !/^[1-9]\d{7,14}$/.test(order.whatsapp)) throw new Error('WhatsApp: indique apenas os dígitos do número oficial internacional.');
if (order.whatsapp && !order.whatsappSource?.trim()) throw new Error('Registe whatsappSource antes de ativar o canal.');
if (location.hours.length && !location.hoursSource?.trim()) throw new Error('Registe hoursSource antes de publicar horários.');
const maps = https(location.maps);
const directions = https(location.directions);
const instagram = https(data.instagram);
const menuSource = https(data.menuSource);
const forno = https(gallery.find(entry => entry.kind === 'forno').url);
const phone = location.phone ? location.phone.replace(/[^+0-9]/g, '') : null;
if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error('Telefone inválido.');
const phoneLabel = phone ? esc(location.phone) : '';
const logo = media.logo ? image(media.logo, { decorative: true, eager: true }) : `<svg class="wm-icon" viewBox="0 0 40 47" aria-hidden="true" focusable="false"><ellipse cx="20" cy="23.5" rx="17" ry="21" fill="none" stroke="currentColor" stroke-width=".75"/><ellipse cx="20" cy="23.5" rx="14.5" ry="18.5" fill="none" stroke="currentColor" opacity=".48" stroke-width=".55"/><path fill="currentColor" d="M9 23.5 11 22l2 1.5-2 1.5Zm18 0L29 22l2 1.5-2 1.5Z"/><text x="20" y="31.3" text-anchor="middle" font-family="Cormorant, Georgia, serif" font-size="23" font-weight="600" fill="#f4e8d3">D</text></svg><span class="wm-name" aria-hidden="true">Dai Friarielli<small>Malagueta</small></span>`;

const heroFallback = `<svg class="hero-engraving" viewBox="0 0 480 400" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="ceramic-glaze" cx="56%" cy="39%" r="62%"><stop stop-color="#a97458" stop-opacity=".39"/><stop offset=".75" stop-color="#664437" stop-opacity=".25"/><stop offset="1" stop-color="#161727" stop-opacity=".6"/></radialGradient>
    <linearGradient id="plate-line" x2="1" y2="1"><stop stop-color="#f2c5a5" stop-opacity=".9"/><stop offset=".5" stop-color="#b88579" stop-opacity=".53"/><stop offset="1" stop-color="#efbea0" stop-opacity=".55"/></linearGradient>
    <path id="rim-top" d="M98 204a142 143 0 1 1 284 0"/>
    <path id="rim-bottom" d="M93 207a147 143 0 0 0 294 0"/>
  </defs>
  <g fill="none" stroke="url(#plate-line)">
    <ellipse cx="240" cy="200" rx="191" ry="171" transform="rotate(-17 240 200)" stroke-dasharray="1 5" stroke-width=".75" opacity=".57"/>
    <ellipse cx="240" cy="200" rx="165" ry="176" stroke-width=".85" fill="url(#ceramic-glaze)"/>
    <ellipse cx="240" cy="200" rx="157" ry="168" stroke-width=".65"/>
    <ellipse cx="240" cy="200" rx="125" ry="137" stroke-width=".7"/>
    <ellipse cx="240" cy="200" rx="120" ry="132" stroke-width=".65" stroke-dasharray="1 3" opacity=".63"/>
    <path d="M240 15v-8m0 386v-8M58 200H32m390 0h26M35 197v6m410-6v6" stroke-width=".8" opacity=".8"/>
    <path d="M77 99h24m279 199h24M122 63l-13-12m249 286 13 12" stroke-width=".75" opacity=".5"/>
  </g>
  <g fill="currentColor" font-family="Manrope,Arial,sans-serif" font-size="10.5" letter-spacing="3.1" font-weight="700">
    <text><textPath href="#rim-top" text-anchor="middle" startOffset="50%">DAI FRIARIELLI MALAGUETA</textPath></text>
    <text><textPath href="#rim-bottom" text-anchor="middle" startOffset="50%">PIZZA · PASTA · TIRAMISÙ</textPath></text>
  </g>
  <use href="#d-sprig" x="162" y="104" width="176" height="176" transform="rotate(8 240 200)" color="#e0bfa0" opacity=".89"/>
  <use href="#d-pepper" x="142" y="114" width="176" height="176" transform="rotate(-9 240 200)" color="#f1ab98"/>
  <use href="#d-spark" x="87" y="192" width="15" height="15" opacity=".88"/><use href="#d-spark" x="378" y="192" width="15" height="15" opacity=".88"/>
  <use href="#d-spark" x="173" y="137" width="10" height="10" opacity=".75"/><use href="#d-spark" x="308" y="256" width="12" height="12" opacity=".67"/>
  <g fill="currentColor" opacity=".57"><circle cx="160" cy="162" r="1.6"/><circle cx="168" cy="173" r="1"/><circle cx="180" cy="126" r="1.3"/><circle cx="287" cy="282" r="1.2"/><circle cx="298" cy="277" r="1.4"/><circle cx="320" cy="239" r="1.2"/><circle cx="317" cy="153" r="1.1"/></g>
</svg>`;
function embeddedScene(photo, video, key, css, options) {
  const source = `video-src-${key}`;
  return `<div class="${css}">${image(photo, options)}${video ? `<video data-local-video="${source}" autoplay muted loop playsinline preload="none" ${dimensions(video)} aria-hidden="true"></video><script type="text/plain" id="${source}">${inlineAsset(video, 'video/')}</script>` : ''}</div>`;
}
const heroVisual = media.hero
  ? embeddedScene(media.hero.photo, media.hero.video, 'hero', 'hero-media', { eager: true, sizes: '(max-width: 620px) calc(100vw - 40px), 42vw' })
  : heroFallback;
const houseVisual = media.house ? image(media.house) : `<svg viewBox="0 0 147 162" class="house-stamp" aria-hidden="true" focusable="false"><defs><path id="stamp-name" d="M13 79a60 59 0 1 1 120 0"/><path id="stamp-origin" d="M19 86a54 54 0 1 0 108 0"/></defs><use href="#d-oven" x="25" y="43" width="96" height="71"/><g fill="currentColor" font-family="Manrope, Arial, sans-serif" font-size="9" font-weight="800" letter-spacing="2"><text><textPath href="#stamp-name" text-anchor="middle" startOffset="50%">IL FORNO</textPath></text><text><textPath href="#stamp-origin" text-anchor="middle" startOffset="50%">DALL’ITALIA</textPath></text></g><use href="#d-spark" x="12" y="77" width="9" height="9"/><use href="#d-spark" x="126" y="77" width="9" height="9"/></svg>`;
const allItems = new Map();
for (const category of data.menu) {
  id(category.id); id(category.icon);
  if (!category.items.length) throw new Error(`Categoria vazia: ${category.title}`);
  for (const item of category.items) {
    id(item.id);
    if (allItems.has(item.id)) throw new Error(`Prato duplicado: ${item.id}`);
    if (item.priceCents !== null && (!hasPrice(item) || item.priceCents > 1_000_000 || !item.priceSource?.trim())) throw new Error(`Valor sem fonte confirmada: ${item.name}`);
    allItems.set(item.id, item);
  }
}
const addButton = (item, text = false) => `<button class="${text ? 'text-link' : 'item-add'}" type="button" data-add="${item.id}" aria-label="${text ? 'Adicionar ao pedido: ' + esc(item.name) : 'Adicionar ' + esc(item.name) + ' ao pedido'}"${text ? '' : ` title="Adicionar ${esc(item.name)}"`}>${text ? 'Adicionar ao pedido ' : ''}${ic('plus')}</button>`;
const tabs = data.menu.map(category => `<button id="tab-${category.id}" type="button" data-menu-tab="${category.id}" aria-controls="cat-${category.id}">${ic(category.icon)} ${esc(category.title)}</button>`).join('');
const panels = data.menu.map(category => `<section class="menu-panel" data-no-bridge id="cat-${category.id}" aria-label="${esc(category.title)}"><div class="menu-panel-header">${ic(category.icon)}<h3>${esc(category.title)}</h3><span lang="it">${esc(category.italian)}</span></div><ul class="menu-items">${category.items.map(item => `<li class="menu-item">${item.media ? `<div class="mini-photo">${image(item.media, { sizes: '62px' })}</div>` : ''}<div><div class="item-name"><h4>${esc(item.name)}</h4>${item.tag ? `<span class="item-tag">${esc(item.tag)}</span>` : ''}</div>${item.description ? `<p>${esc(item.description)}</p>` : ''}</div><div class="item-choice">${hasPrice(item) ? money(item.priceCents) : ''}${addButton(item)}</div></li>`).join('')}</ul></section>`).join('\n');
const featureSymbol = { chilli: 'd-pepper', pasta: 'd-pasta', dolce: 'd-dolce' };
const features = data.features.map((feature, index) => {
  const item = allItems.get(feature.itemId);
  if (!item) throw new Error(`Especialidade sem produto: ${feature.itemId}`);
  return `<article class="signature-card card ${id(feature.theme)} rv-scale" style="transition-delay:${index * 75}ms"><div class="signature-visual">${item.media ? `<div class="sig-photo">${image(item.media)}</div>` : `<span class="oval" aria-hidden="true"></span>${svg(featureSymbol[feature.theme], 'engraving')}`}<span class="visual-no" aria-hidden="true">0${index + 1} /</span></div>
  <div class="signature-copy"><div class="sec-label">${esc(feature.label)}</div><h3>${esc(item.name)}</h3>${item.description ? `<p>${esc(item.description)}</p>` : ''}<div class="signature-action">${addButton(item, true)}${hasPrice(item) ? money(item.priceCents) : ''}</div></div></article>`;
}).join('\n');
const gallerySymbols = { forno: 'd-oven', tavola: 'd-dolce', sabores: 'd-sprig' };
const galleryTiles = gallery.map((entry, index) => `<a class="gallery-card card ${id(entry.kind)} ${entry.media ? 'with-media' : ''} ${index === 0 ? 'rv-left' : 'rv-fade'}" href="${https(entry.url)}" ${external}>
  ${entry.media ? embeddedScene(entry.media, entry.video, id(entry.kind), 'gallery-media', { sizes: '(max-width: 620px) 100vw, 30vw' }) : `<div class="gallery-symbol">${svg(gallerySymbols[entry.kind], 'engraving')}</div>`}
  <div class="gallery-caption"><div class="sec-label">${entry.type === 'Reel' ? ic('play') : svg('d-spark', 'spark')} ${esc(entry.label)}</div><h3>${esc(entry.title)}</h3><p>${esc(entry.text)}</p><span class="gallery-meta">${esc(entry.type)} no Instagram ${ic('up-right', 'icon gallery-cta-icon')}</span></div></a>`).join('\n');
const newsTiles = news.length ? `<div class="news-grid">${news.map(entry => `<article class="news-tile"><h3>${esc(entry.title)}</h3><p>${esc(entry.text)}</p><a class="text-link" href="${https(entry.url)}" ${external}>Ver publicação ${ic('up-right')}</a></article>`).join('')}</div>` : '';
const hours = location.hours.length ? `<dl>${location.hours.map(({ days, hours }) => `<div><dt>${esc(days)}</dt><dd>${esc(hours)}</dd></div>`).join('')}</dl>` : `<a class="inline-link" href="${maps}" ${external}>Consultar horário no Google Maps</a>`;
const visitContact = order.whatsapp
  ? `<a class="btn btn-outline" href="${https(`https://wa.me/${order.whatsapp}`)}" ${external}>Falar no WhatsApp ${ic('chat')}</a>`
  : phone ? `<a class="btn btn-outline" href="tel:${phone}">Ligar para a casa ${ic('phone')}</a>` : `<a class="btn btn-outline" href="${instagram}" ${external}>Abrir perfil oficial ${ic('instagram')}</a>`;
const alternatives = `${phone ? `<a class="text-link" href="tel:${phone}">${ic('phone')} Ligar para a casa</a>` : ''}${order.platform ? `<a class="text-link" href="${https(order.platform.url)}" ${external}>${esc(order.platform.name)} ${ic('up-right')}</a>` : ''}`;
const marquees = ['Pizza artesanal', 'Massas', 'Tiramisù', 'Murtal, Parede', 'Cucina italiana'];
const ribbon = [...marquees, ...marquees].map(word => `<span>${esc(word)}</span>${svg('d-spark', 'spark')}`).join('');
const scriptData = { name: data.name, order, menu: data.menu.map(({ id, items }) => ({ id, items: items.map(({ id, name, priceCents }) => ({ id, name, priceCents })) })) };

let html = read('src/index.html');
const styles = read('src/site.css').replace(/\{\{FONT_(DISPLAY|SCRIPT|TEXT)\}\}/g, (_, name) => font(name.toLowerCase()));
const replace = (marker, contents) => { html = html.replaceAll(marker, () => contents); };
for (const [key, value] of Object.entries({ FORNO: forno, INSTAGRAM: instagram, MAPS: maps, DIRECTIONS: directions, COMPLAINTS: https(data.complaints), MENU_SOURCE: menuSource })) replace(`{{${key}}}`, value);
for (const [key, value] of Object.entries({
  ROBOTS: data.indexable ? '' : '<meta name="robots" content="noindex, nofollow">',
  OG_URL: data.siteUrl ? `<meta property="og:url" content="${https(data.siteUrl)}">` : '',
  WORDMARK: logo, HERO_VISUAL: heroVisual, HOUSE_VISUAL: houseVisual, MARQUEE: `<div>${ribbon}</div><div>${ribbon}</div>`,
  MENU_TABS: tabs, MENU_PANELS: panels, MENU_PRICE_NOTE: [...allItems.values()].some(item => !hasPrice(item)) ? 'Confirme preços e disponibilidade com a casa.' : 'Confirme a disponibilidade com a casa.',
  FEATURES: features, GALLERY: galleryTiles, NEWS: newsTiles, VISIT_CONTACT: visitContact, VISIT_VISUAL: media.visit ? `<div class="visit-photo">${image(media.visit)}</div>` : '',
  ADDRESS: location.street ? `<address>${esc(location.street)}<br>${esc(location.locality)}</address>` : `<a class="inline-link" href="${maps}" ${external}>Consultar morada no mapa</a>`,
  HOURS: hours, FOOTER_PHONE: phone ? `<a href="tel:${phone}">${phoneLabel}</a>` : '', ORDER_ALTERNATIVES: alternatives
})) replace(`<!-- ${key} -->`, value);
if (media.hero) replace('class="hero-art stack"', 'class="hero-art stack has-media"');
const licenses = ['display', 'script', 'text'].map(name => `/* ${read(`assets/fonts/${name}-LICENSE.txt`).trim()} */`).join('\n');
replace('/* SITE_STYLES */', `${styles}\n${licenses}`);
replace('/* SITE_DATA */', JSON.stringify(scriptData).replaceAll('<', '\\u003c'));
replace('/* SITE_SCRIPT */', `${read('src/pedido.mjs').replace(/^export /gm, '')}\n${read('src/site.js')}`);

const leftover = html.match(/\{\{[A-Z_]+\}\}/);
if (leftover) throw new Error(`Marcador não resolvido: ${leftover[0]}`);

const publicDir = join(root, 'public');
const destination = join(publicDir, 'index.html');
mkdirSync(publicDir, { recursive: true });
writeFileSync(destination, html);
const injection = spawnSync(process.execPath, [join(root, 'tools/inject-anim.mjs'), 'public/index.html'], { cwd: root, stdio: 'inherit' });
if (injection.status !== 0) process.exit(injection.status ?? 1);
const final = readFileSync(destination);
if (final.byteLength > 3_200_000) throw new Error('O HTML excede 3,2 MB. Comprima os ficheiros antes de publicar.');
console.log(`Site autossuficiente: ${final.byteLength.toLocaleString('pt-PT')} bytes · ${allItems.size} artigos em ${data.menu.length} categorias.`);
