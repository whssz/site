import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { PNG } from 'pngjs';
import { launchBrowser } from '../tools/browser.mjs';

const require = createRequire(import.meta.url);
const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const fixturePath = '/fixture-verificacao-local';
// A fictitious NANP test number only in this intercepted fixture — never in the built site.
const fixture = html.replace(/(<script id="site-data" type="application\/json">)([^<]*)(<\/script>)/, (_, start, json, end) => {
  const c = JSON.parse(json);
  Object.assign(c.order, { whatsapp: '12025550100', directModes: ['pickup', 'delivery'], requiresDeliveryAddress: true });
  c.menu[0].items.find(item => item.id === 'malagueta').priceCents = 1205;
  return start + JSON.stringify(c) + end;
});
const server = createServer((request, response) => {
  if (request.url === '/favicon.ico') return response.writeHead(204).end();
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(request.url === fixturePath ? fixture : html);
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await launchBrowser();
const faults = [];
const seenNetwork = [];
const init = async (width, height, opts = {}) => {
  const context = await browser.newContext({ viewport: { width, height }, ...opts });
  const page = await context.newPage();
  page.setDefaultTimeout(5500);
  page.on('pageerror', error => faults.push(String(error)));
  page.on('request', request => seenNetwork.push(request.url()));
  return { page, context };
};
const openCart = (page) => page.locator('.bag-trigger').click();
const add = (page, id) => page.locator('#menu-panels').locator(`[data-add="${id}"]:visible`).click();
const counts = (page) => page.locator('.bag-trigger [data-cart-count]').textContent();
const summary = (page) => page.locator('#order-summary').inputValue();
const waitHidden = (page, selector) => page.locator(selector).waitFor({ state: 'hidden' });
async function axe(page, label) {
  if (!await page.evaluate(() => Boolean(window.axe))) await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => {
    const report = await window.axe.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
    return report.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }));
  });
  assert.deepEqual(violations, [], `WCAG automatizado: ${label}`);
  console.log(`axe ${label}: 0 violações`);
}

function lum([r, g, b]) {
  const f = value => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return .2126 * f(r) + .7152 * f(g) + .0722 * f(b);
}
async function sampleContrast(page) {
  const results = [];
  for (const [selector, min] of [['.hero h1>span', 3], ['.hero h1 em', 3], ['.hero-lede', 4.5], ['.hero .btn-primary', 4.5], ['.about-body p', 4.5], ['#cat-pizzas .menu-item p', 4.5], ['.gallery-card p', 4.5], ['.visit-row address', 4.5]]) {
    const target = page.locator(selector).first();
    await target.scrollIntoViewIfNeeded();
    const fg = await target.evaluate(el => {
      const color = getComputedStyle(el).color;
      el.style.setProperty('color', 'transparent', 'important');
      return color;
    });
    const png = PNG.sync.read(await target.screenshot());
    await target.evaluate(el => el.style.removeProperty('color'));
    const rgb = fg.match(/[\d.]+/g).slice(0, 3).map(Number);
    const l = lum(rgb);
    let low = Infinity;
    // Ignore the element border (sample interior pixels of the rendered backdrop).
    for (let y = 5; y < png.height - 5; y++) {
      for (let x = 9; x < png.width - 9; x++) {
        if (selector.includes('.btn') && (x < 25 || x > png.width - 25 || y < 13 || y > png.height - 13)) continue;
        const i = (y * png.width + x) * 4;
        const bg = lum([png.data[i], png.data[i + 1], png.data[i + 2]]);
        low = Math.min(low, (Math.max(l, bg) + .05) / (Math.min(l, bg) + .05));
      }
    }
    assert(low >= min, `contraste em ${selector}: ${low.toFixed(2)}:1, mínimo ${min}`);
    results.push(`${selector} ${low.toFixed(2)}:1`);
  }
  console.log(`Contraste amostrado em fundo renderizado: ${results.join(' · ')}`);
}

