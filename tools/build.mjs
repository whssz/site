#!/usr/bin/env node
/**
 * BUILD — Trattoria Pizzeria Nello's
 *
 *   src/index.html + src/styles.css + src/app.js      (estrutura, visual, interação)
 *   src/carta.json                                    (carta verificada + dados do negócio)
 *   src/media.json + src/assets/                      (fotos reais, fontes OFL)
 *        ↓
 *   public/index.html  — arquivo único e autossuficiente: CSS/JS inline,
 *                        fontes e fotos em base64, zero requisição externa.
 *        ↓
 *   tools/inject-anim.mjs — camada ANIM-KIT v2 (fundo, keyframes, reveal).
 *
 * Uso: node tools/build.mjs
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const ASSETS = path.join(SRC, 'assets');
const OUT = path.join(ROOT, 'public');
const read = (file) => readFileSync(path.join(SRC, file), 'utf8');

const carta = JSON.parse(read('carta.json'));
const mediaList = JSON.parse(read('media.json')).items;
const media = Object.fromEntries(mediaList.map((m) => [m.key, m]));
const site = carta.site;
const cats = Object.fromEntries(carta.categories.map((c) => [c.id, c]));

/* ---------------------------------------------------------------- utilidades */
const MIME = {
  '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
};
const uriCache = new Map();
function dataUri(rel) {
  if (uriCache.has(rel)) return uriCache.get(rel);
  const file = path.join(ASSETS, rel);
  const type = MIME[path.extname(file).toLowerCase()];
  if (!type || !existsSync(file)) throw new Error(`Ativo ausente ou inválido: ${rel}`);
  const uri = `data:${type};base64,${readFileSync(file).toString('base64')}`;
  uriCache.set(rel, uri);
  return uri;
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => `${n.toFixed(2).replace('.', ',')}\u00a0€`;
const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const icon = (name, cls = '') => `<svg class="icon${cls ? ` ${cls}` : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;

function img(key, { cls = '', eager = false, thumb = false, alt } = {}) {
  const m = media[key];
  if (!m) throw new Error(`Foto sem metadados em src/media.json: ${key}`);
  if (!m.alt || m.alt.trim().length < 12) throw new Error(`Foto sem alt descritivo: ${key}`);
  const src = dataUri(thumb ? `media/thumbs/${m.file}` : `media/${m.file}`);
  const [w, h] = thumb ? [176, 176] : [m.w, m.h];
  const load = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<img${cls ? ` class="${cls}"` : ''} src="${src}" width="${w}" height="${h}" alt="${esc(alt ?? m.alt)}" ${load} decoding="async">`;
}

/* ------------------------------------------------------------------ logotipo */
// Se o cliente enviar o logotipo oficial (src/assets/media/logo.webp|png|svg),
// ele entra automaticamente nos espaços data-logo-slot. Sem ele, usamos a
// recriação tipográfica do rótulo real da fachada (verde · Nello's · vermelho).
const logoFile = ['logo.svg', 'logo.webp', 'logo.png'].find((f) => existsSync(path.join(ASSETS, 'media', f)));
const logoImg = (cls) => `<img class="${cls}" src="${dataUri(`media/${logoFile}`)}" alt="Nello's, Trattoria Pizzeria" decoding="async">`;
const LOGO_SM = logoFile ? logoImg('logo-img logo-sm')
  : `<span class="sign sign-sm"><i class="g" aria-hidden="true"></i><span class="w">Nello’s</span><i class="r" aria-hidden="true"></i></span>`;
const LOGO_LG = logoFile ? logoImg('logo-img logo-lg')
  : `<div class="sign sign-lg" role="img" aria-label="Rótulo de Nello's con los colores de Italia: Trattoria, Nello's, Pizzeria"><span class="p g" aria-hidden="true">Trattoria</span><span class="p w" aria-hidden="true">Nello’s</span><span class="p r" aria-hidden="true">Pizzeria</span></div>`;

