import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import axe from 'axe-core';
import { launchBrowser } from './browser.mjs';

const file = new URL('../public/index.html', import.meta.url);
const html = await readFile(file);
const business = JSON.parse(await readFile(new URL('../src/business.json', import.meta.url), 'utf8'));
const catalog = JSON.parse(await readFile(new URL('../src/menu.json', import.meta.url), 'utf8'));
const title = 'Brutta — Pizzeria Napoletana em Paço de Arcos';
const desktop = { width: 1440, height: 900 };
const phone = { width: 390, height: 844 };
const plain = value => value.replaceAll('\u00a0', ' ').trim();
const report = message => console.log(`  ✓ ${message}`);

// A local, short-lived fixture serves the actual Vercel build with no dependencies or external requests.
const server = createServer((req, res) => {
  if (req.url.split('?')[0] !== '/') { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': html.byteLength, 'Cache-Control': 'no-store' });
  res.end(html);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
let browser;
const errors = [];
const external = [];

async function createPage(options = {}) {
  const context = await browser.newContext({ viewport: desktop, reducedMotion: 'reduce', ...options });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('request', request => {
    const url = request.url();
    if (/^https?:/.test(url) && !url.startsWith(base)) external.push(url);
  });
  return { page, context };
}

const open = (page, count) => page.getByRole('button', { name: `O meu pedido ${count} ${count === 1 ? 'artigo' : 'artigos'}`, exact: true }).click();
const add = (page, name) => page.getByRole('button', { name: `Adicionar ${name} ao pedido`, exact: true }).click();
const tick = (page, selector) => page.waitForFunction(selector => document.activeElement.matches(selector), selector);
const total = async (page, expected) => assert.equal(plain(await page.locator('#order-total').textContent()), `${expected},00 €`);
const activeAnimations = page => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect.getTiming().iterations === Infinity).length);
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
async function accessibility(page, state) {
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(tags => window.axe.run({ runOnly: { type: 'tag', values: tags } }), tags);
  assert.deepEqual(results.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], `axe ${state}`);
  report(`axe ${state}: 0 violações automáticas · ${results.incomplete.length} regra(s) para revisão manual`);
}

