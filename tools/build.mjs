import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extname, join, resolve, sep } from 'node:path';
import { ORDER_MODES } from '../src/order.mjs';
import { escapeHtml, favoriteCard, filterButton, icon, productCard } from '../src/markup.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = name => readFileSync(join(root, name), 'utf8');
const data = JSON.parse(read('src/menu.json'));
const { business, categories, favorites, products } = data;
const mime = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.avif': 'image/avif', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const assetsDir = resolve(root, 'assets');
function asset(file) {
  const name = resolve(assetsDir, file);
  if (!name.startsWith(assetsDir + sep) || !mime[extname(name)]) throw new Error(`Ativo inválido: ${file}`);
  return `data:${mime[extname(name)]};base64,${readFileSync(name).toString('base64')}`;
}
for (const product of products) {
  if (product.photo) {
    const { file, width, height, alt } = product.photo;
    if (!alt?.trim() || !Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1) {
      throw new Error(`A foto de ${product.name} precisa de dimensões e texto alternativo`);
    }
    product.photo = { src: asset(file), width, height, alt };
  }
}
if (data.heroVideo) {
  const { file, width, height } = data.heroVideo;
  if (extname(file ?? '') !== '.mp4' || !Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1) {
    throw new Error('O vídeo do hero requer um ficheiro MP4 local e dimensões válidas.');
  }
}
const index = new Map(products.map(p => [p.id, p]));
const first = categories[0];
const firstMenu = products.filter(product => product.category === first.id).slice(0, 6);
const marqueeWords = ['Fermentação natural', 'Pizza artesanal', 'Parede, Cascais', 'À mesa ou para levar'];
const marqueeGroup = `<div class="marquee-group">${[...marqueeWords, ...marqueeWords].map(word => `<span>${escapeHtml(word)}</span>${icon('star')}`).join('')}</div>`;
const parts = {
  styles: read('src/site.css'),
  data: JSON.stringify({ business, categories, products }).replaceAll('<', '\\u003c'),
  application: ['src/order.mjs', 'src/markup.mjs', 'src/app.js'].map(name => read(name)
    .replace(/^import .*?;\r?\n/gm, '')
    .replace(/^export \{[^\n]+\};\r?\n/gm, '')).join('\n'),
  marquee: marqueeGroup.repeat(2),
  favorites: favorites.map((id, i) => favoriteCard(index.get(id), i)).join('\n'),
  filters: categories.map(filterButton).join('\n'),
  'initial-menu': firstMenu.map(product => productCard(product, first)).join('\n'),
  hours: business.hours.map(([day, value]) => `<div><dt>${escapeHtml(day)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('\n'),
  modes: business.modes.map(mode => `<label><input type="radio" value="${escapeHtml(mode)}" name="order-mode"><span>${escapeHtml(ORDER_MODES[mode])}</span></label>`).join('\n'),
  'hero-video': data.heroVideo ? `<video id="hero-film" width="${Number(data.heroVideo.width)}" height="${Number(data.heroVideo.height)}" muted autoplay loop playsinline preload="none" poster="${asset('pizzas-a-mesa.webp')}" aria-hidden="true" hidden></video><template id="hero-film-source"><source src="${asset(data.heroVideo.file)}" type="video/mp4"></template>` : '',
};
let html = read('src/index.html').replace(/\{\{([\w-]+)\}\}/g, (_, key) => {
  if (!Object.hasOwn(parts, key)) throw new Error(`Marcador não reconhecido: ${key}`);
  return parts[key];
});
html = html.replace(/\{\{(asset|icon|biz):([^}]+)\}\}/g, (_, type, key) => {
  if (type === 'asset') return asset(key);
  if (type === 'icon') return icon(key);
  if (!Object.hasOwn(business, key) || typeof business[key] !== 'string') throw new Error(`Dado não publicado: ${key}`);
  return escapeHtml(business[key]);
});
const output = join(root, 'public', 'index.html');
mkdirSync(join(root, 'public'), { recursive: true });
writeFileSync(output, html);
execFileSync(process.execPath, [join(root, 'tools', 'inject-anim.mjs'), output], { stdio: 'inherit' });
const weight = readFileSync(output).length;
if (weight > 3_000_000) throw new Error(`HTML com ${weight} bytes. O orçamento do site é 3 MB.`);
console.log(`Avó Maria Pizza: ${weight.toLocaleString('pt-PT')} bytes, HTML independente.`);