/* --------------------------------------------------------------------- carta */
function renderDish(it) {
  const cat = cats[it.cat];
  const tags = it.tags || [];
  const savory = !['bebidas', 'postres'].includes(it.cat);
  const badges = [
    tags.includes('picante') ? `<span class="tag tag-hot">${icon('flame')}Picante</span>` : '',
    savory && tags.includes('sin-carne') ? `<span class="tag tag-veg">${icon('leaf')}Sin carne ni pescado</span>` : '',
    it.adult ? '<span class="tag tag-adult">+18</span>' : '',
  ].join('');
  const search = norm([it.name, it.desc, cat.label, ...(it.builder ? it.builder.salsas : [])].join(' '));
  const photo = it.photo ? img(it.photo, { cls: 'dish-photo', thumb: true }) : '';
  const chip = (pr) => `<span class="buy" data-buy data-label="${esc(pr.label)}" data-price="${pr.price}">${cat.showSize && pr.label ? `<span class="buy-size">${esc(pr.label)}</span> ` : ''}<b>${eur(pr.price)}</b></span>`;
  let buy = `<div class="dish-buy">${it.prices.map(chip).join('')}</div>`;
  if (it.builder) {
    buy = `<p class="sauces"><b>Salsas:</b> ${it.builder.salsas.map(esc).join(' · ')}</p>
      <div class="builder js-only">
        <label>Pasta<select data-builder="pasta">${it.builder.pasta.map((x) => `<option>${esc(x)}</option>`).join('')}</select></label>
        <label>Salsa<select data-builder="salsa">${it.builder.salsas.map((x) => `<option>${esc(x)}</option>`).join('')}</select></label>
      </div>
      ${buy}`;
  }
  return `<article class="dish${photo ? ' has-photo' : ''}${it.builder ? ' is-builder' : ''}" id="plato-${it.id}" data-id="${it.id}" data-cat="${it.cat}" data-tags="${[...tags, it.adult ? 'adulto' : ''].join(' ').trim()}" data-search="${esc(search)}">
      <div class="dish-text">
        <h4 class="dish-name"><span>${esc(it.name)}</span>${badges}</h4>
        ${it.desc ? `<p class="dish-desc">${esc(it.desc)}</p>` : ''}
      </div>
      ${photo}
      ${buy}
    </article>`;
}

function renderGroup(cat) {
  const items = carta.items.filter((i) => i.cat === cat.id);
  const notes = (carta.notes[cat.id] || [])
    .map((n) => `<p class="menu-note">${icon('info')}<span>${esc(n)}</span></p>`).join('');
  return `<div class="menu-group" id="carta-${cat.id}" data-group="${cat.id}">
    <div class="group-head">
      <h3 id="h-${cat.id}">${esc(cat.label)}</h3>
      <p>${esc(cat.note)} · <span data-group-count>${items.length}</span> ${items.length === 1 ? 'plato' : 'platos'}</p>
    </div>
    <div class="dishes">
      ${items.map(renderDish).join('\n')}
    </div>
    ${notes}
  </div>`;
}

const CARTA_GROUPS = carta.categories.map(renderGroup).join('\n');
const CARTA_CHIPS = [
  `<button type="button" class="chip" data-cat-filter="all" aria-pressed="true">Toda la carta <span class="chip-n">${carta.items.length}</span></button>`,
  ...carta.categories.map((c) => `<button type="button" class="chip" data-cat-filter="${c.id}" aria-pressed="false">${esc(c.chip)} <span class="chip-n">${carta.items.filter((i) => i.cat === c.id).length}</span></button>`),
].join('');

/* ------------------------------------------------------------------- galeria */
const GALLERY = mediaList.map((m, i) => `<li class="g-item ${m.layout} ${['rv-scale', 'rv-fade', 'rv-scale', 'rv-right'][i % 4]}">
    <figure class="g-fig" data-lb="${i}">
      ${img(m.key, { cls: 'g-img' })}
      <figcaption class="g-cap"><b>${esc(m.caption)}</b><small>Foto: ficha de Nello's en ${esc(m.source)}</small></figcaption>
    </figure>
  </li>`).join('\n') + `
  <li class="g-item wide g-more rv-fade">
    <a href="${esc(site.links.maps)}" target="_blank" rel="noopener noreferrer">
      <span class="g-more-k">Más fotos y reseñas</span>
      <strong>Ver la ficha de Nello's en Google Maps</strong>
      <span class="g-more-go">${icon('external')}</span>
    </a>
  </li>`;

/* ------------------------------------------------------------------- horario */
const HOURS_ROWS = site.hours.map((h) => `<tr data-day="${h.day}"><th scope="row">${h.label}</th><td>${h.ranges.length ? h.ranges.map((r) => `${r[0]}–${r[1]}`).join(' · ') : 'Cerrado'}</td></tr>`).join('');

/* --------------------------------------------------------------------- ondas */
// Onda periódica (curvas Q + T): o período divide 1440, então deslocar -50%
// (= 1440 de 2880) fecha o loop sem emenda visível.
function wave(period, amp, base, height = 120, width = 2880) {
  let d = `M0 ${base} Q ${period / 4} ${base - amp} ${period / 2} ${base}`;
  for (let x = period / 2; x < width; x += period / 2) d += ` T ${x + period / 2} ${base}`;
  return `${d} V ${height} H 0 Z`;
}