try {
  const desktop = await init(1440, 900, { permissions: ['clipboard-read', 'clipboard-write'] });
  const page = desktop.page;
  await page.goto(origin);
  await page.evaluate(() => document.fonts.ready);
  assert.match(await page.title(), /Dai Friarielli Malagueta/);
  assert.equal(await page.locator('main > section').count(), 7);
  assert.equal(await page.locator('#menu-tabs button').count(), 6);
  assert.equal(await page.locator('#menu-panels li').count(), 29);
  assert.equal(await page.getByRole('link', { name: 'Livro de Reclamações Eletrónico' }).getAttribute('href'), 'https://www.livroreclamacoes.pt/Inicio/');
  assert.equal(await page.locator('.site-footer a[href="tel:+351215986555"]').count(), 1);
  const aura = () => page.locator('.bg-aurora').evaluate(el => getComputedStyle(el).transform);
  const a0 = await aura();
  await page.waitForFunction(previous => getComputedStyle(document.querySelector('.bg-aurora')).transform !== previous, a0);
  await page.locator('#visitar').evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
  const loop = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect.getTiming().iterations === Infinity).length);
  assert(loop >= 2);
  const a1 = await aura();
  await page.waitForFunction(previous => getComputedStyle(document.querySelector('.bg-aurora')).transform !== previous, a1);
  await page.locator('#motion-toggle').click();
  assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
  await page.locator('#motion-toggle').click();
  assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'), 'false');
  console.log('Movimento: fundo medido no hero e em Visitar; pausa e retoma confirmadas.');

  await page.locator('.hero').getByRole('link', { name: 'Explorar a ementa' }).click();
  await page.waitForURL(/#ementa$/);
  await page.getByRole('tab', { name: 'Pizzas', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: 'Massas e risoto' }).getAttribute('aria-selected'), 'true');
  await add(page, 'gnocchi');
  await page.getByRole('tab', { name: 'Pizzas', exact: true }).click();
  await add(page, 'malagueta');
  await add(page, 'malagueta');
  await page.getByRole('tab', { name: 'Sobremesas' }).click();
  await add(page, 'tiramisu');
  assert.equal(await counts(page), '4');
  await openCart(page);
  const drawer = page.getByRole('dialog', { name: 'O meu pedido' });
  await drawer.getByRole('button', { name: 'Aumentar quantidade de Pizza Malagueta' }).click();
  await drawer.getByRole('button', { name: 'Diminuir quantidade de Pizza Malagueta' }).click();
  await drawer.getByRole('button', { name: 'Remover Gnocchi à Moda de Sorrento' }).click();
  await drawer.getByLabel('Entrega', { exact: true }).check();
  await drawer.getByLabel('Observações').fill('Cortar a pizza em fatias, se possível.');
  assert.equal(await drawer.getByLabel('Morada de entrega').isVisible(), false);
  assert.equal(await drawer.getByRole('button', { name: /whatsapp/i }).count(), 0);
  await drawer.getByText('Conferir resumo', { exact: true }).click();
  const message = await summary(page);
  const expected = 'Olá, Dai Friarielli Malagueta! Gostaria de consultar este pedido:\n\n• 2 × Pizza Malagueta\n• 1 × Tiramisù\n\nPreferência: Entrega\n\nObservações: Cortar a pizza em fatias, se possível.\nConfirme por favor a disponibilidade e os preços.';
  assert.equal(message, expected);
  await drawer.getByRole('button', { name: 'Copiar resumo' }).click();
  await drawer.getByText('Resumo copiado. Ainda não foi enviado.').waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected);
  assert.equal(await drawer.getByRole('link', { name: 'Uber Eats' }).getAttribute('href'), 'https://www.ubereats.com/pt/store/dai-friarielli-malagueta/jbKPBI8IT8CLSLdkKLpEkw');
  await page.keyboard.press('Escape');
  await waitHidden(page, '#order-dialog');
  await page.waitForFunction(() => document.activeElement.classList.contains('bag-trigger'));
  await page.locator('#site-nav').getByRole('link', { name: 'Galeria' }).click();
  await page.waitForURL(/#galeria$/);
  await openCart(page);
  assert.equal(await summary(page), expected, 'as observações mantêm-se durante a navegação');
  await page.reload();
  await openCart(page);
  assert.equal(await counts(page), '3');
  assert.match(await summary(page), /2 × Pizza Malagueta[\s\S]*1 × Tiramisù[\s\S]*Preferência: Entrega/);
  assert.doesNotMatch(await summary(page), /Observações/);
  await drawer.getByRole('button', { name: 'Remover Pizza Malagueta' }).click();
  await drawer.getByRole('button', { name: 'Remover Tiramisù' }).click();
  await drawer.getByText('Ainda não há pratos no pedido.').waitFor();
  assert.equal(await counts(page), '0');
  await drawer.getByRole('link', { name: 'Explorar a ementa' }).click();
  await page.waitForURL(/#ementa$/);
  await page.getByRole('link', { name: 'Privacidade', exact: true }).click();
  await page.getByRole('dialog', { name: 'Política de Privacidade' }).waitFor();
  await page.keyboard.press('Escape');
  await waitHidden(page, '#legal-dialog');
  await page.getByRole('link', { name: 'Termos de uso' }).click();
  await page.getByRole('dialog', { name: 'Termos de Uso' }).waitFor();
  await page.getByRole('button', { name: 'Fechar informação legal' }).click();
  console.log('Pedido desktop: seleção, edição, modalidade, observações, cópia real, sessão, remoção e vazio OK.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await axe(page, 'desktop');
  await sampleContrast(page);
  await desktop.context.close();

  const mobile = await init(390, 844, { reducedMotion: 'reduce', isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const m = mobile.page;
  await m.goto(origin);
  for (const selector of ['#nav-toggle', '.bag-trigger', '#menu-tabs button', '#cat-pizzas .item-add']) {
    const box = await m.locator(selector).first().boundingBox();
    assert(box && box.width >= 44 && box.height >= 44, `alvo de toque < 44 px: ${selector}`);
  }
  assert.equal(await m.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
  await m.getByRole('button', { name: 'Abrir menu de navegação' }).tap();
  assert.equal(await m.getByRole('button', { name: 'Fechar menu de navegação' }).getAttribute('aria-expanded'), 'true');
  await m.locator('#site-nav').getByRole('link', { name: 'Ementa' }).tap();
  assert.equal(await m.getByRole('button', { name: 'Abrir menu de navegação' }).getAttribute('aria-expanded'), 'false');
  await m.locator('#cat-pizzas [data-add="margherita"]').tap();
  await m.locator('.floating-cart').tap();
  const dlg = m.getByRole('dialog', { name: 'O meu pedido' });
  assert.equal(await dlg.getByText('Pizza Margherita', { exact: true }).isVisible(), true);
  // Clipboard denial path: visitors can always reach a manually selectable summary.
  await m.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('unavailable'); } } }));
  await dlg.getByRole('button', { name: 'Copiar resumo' }).tap();
  await dlg.getByText('Selecione e copie o resumo apresentado. Nada foi enviado.').waitFor();
  assert.equal(await m.locator('#summary-details').evaluate(el => el.open), true);
  assert.match(await summary(m), /1 × Pizza Margherita/);
  for (const selector of ['#order-dialog .drawer-head button', '#order-dialog .quantity button', '#copy-order']) {
    const box = await m.locator(selector).first().boundingBox();
    assert(box && box.width >= 44 && box.height >= 44, `alvo de toque < 44 px: ${selector}`);
  }
  await axe(m, 'pedido mobile');
  for (const width of [320, 360, 390, 487, 620, 621, 711, 768, 820, 821, 1024, 1280, 1440, 1920]) {
    await m.setViewportSize({ width, height: 840 });
    await m.goto(origin);
    await m.evaluate(() => document.fonts.ready);
    const [doc, viewport, h1, h1Width] = await m.evaluate(() => {
      const el = document.querySelector('h1');
      return [document.documentElement.scrollWidth, document.documentElement.clientWidth, el.scrollWidth, el.clientWidth];
    });
    assert.equal(doc, viewport, `scroll horizontal: ${width}px`);
    assert(h1 <= h1Width + 1, `título cortado em ${width}px (${h1} > ${h1Width})`);
  }
  console.log('Mobile: navegação, botão persistente, alternativa sem área de transferência e 14 larguras entre 320 e 1920 px.');
  await mobile.context.close();

  const future = await init(390, 844, { reducedMotion: 'reduce' });
  let destination = null;
  await future.context.route('https://wa.me/**', route => { destination = new URL(route.request().url()); return route.fulfill({ status: 200, body: 'Interceptado pelo teste local.' }); });
  const f = future.page;
  await f.goto(origin + fixturePath);
  await add(f, 'malagueta');
  await add(f, 'malagueta');
  await openCart(f);
  const form = f.getByRole('dialog', { name: 'O meu pedido' });
  await form.getByLabel('Entrega', { exact: true }).check();
  const submit = form.getByRole('button', { name: 'Finalizar pedido pelo WhatsApp' });
  const check = form.getByRole('checkbox');
  assert.equal(await check.isChecked(), false);
  await submit.click();
  assert.equal(destination, null);
  await form.getByLabel('Morada de entrega').fill('Rua do teste, sem envio real');
  await submit.click();
  assert.equal(destination, null);
  assert.equal(await check.evaluate(el => el.validity.valueMissing), true);
  await check.check();
  const popup = f.waitForEvent('popup');
  await submit.click();
  await (await popup).waitForLoadState();
  assert.equal(destination.pathname, '/12025550100');
  assert.equal(destination.searchParams.get('text'), await summary(f));
  assert.match(destination.searchParams.get('text'), /2 × Pizza Malagueta — 24,10\s?€/);
  assert.match(destination.searchParams.get('text'), /Morada de entrega: Rua do teste, sem envio real/);
  await form.getByText(/pedido ainda não foi confirmado/).waitFor();
  console.log('WhatsApp em fixture isolado: total, validação de morada, consentimento e mensagem exata OK; sem envio real.');
  await future.context.close();

  const file = await init(390, 844, { offline: true, reducedMotion: 'reduce' });
  await file.page.goto(new URL('../public/index.html', import.meta.url).href);
  await add(file.page, 'margherita');
  await openCart(file.page);
  assert.match(await summary(file.page), /1 × Pizza Margherita/);
  await file.context.close();
  console.log('Abrir o HTML sem rede: ementa e resumo funcionais.');

  assert.deepEqual(faults, []);
  assert(seenNetwork.every(url => url.startsWith(origin) || url.startsWith('data:') || url.startsWith('file:')), 'a página não consulta servidores externos por conta própria');
  assert(!html.includes('12025550100'), 'número de teste fora do ficheiro de publicação');
  console.log('PASS: fluxos no Chromium, 0 erros JS e 0 pedidos de rede externos antes de interação.');
} finally {
  await browser.close();
  server.close();
}