try {
  browser = await launchBrowser(chromium);
  console.log(`\n  QA FUNCIONAL · Chromium ${browser.version()}`);
  const { page, context } = await createPage();
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const response = await page.goto(base);
  assert.equal(response.status(), 200);
  assert.equal(await page.title(), title);
  assert.equal(await page.locator('html').getAttribute('lang'), 'pt-PT');
  assert.equal(await page.locator('main > section').count(), 5);
  assert.equal(await page.locator('[data-add]').count(), catalog.items.length);
  assert.equal(await page.locator('.menu-reference time').getAttribute('datetime'), catalog.checkedOn);
  if (!business.whatsapp) assert.equal(await page.locator('a[href^="https://wa.me/"]').count(), 0);
  await page.evaluate(() => document.fonts.ready);
  assert(await page.evaluate(() => document.fonts.check('20px Fraunces') && document.fonts.check('20px Manrope')));
  report('HTML servível, fontes locais e 24 artigos da recolha com origem e data');

  await page.keyboard.press('Tab');
  await tick(page, '.skip-link');
  assert(await page.locator('.skip-link').evaluate(el => parseFloat(getComputedStyle(el).outlineWidth) > 0));
  await page.keyboard.press('Enter');
  await tick(page, 'main');
  await accessibility(page, 'página desktop');

  await open(page, 0);
  assert(await page.locator('#order-dialog').evaluate(el => el.matches(':modal')));
  assert(await page.getByText('O seu pedido está vazio.').isVisible());
  assert(!(await page.locator('#order-copy').isVisible()));
  await tick(page, '#cart-close');
  await page.getByRole('dialog').getByRole('link', { name: 'Explorar a carta' }).click();
  await page.waitForFunction(() => location.hash === '#carta');
  assert(!(await page.getByRole('dialog').isVisible()));

  const pizzas = page.getByRole('tab', { name: 'Pizzas', exact: true });
  await pizzas.focus();
  await page.keyboard.press('ArrowRight');
  await tick(page, '#tab-calzones');
  assert.equal(await page.getByRole('tabpanel').getByRole('button').count(), 1);
  await page.keyboard.press('End');
  await tick(page, '#tab-sobremesas');
  assert.equal(await page.getByRole('tabpanel').getByRole('button').count(), 2);
  await page.keyboard.press('Home');
  await tick(page, '#tab-pizzas');
  assert.equal(await page.getByRole('tabpanel').getByRole('button').count(), 14);
  await add(page, 'Pizza Margherita');
  assert.match(await page.locator('#toast').innerText(), /Margherita.*adicionado/);
  await add(page, 'Pizza Margherita');
  await page.getByRole('tab', { name: 'Brutta Burger', exact: true }).click();
  await add(page, 'Brutta Roquefort');
  await page.getByRole('tab', { name: 'Sobremesas', exact: true }).click();
  await add(page, 'Tiramisú Tradicional');
  await open(page, 4);
  await total(page, 46);
  await page.getByRole('button', { name: 'Aumentar quantidade de Pizza Margherita', exact: true }).click();
  await total(page, 58);
  await tick(page, '[data-item="margherita"] [data-edit="plus"]');
  await page.getByRole('button', { name: 'Diminuir quantidade de Pizza Margherita', exact: true }).click();
  await total(page, 46);
  await page.getByRole('button', { name: 'Remover Brutta Roquefort', exact: true }).click();
  await total(page, 31);
  await tick(page, '[data-item="tiramisu"] [data-edit="remove"]');
  assert.equal(await page.locator('#order-lines li').count(), 2);
  assert((await page.getByRole('radio', { name: /Recolha/ }).isChecked()));
  if (!business.whatsapp) assert.equal(await page.getByRole('link', { name: 'Ligar para encomendar' }).getAttribute('href'), `tel:${business.phone}`);

  const observation = 'Recolha às 19h30, se possível <sem enviar pela página>.';
  await page.getByLabel(/Observações/).fill(observation);
  await page.getByText('Ver resumo do pedido', { exact: true }).click();
  const expected = [
    'Resumo de encomenda | Brutta Pizzeria Napoletana', 'Modalidade: recolha na Brutta', '',
    '• 2 × Pizza Margherita — 24,00 €', '• 1 × Tiramisú Tradicional — 7,00 €', '',
    'Subtotal de referência: 31,00 €', 'Referência: preços de recolha na Uber Eats, sem taxas de entrega.',
    'Valor final e disponibilidade a confirmar.', '', `Observações: ${observation}`
  ].join('\n');
  assert.equal(plain(await page.locator('#order-summary').innerText()), expected);
  await page.getByRole('button', { name: 'Copiar resumo', exact: true }).click();
  await page.getByText('Resumo copiado. Ainda não foi enviado.', { exact: true }).waitFor();
  assert.equal(plain(await page.evaluate(() => navigator.clipboard.readText())), expected);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('brutta-order-v1'))), [['margherita', 2], ['tiramisu', 1]]);
  await accessibility(page, 'carrinho preenchido');
  const focusTarget = await page.evaluate(() => document.activeElement.id);
  assert.equal(focusTarget, 'order-copy');
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    assert(await page.evaluate(() => document.activeElement === document.body || document.activeElement.closest('dialog[open]')));
  }
  report('Desktop: categorias por teclado · 4 → 5 → 4 → 3 artigos · 46 → 58 → 46 → 31 € · resumo igual à área de transferência');

  await page.getByRole('radio', { name: /Entrega/ }).check();
  await total(page, 31);
  assert.equal(plain(await page.locator('#order-summary').textContent()), expected.replace('recolha na Brutta', 'entrega pela Uber Eats'));
  assert.match(await page.locator('#order-channel-note').innerText(), /não transita/);
  const delivery = page.getByRole('link', { name: 'Abrir na Uber Eats', exact: true });
  assert.equal(await delivery.getAttribute('href'), business.delivery);
  assert.equal(await delivery.getAttribute('target'), '_blank');
  await context.route(business.delivery, route => route.fulfill({ status: 200, body: 'Destino externo intercetado pelo teste.' }));
  const [popup] = await Promise.all([page.waitForEvent('popup'), delivery.click()]);
  await popup.waitForLoadState();
  assert.equal(popup.url(), business.delivery);
  await popup.close();
  await page.keyboard.press('Escape');
  await tick(page, '#cart-toggle');
  await page.reload();
  await open(page, 3);
  await total(page, 31);
  assert.equal(await page.getByLabel(/Observações/).inputValue(), '');
  await page.getByRole('button', { name: 'Limpar pedido', exact: true }).click();
  assert(await page.getByText('O seu pedido está vazio.').isVisible());
  assert.equal(await page.evaluate(() => localStorage.getItem('brutta-order-v1')), null);
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Privacidade', exact: true }).click();
  assert(await page.locator('#privacidade').evaluate(el => el.open));
  await tick(page, '#privacidade summary');
  await page.getByRole('link', { name: 'Termos', exact: true }).click();
  assert(await page.locator('#termos').evaluate(el => el.open));
  await context.close();
  report('Destino oficial de entrega aberto no browser (intercetado) · Esc e foco · persistência do carrinho sem nota · limpeza · legais');

  const mobile = await createPage({ viewport: phone, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await mobile.context.addInitScript(() => {
    // Reproduce a browser that rejects clipboard permissions and has no legacy copy support.
    Object.defineProperty(navigator, 'clipboard', { get: () => undefined });
    document.execCommand = () => false;
  });
  const mp = mobile.page;
  await mp.goto(base);
  await mp.getByRole('button', { name: 'Abrir navegação' }).tap();
  assert.equal(await mp.getByRole('button', { name: 'Fechar navegação' }).getAttribute('aria-expanded'), 'true');
  await mp.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'A Carta' }).tap();
  await mp.waitForFunction(() => location.hash === '#carta');
  assert.equal(await mp.getByRole('button', { name: 'Abrir navegação' }).getAttribute('aria-expanded'), 'false');
  await mp.getByRole('tab', { name: 'Calzones' }).tap();
  await mp.getByRole('button', { name: 'Adicionar Calzone Napoletano ao pedido' }).tap();
  await mp.getByRole('button', { name: 'O meu pedido 1 artigo' }).tap();
  await total(mp, 16);
  await mp.getByRole('button', { name: 'Copiar resumo' }).tap();
  assert(await mp.getByText('O resumo está selecionado. Pode copiá-lo manualmente.').isVisible());
  assert.match(await mp.evaluate(() => getSelection().toString()), /1 × Calzone Napoletano/);
  await accessibility(mp, 'carrinho mobile');
  await mp.setViewportSize({ width: 320, height: 568 });
  const geometry = await mp.evaluate(() => {
    const dialog = document.querySelector('dialog');
    const scroller = document.querySelector('.order-scroll');
    const buttons = [...dialog.querySelectorAll('button:not(:disabled),#order-channel')].filter(el => el.getClientRects().length);
    return {
      pageOverflow: document.documentElement.scrollWidth - innerWidth,
      orderOverflow: Math.max(dialog.scrollWidth - dialog.clientWidth, scroller.scrollWidth - scroller.clientWidth),
      undersized: buttons.filter(el => { const r = el.getBoundingClientRect(); return r.height < 44 || r.width < 44; }).map(el => el.id || el.textContent.trim()),
      closeInside: document.getElementById('cart-close').getBoundingClientRect().right <= innerWidth
    };
  });
  assert.deepEqual(geometry, { pageOverflow: 0, orderOverflow: 0, undersized: [], closeInside: true });
  await mp.getByRole('button', { name: 'Remover Calzone Napoletano' }).tap();
  assert(await mp.getByText('O seu pedido está vazio.').isVisible());
  await mobile.context.close();
  report('Mobile 390/320px: toque, navegação, remoção, alvos do carrinho ≥44px, 0px de overflow e cópia manual quando a área de transferência é bloqueada');

  const motion = await createPage({ reducedMotion: 'no-preference' });
  await motion.page.goto(base);
  for (const id of ['inicio', 'casa', 'carta', 'galeria', 'visitar']) {
    await motion.page.evaluate(id => document.getElementById(id).scrollIntoView({ behavior: 'instant' }), id);
    assert(await activeAnimations(motion.page) >= 2);
  }
  await motion.page.getByRole('button', { name: 'Pausar animações' }).click();
  assert.equal(await activeAnimations(motion.page), 0);
  await motion.page.reload();
  assert.equal(await activeAnimations(motion.page), 0);
  await motion.page.getByRole('button', { name: 'Retomar animações' }).click();
  await motion.page.waitForFunction(() => document.getAnimations().some(a => a.effect.getTiming().iterations === Infinity));
  await motion.page.emulateMedia({ reducedMotion: 'reduce' });
  await motion.page.waitForFunction(() => !document.getAnimations().some(a => a.playState === 'running'));
  await motion.context.close();
  report('Movimento: loops nas cinco secções, pausa persistente, retoma e preferência do sistema em tempo real');

  const offline = await createPage({ offline: true });
  await offline.page.goto(file.href);
  await add(offline.page, 'Pizza Diavola');
  await open(offline.page, 1);
  await total(offline.page, 14);
  await offline.context.close();
  const noJS = await createPage({ javaScriptEnabled: false });
  await noJS.page.goto(base);
  for (const name of ['Brutta Frango', 'Calzone Napoletano', 'Panna Cotta']) {
    assert(await noJS.page.getByRole('heading', { name }).isVisible());
  }
  assert(!(await noJS.page.locator('#cart-toggle').isVisible()));
  await noJS.context.close();
  report('HTML único abre offline com seleção e subtotal; carta completa continua legível sem JavaScript');

  assert.deepEqual(external, [], 'Nenhum pedido a terceiros antes de abertura por iniciativa do visitante');
  assert.deepEqual(errors, [], 'Erros JavaScript ou de consola');
  console.log('\n  ✓ PASS · fluxo, acessibilidade, privacidade e ficheiro único\n');
} finally {
  await browser?.close();
  server.close();
}