/* -------------------------------------------------------------------- fontes */
const FONTS = [
  ['DM Sans', 'normal', '100 1000', 'fonts/dm-sans.woff2'],
  ['Fraunces', 'italic', '100 900', 'fonts/fraunces-italic.woff2'],
  ['Great Vibes', 'normal', '400', 'fonts/great-vibes.woff2'],
].map(([family, style, weight, file]) => `@font-face{font-family:"${family}";font-style:${style};font-weight:${weight};font-display:swap;src:url("${dataUri(file)}") format("woff2")}`).join('\n');

/* ------------------------------------------------------- dados para o script */
const DATA = {
  site: {
    name: site.name, phoneMain: site.phoneMain, phoneMainLabel: site.phoneMainLabel,
    phoneMobile: site.phoneMobile, phoneMobileLabel: site.phoneMobileLabel,
    email: site.email, whatsapp: site.whatsapp, links: site.links, hours: site.hours,
  },
  cats: Object.fromEntries(carta.categories.map((c) => [c.id, c.label])),
  items: carta.items.map(({ id, cat, name, prices, builder, adult }) => ({ id, cat, name, prices, builder, adult: !!adult })),
};
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

const toMin = (t) => t;
const JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: site.name,
  url: site.siteUrl,
  image: `${site.siteUrl}/og-nellos.jpg`,
  telephone: site.phoneMain,
  email: site.email,
  servesCuisine: ['Italiana', 'Pizza napolitana'],
  acceptsReservations: 'True',
  hasMenu: `${site.siteUrl}/#carta`,
  address: {
    '@type': 'PostalAddress', streetAddress: site.address, postalCode: site.postalCode,
    addressLocality: site.city, addressRegion: site.province, addressCountry: 'ES',
  },
  geo: { '@type': 'GeoCoordinates', latitude: site.lat, longitude: site.lng },
  openingHoursSpecification: site.hours.flatMap((h) => h.ranges.map((r) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: `https://schema.org/${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][h.day]}`,
    opens: toMin(r[0]), closes: toMin(r[1]),
  }))),
  sameAs: [site.links.facebook, site.links.linktree],
};

/* ------------------------------------------------------------------ montagem */
const VALUES = {
  FONTS, STYLES: read('styles.css'), SCRIPT: read('app.js'), DATA: json(DATA), JSONLD: json(JSONLD),
  CARTA_GROUPS, CARTA_CHIPS, CARTA_COUNT: String(carta.items.length), GALLERY, HOURS_ROWS,
  LOGO_SM, LOGO_LG, SITE_URL: site.siteUrl, YEAR: String(new Date().getFullYear()),
  WAVE_1: wave(720, 26, 60), WAVE_2: wave(480, 18, 70), WAVE_3: wave(360, 12, 84),
  WAVE_EDGE_1: wave(720, 22, 56, 90), WAVE_EDGE_2: wave(480, 14, 64, 90),
};

function resolve(token) {
  const [kind, ...rest] = token.split(':');
  if (kind === 'img') {
    const [key, cls = '', mode = 'lazy'] = rest;
    return img(key, { cls, eager: mode === 'eager' });
  }
  if (kind === 'site') return esc(site[rest[0]]);
  if (kind === 'link') return esc(site.links[rest[0]]);
  if (kind === 'icon') return icon(rest[0], rest[1] || '');
  if (token in VALUES) return VALUES[token];
  throw new Error(`Token sem valor: {{${token}}}`);
}

let html = read('index.html');
// tokens de valor grande (CSS/JS) primeiro, sem reprocessar o conteúdo inserido
html = html.replace(/\{\{([A-Za-z0-9_:.-]+)\}\}/g, (_, token) => resolve(token));

for (const forbidden of ['</style>', '</body>']) {
  const inScript = (VALUES.SCRIPT.match(new RegExp(forbidden.replace('/', '\\/'), 'g')) || []).length;
  if (inScript) throw new Error(`O script não pode conter ${forbidden} (quebra o injetor).`);
}

mkdirSync(OUT, { recursive: true });
const index = path.join(OUT, 'index.html');
writeFileSync(index, html);
copyFileSync(path.join(ASSETS, 'media', 'og-nellos.jpg'), path.join(OUT, 'og-nellos.jpg'));
writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.siteUrl}/sitemap.xml\n`);
writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site.siteUrl}/</loc></url>\n</urlset>\n`);

execFileSync(process.execPath, [path.join(ROOT, 'tools', 'inject-anim.mjs'), index], { stdio: 'inherit' });

const size = readFileSync(index).length;
console.log(`  public/index.html · ${(size / 1024).toFixed(1)} KB · ${carta.items.length} platos · ${mediaList.length} fotos`);
if (size > 3 * 1024 * 1024) {
  console.error('  ✗ O HTML passou de 3 MB (limite do estúdio).');
  process.exit(1);
}
