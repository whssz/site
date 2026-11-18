import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { launchBrowser } from './browser.mjs';

const input = process.argv[2] || 'public/index.html';
const url = /^https?:\/\//.test(input) ? input : pathToFileURL(resolve(input)).href;
const browser = await launchBrowser();
const checks = [];
const done = (name) => { checks.push(name); console.log('✓ ' + name); };

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [];
  const destinations = [];
  const requested = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requested.push(request.url()));
  await context.route('https://wa.me/**', route => {
    destinations.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'text/plain', body: 'Destino interceptado no teste; nenhuma mensagem foi enviada.' });
  });
  assert.equal((await page.goto(url))?.status(), 200);
  assert.equal(await page.locator('main > section').count(), 6);
  assert.equal(await page.locator('[data-product]').count(), 9);
  const origin = new URL(url).origin;
  assert.equal(requested.some(request => /^https?:/.test(request) && new URL(request).origin !== origin), false);
  done('6 seções, 9 produtos, sem carregamentos de terceiros');

  const card = (id) => page.locator(`[data-product="${id}"]`);
  const add = (id) => card(id).locator('[data-add]').click();
  const filter = (id) => page.locator(`[data-filter="${id}"]`).click();
  const open = () => page.locator('[data-cart-open]').click();
  const drawer = page.getByRole('dialog', { name: 'Meu pedido' });
  const count = async (n) => assert.equal(await page.locator('[data-cart-count]').textContent(), String(n));
  await open();
  assert.equal(await drawer.isVisible(), true);
  assert.equal(await drawer.getByText('Sua sacola está vazia.').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await drawer.isVisible(), false);
  assert.equal(await page.locator('[data-cart-open]').evaluate(el => document.activeElement === el), true);
  done('Sacola vazia, Escape e retorno de foco');

  await filter('paletas');
  assert.equal(await page.locator('[data-product]:visible').count(), 3);
  assert.equal(await page.locator('[data-filter="paletas"]').getAttribute('aria-pressed'), 'true');
  await add('paleta-banana');
  await filter('picoles');
  assert.equal(await page.locator('[data-product]:visible').count(), 2);
  await add('picole-chocolate');
  assert.equal(await card('picole-chocolate').getByRole('alert').isVisible(), true);
  await count(1);
  const select = card('picole-chocolate').getByRole('combobox', { name: 'Sabor da massa' });
  assert.deepEqual(await select.locator('option').allTextContents(), ['Selecione um sabor', 'Chocolate', 'Banana', 'Coco', 'Morango', 'Amendoim']);
  await select.selectOption('Morango');
  await add('picole-chocolate');
  await add('picole-chocolate');
  await select.selectOption('Chocolate');
  await add('picole-chocolate');
  await filter('sorvetes');
  await add('doce-de-leite');
  await count(5);
  done('Filtros, adição, escolha obrigatória de sabor e linhas separadas por variante');

  await open();
  const morango = drawer.getByLabel('Quantidade: Picolé com cobertura de chocolate, sabor Morango', { exact: true });
  assert.equal(await morango.inputValue(), '2');
  await drawer.getByRole('button', { name: 'Aumentar quantidade: Picolé com cobertura de chocolate, sabor Morango', exact: true }).click();
  await count(6);
  await drawer.getByRole('button', { name: 'Diminuir quantidade: Picolé com cobertura de chocolate, sabor Morango', exact: true }).click();
  await count(5);
  await morango.fill('12');
  await morango.press('Tab');
  await count(15);
  await morango.fill('0');
  await morango.press('Tab');
  assert.equal(await morango.inputValue(), '12');
  assert.equal(await drawer.getByText('Digite uma quantidade inteira de 1 a 9999.').isVisible(), true);
  await drawer.getByRole('button', { name: 'Remover Paleta de banana com Nutella', exact: true }).click();
  await count(14);
  assert.equal(await drawer.locator('.order-line').count(), 3);
  await drawer.getByRole('button', { name: 'Continuar escolhendo' }).click();
  assert.equal(await drawer.isVisible(), false);
  await open();
  await count(14);
  done('Aumentar, diminuir, editar, validar, remover e continuar escolhendo');

  assert.equal(await drawer.getByRole('radio', { name: 'A combinar' }).isChecked(), true);
  await drawer.getByRole('radio', { name: 'Retirada na loja' }).check();
  await drawer.getByLabel('Observações (opcional)').fill('Retiro à tarde; dúvida sobre chocolate & morango?');
  await drawer.locator('summary', { hasText: 'Revisar mensagem' }).click();
  const text = [
    'Olá, Sorvete Supremo! Gostaria de consultar este pedido:', '',
    '• 12 × Picolé com cobertura de chocolate — sabor: Morango',
    '• 1 × Picolé com cobertura de chocolate — sabor: Chocolate',
    '• 1 × Sorvete de doce de leite com canela', '',
    'Atendimento: Retirada na loja', 'Observações: Retiro à tarde; dúvida sobre chocolate & morango?', '',
    'Podem confirmar os valores e a disponibilidade?',
  ].join('\n');
  assert.equal(await drawer.getByLabel('Mensagem do pedido').inputValue(), text);
  await drawer.getByRole('button', { name: 'Copiar resumo' }).click();
  await page.waitForFunction(() => document.querySelector('#copy-status').textContent.length > 0);
  assert.equal(await drawer.locator('#copy-status').textContent(), 'Resumo copiado.');
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), text);
  done('Resumo exato, modalidade confirmada, observação e cópia para a área de transferência');

  const consent = drawer.getByRole('checkbox', { name: 'Autorizo abrir este resumo no WhatsApp.' });
  const send = drawer.getByRole('button', { name: 'Finalizar pelo WhatsApp' });
  assert.equal(await consent.isChecked(), false);
  await send.click();
  assert.equal(await drawer.locator('#order-error').isVisible(), true);
  assert.equal(destinations.length, 0);
  await drawer.getByRole('link', { name: 'Política de privacidade' }).click();
  const privacy = page.getByRole('dialog', { name: 'Política de Privacidade' });
  assert.equal(await privacy.isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await privacy.isVisible(), false);
  assert.equal(await drawer.isVisible(), true);
  await consent.check();
  const request = context.waitForEvent('request', { predicate: candidate => candidate.url().startsWith('https://wa.me/') });
  await send.click();
  const sent = new URL((await request).url());
  assert.equal(sent.pathname, '/552131574883');
  assert.equal(sent.searchParams.get('text'), text);
  assert.equal(await drawer.getByText(/pedido confirmado/i).count(), 0);
  for (const popup of context.pages().filter(p => p !== page)) await popup.close();
  done('Consentimento exigido, WhatsApp oficial e mensagem preenchida (sem enviar pedido real)');

  await page.reload();
  await count(14);
  await open();
  assert.equal(await drawer.getByRole('radio', { name: 'Retirada na loja' }).isChecked(), true);
  assert.equal(await drawer.getByLabel('Observações (opcional)').inputValue(), '');
  assert.equal(await consent.isChecked(), false);
  assert.equal(await drawer.locator('.order-line').count(), 3);
  const ax = () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const review = (violations) => violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`).join('\n');
  const cartAudit = await ax();
  assert.equal(cartAudit.violations.length, 0, review(cartAudit.violations));
  while (await drawer.locator('[data-qty-role="remove"]').count()) await drawer.locator('[data-qty-role="remove"]').first().click();
  await count(0);
  assert.equal(await drawer.getByText('Sua sacola está vazia.').isVisible(), true);
  await drawer.getByRole('link', { name: 'Ver cardápio' }).click();
  await page.waitForFunction(() => document.activeElement?.id === 'catalog-title');
  const pageAudit = await ax();
  assert.equal(pageAudit.violations.length, 0, review(pageAudit.violations));
  assert.deepEqual(errors, []);
  done('Persistência do rascunho sem dados pessoais; axe sem violações no site e no pedido');
  await context.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobile.goto(url);
  const menu = mobile.getByRole('button', { name: 'Abrir menu' });
  await menu.tap();
  const mobileNav = mobile.getByRole('navigation', { name: 'Navegação principal' });
  assert.equal(await mobileNav.isVisible(), true);
  await mobileNav.getByRole('link', { name: 'Como chegar' }).tap();
  assert.equal(await mobileNav.isVisible(), false);
  assert.equal(new URL(mobile.url()).hash, '#visite');
  const motion = mobile.locator('#motion-toggle');
  await motion.tap();
  assert.equal(await mobile.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
  await motion.tap();
  assert.equal(await mobile.evaluate(() => document.getAnimations().filter(a => a.effect?.getTiming().iterations === Infinity && a.playState === 'running').length >= 2), true);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth === innerWidth), true);
  assert.equal(await mobile.evaluate(() => Array.from(document.images).every(img => img.complete && img.naturalWidth > 0)), true);
  done('Menu e navegação no celular, pausa manual, imagens locais carregadas, sem rolagem lateral');
  await mobile.close();

  const offline = await browser.newPage({ javaScriptEnabled: false });
  await offline.goto(url);
  assert.equal(await offline.getByRole('link', { name: 'fale com a Sorvete Supremo no WhatsApp' }).getAttribute('href'), 'https://wa.me/552131574883');
  done('Conteúdo acessível sem JavaScript, com alternativa pelo canal oficial');
  console.log(`\nQA PEDIDO: PASS (${checks.length} grupos de verificações)`);
} finally {
  await browser.close();
}
