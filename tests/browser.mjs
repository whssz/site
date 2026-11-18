import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { chromium } from 'playwright';
import axe from 'axe-core';
import { browserOptions } from '../tools/browser-options.mjs';
import { money } from '../src/order.mjs';

const html = await readFile(new URL('../public/index.html', import.meta.url));
const { business } = JSON.parse(await readFile(new URL('../src/menu.json', import.meta.url), 'utf8'));
const server = createServer((request, response) => {
  if (request.url !== '/') return response.writeHead(404).end();
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': html.length }).end(html);
});
const browser = await chromium.launch(await browserOptions());
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const normalize = value => value.replaceAll(/\s+/g, ' ').trim();
const errors = [];

async function runAxe(page, area) {
  if (!await page.evaluate(() => Boolean(window.axe))) await page.addScriptTag({ content: axe.source });
  const failures = await page.evaluate(async (selector) => {
    const result = await window.axe.run(selector ?? document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return result.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(',')).join('; ')}`);
  }, area);
  assert.deepEqual(failures, [], `WCAG A/AA: ${area ?? 'site'}`);
}

async function checkTapTargets(page, root = 'body') {
  const small = await page.locator(root).evaluate(scope => [...scope.querySelectorAll('button:not(:disabled), a[href], .mode-options label')]
    .filter(el => el.getClientRects().length && !el.closest('.legal-scroll, .callout-note'))
    .flatMap(el => el.offsetWidth < 44 || el.offsetHeight < 44
      ? [`${el.getAttribute('aria-label') ?? el.textContent.trim()}: ${el.offsetWidth}×${el.offsetHeight}`] : []));
  assert.deepEqual(small, [], 'Tap targets measure at least 44 × 44 CSS pixels, excluding links inline in prose');
}

async function openAtSize(width, height, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  assert.equal((await page.goto(origin)).status(), 200);
  await page.evaluate(() => document.fonts.ready);
  return { page, context };
}

try {
  for (const [width, height] of [[320, 665], [390, 844], [768, 1024], [1440, 900]]) {
    const { page, context } = await openAtSize(width, height);
    const layout = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      sections: document.querySelectorAll('main section').length,
      overlaps: document.querySelector('#hero-title').getBoundingClientRect().right > document.documentElement.clientWidth,
      brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(link => !document.getElementById(link.hash.slice(1))).length,
    }));
    assert.equal(layout.scroll, 0, `${width}px page overflow`);
    assert.ok(layout.sections >= 4, 'At least four editorial sections');
    assert.equal(layout.overlaps, false);
    assert.equal(layout.brokenAnchors, 0);
    const sample = await page.evaluate(async () => {
      const element = document.querySelector('.bg-aurora');
      const initial = getComputedStyle(element).transform;
      document.getElementById('visitar').scrollIntoView({ behavior: 'instant' });
      await new Promise(resolve => setTimeout(resolve, 360));
      return {
        moving: initial !== getComputedStyle(element).transform,
        pinned: getComputedStyle(document.querySelector('.bg')).position === 'fixed',
        backgroundLoops: document.getAnimations().filter(a => a.effect?.target?.closest?.('.bg') && a.effect.getTiming().iterations === Infinity && a.playState === 'running').length,
      };
    });
    assert.equal(sample.moving, true, 'Contextual background must visibly change after scrolling');
    assert.equal(sample.pinned, true);
    assert.ok(sample.backgroundLoops >= 2);
    console.log(`✓ ${width}px: sem rolagem horizontal; ${layout.sections} secções; ${sample.backgroundLoops} loops no fundo fixo`);
    await context.close();
  }

  const { page, context } = await openAtSize(390, 844, 'reduce');
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
  await checkTapTargets(page);
  await runAxe(page);
  const navToggle = page.getByRole('button', { name: 'Abrir menu de navegação' });
  await navToggle.click();
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'), 'false');
  await navToggle.click();
  await page.locator('#site-nav').getByRole('link', { name: 'A carta' }).click();
  assert.equal(new URL(page.url()).hash, '#carta');
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'), 'false');
  const bagButton = page.locator('#hdr [data-open-order]');
  await bagButton.click();
  assert.equal(await page.getByText('A tua seleção está vazia.').isVisible(), true);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('order-dialog').open);
  assert.equal(await bagButton.evaluate(el => el === document.activeElement), true);

  await page.locator('.favorites').getByRole('button', { name: 'Adicionar Pepperoni ao pedido' }).click();
  await page.locator('#menu-list').getByRole('button', { name: 'Adicionar Margherita ao pedido' }).click();
  await page.getByRole('button', { name: /Ver mais pizzas/ }).click();
  assert.equal(await page.locator('#menu-list .menu-item').count(), 16);
  await page.getByRole('button', { name: 'Mostrar menos' }).click();
  assert.equal(await page.locator('#menu-list .menu-item').count(), 6);
  await page.locator('#category-controls').getByRole('button', { name: 'Sobremesas' }).click();
  await page.getByRole('button', { name: 'Adicionar Tiramisusi ao pedido' }).click();
  assert.equal(await page.locator('[data-count]').textContent(), '3');
  await page.reload();
  assert.equal(await page.locator('[data-count]').textContent(), '3', 'Basket restored after navigation');
  await bagButton.click();
  await page.getByRole('button', { name: 'Aumentar quantidade de Margherita' }).click();
  await page.getByRole('button', { name: 'Diminuir quantidade de Pepperoni' }).click();
  await page.getByRole('button', { name: 'Remover Tiramisusi' }).click();
  assert.equal(await page.locator('#order-items li').count(), 1);
  assert.equal(normalize(await page.locator('#order-total').textContent()), normalize(money(2500)));
  await checkTapTargets(page, '#order-dialog');
  await runAxe(page, '#order-dialog');
  await page.getByRole('button', { name: 'Rever pedido' }).click();
  assert.equal(await page.locator('#mode-error').isVisible(), true);
  assert.equal(await page.locator('#order-review').isVisible(), false);
  await page.getByRole('radio', { name: 'Recolha na pizzaria' }).check();
  await page.getByLabel(/Observações/).fill('Nota local para o pedido.');
  await page.getByRole('button', { name: 'Rever pedido' }).click();
  const summary = await page.getByLabel('Resumo do pedido').inputValue();
  assert.match(summary, /2 × Margherita/);
  assert.match(summary, /Recolha na pizzaria/);
  assert.match(summary, /Observações: Nota local para o pedido\./);
  assert.ok(normalize(summary).includes(`Subtotal indicativo: ${normalize(money(2500))}`));
  assert.doesNotMatch(summary, /Pepperoni|Tiramisusi/);
  assert.equal(await page.getByRole('link', { name: 'Ligar para a pizzaria' }).getAttribute('href'), `tel:${business.phone}`);
  await page.getByRole('button', { name: 'Copiar resumo' }).click();
  await page.getByText('Resumo copiado.', { exact: false }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), summary);
  assert.match(await page.locator('#copy-feedback').textContent(), /ainda não foi enviado/);
  await page.getByRole('button', { name: 'Editar pedido' }).click();
  await page.getByRole('radio', { name: 'Entrega' }).check();
  assert.equal(await page.getByLabel(/Observações/).inputValue(), 'Nota local para o pedido.');
  await page.getByRole('button', { name: 'Rever pedido' }).click();
  assert.match(await page.getByLabel('Resumo do pedido').inputValue(), /Modalidade: Entrega/);
  assert.equal(await page.getByRole('link', { name: 'Abrir Uber Eats' }).getAttribute('href'), business.store);
  assert.match(await page.locator('#channel-note').textContent(), /não importa o carrinho/);
  await page.getByRole('button', { name: 'Editar pedido' }).click();
  await page.getByRole('button', { name: 'Remover Margherita' }).click();
  assert.equal(await page.locator('[data-count]').textContent(), '0');
  await page.getByRole('button', { name: 'Explorar a carta' }).click();
  assert.equal(await page.locator('#order-dialog').evaluate(el => el.open), false);
  assert.equal(await page.locator('#menu-title').evaluate(el => el === document.activeElement), true);
  assert.equal(await page.evaluate(() => localStorage.getItem('avomaria:pizza-selection:v1')), null);
  console.log('✓ Navegador: seleção, categorias, persistência, edição, remoção, validação, subtotal, resumo, área de transferência e canais verificados');

  const firstPhoto = page.getByRole('button', { name: 'Ampliar a fotografia À mesa' });
  await firstPhoto.click();
  assert.match(await page.locator('#photo-count').textContent(), /^1 \/ 2/);
  await page.keyboard.press('ArrowRight');
  assert.match(await page.locator('#photo-count').textContent(), /^2 \/ 2/);
  assert.match(await page.locator('#photo-large').getAttribute('alt'), /Duas pizzas/);
  await page.keyboard.press('Escape');
  assert.equal(await firstPhoto.evaluate(el => el === document.activeElement), true);
  await page.getByRole('button', { name: 'Privacidade', exact: true }).click();
  await page.getByRole('heading', { name: 'Os teus direitos' }).waitFor();
  await page.getByRole('button', { name: 'Fechar informação legal' }).click();
  await page.getByRole('button', { name: 'Termos de utilização' }).click();
  await page.getByRole('heading', { name: 'Valores e disponibilidade' }).waitFor();
  await page.keyboard.press('Escape');
  const media = await page.evaluate(async () => Promise.all([...document.images].map(async img => {
    if (img.loading === 'lazy') img.loading = 'eager';
    try { await img.decode(); } catch { return false; }
    return img.naturalWidth > 0 && img.hasAttribute('alt') && img.src.startsWith('data:');
  })));
  assert.ok(media.every(Boolean));
  await context.close();

  const off = await openAtSize(1440, 900);
  await off.page.getByRole('button', { name: 'Pausar movimento' }).click();
  assert.equal(await off.page.getByRole('button', { name: 'Pausar movimento' }).getAttribute('aria-pressed'), 'true');
  assert.equal(await off.page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
  await off.page.getByRole('button', { name: 'Pausar movimento' }).click();
  assert.ok(await off.page.evaluate(() => document.getAnimations().filter(a => a.effect.getTiming().iterations === Infinity).length >= 2));
  await off.context.close();
  assert.deepEqual(errors, []);
  console.log('✓ Galeria, teclado, termos, privacidade, mídia local, WCAG A/AA e pausa de movimento — sem erros');
} finally {
  await browser.close();
  server.close();
}
