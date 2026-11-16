// Browser-level checks for the client-side order flow.
// Serve index.html on port 3000 (or set BASE_URL), then run: node tests/flow.cjs
// WhatsApp navigation is fulfilled locally; no message or personal data is sent.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000/';
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

async function runViewport(browser, viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // Exercise the real window.open call but stop all network traffic to WhatsApp.
  await context.route('https://wa.me/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Teste local — nenhuma mensagem enviada</title>' }));
  await page.addInitScript(() => {
    const open = window.open;
    window.open = function (url, target, features) {
      window.__opened = { url, target, features };
      return open.call(window, url, target, features);
    };
  });
  await page.goto(baseURL, { waitUntil: 'load' });

  if (viewport.width <= 760) {
    const mobileMenu = page.locator('.mobile-toggle');
    await mobileMenu.click();
    assert.equal(await mobileMenu.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await mobileMenu.getAttribute('aria-expanded'), 'false');
  }

  await page.getByRole('button', { name: 'Adicionar Frutas amarelas ao pedido' }).click();
  await page.getByRole('button', { name: 'Adicionar Frutas amarelas ao pedido' }).click();
  await page.getByRole('button', { name: 'Adicionar Chocolate com brigadeiro ao pedido' }).click();
  await page.getByRole('button', { name: 'Docinhos', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar Brigadeiros e docinhos ao pedido' }).click();
  await page.getByRole('button', { name: 'Casamentos', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar Bolo de casamento ao pedido' }).click();
  assert.equal(await page.locator('[data-cart-count]').first().textContent(), '29');
  await page.getByRole('button', { name: 'Abrir meu pedido' }).click();
  const order = page.locator('#order-dialog');
  assert.equal(await order.locator('.order-item').count(), 4);
  await order.getByRole('button', { name: 'Aumentar quantidade de Frutas amarelas' }).click();
  const fruits = order.locator('.order-item').filter({ hasText: 'Frutas amarelas' });
  assert.equal(await fruits.locator('.quantity strong').textContent(), '3');
  const sweets = order.locator('.order-item').filter({ hasText: 'Brigadeiros e docinhos' });
  await sweets.getByRole('button', { name: 'Aumentar quantidade de Brigadeiros e docinhos' }).click();
  assert.equal(await sweets.locator('.quantity strong').textContent(), '26');
  await sweets.getByRole('button', { name: 'Diminuir quantidade de Brigadeiros e docinhos' }).click();
  assert.equal(await sweets.locator('.quantity strong').textContent(), '25');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.plus), 'docinhos');
  await order.getByRole('button', { name: 'Remover Chocolate com brigadeiro do pedido' }).click();
  assert.equal(await order.locator('.order-item').count(), 3);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.remove), 'docinhos');
  assert.match(await page.locator('#order-totals').innerText(), /Subtotal e total a confirmar/);
  assert.equal(await page.locator('#consent').isChecked(), false);

  const submit = order.getByRole('button', { name: /Revisar pedido no WhatsApp/ });
  await submit.click(); assert.match(await page.locator('#form-error').innerText(), /nome/i);
  await page.getByLabel('Seu nome').fill('Ana de Souza');
  await submit.click(); assert.match(await page.locator('#form-error').innerText(), /escolha entrega/i);
  await page.getByLabel('Entrega', { exact: true }).check();
  assert.equal(await page.locator('#delivery-address').isVisible(), true);
  await submit.click(); assert.match(await page.locator('#form-error').innerText(), /endereço/i);
  await page.locator('#delivery-address').fill('Rua das Flores, 12');
  await page.locator('#desired-date').fill('2027-04-10');
  await page.locator('#guests').fill('80');
  await page.locator('#notes').fill('Docinhos de coco, por favor.');
  await order.locator('[data-legal="privacy"]').click();
  assert.equal(await page.locator('#legal-dialog').evaluate(el => el.open), true);
  assert.equal(await page.locator('#consent').isChecked(), false);
  await page.locator('[data-close-legal]').click();
  assert.equal(await order.evaluate(el => el.open), true);
  await submit.click(); assert.match(await page.locator('#form-error').innerText(), /privacidade/i);
  assert.equal(await page.evaluate(() => window.__opened), undefined);
  await page.locator('#consent').check();
  const [popup] = await Promise.all([context.waitForEvent('page'), submit.click()]);
  await popup.waitForURL('https://wa.me/**');
  const opened = await page.evaluate(() => window.__opened);
  assert.ok(opened && opened.url.startsWith('https://wa.me/5521980298601?text='));
  const text = new URL(opened.url).searchParams.get('text');
  for (const phrase of ['3 × Frutas amarelas', '25 × Brigadeiros e docinhos', '1 × Bolo de casamento', 'Nome: Ana de Souza', 'Data desejada: 10/04/2027', 'Recebimento: Entrega', 'Endereço: Rua das Flores, 12', 'Convidados: 80', 'Observações: Docinhos de coco, por favor.']) assert.ok(text.includes(phrase), 'Missing: ' + phrase);
  assert.ok(!text.includes('Chocolate com brigadeiro'));
  assert.ok(!text.includes('pedido confirmado'));
  await popup.close();

  await order.getByRole('button', { name: 'Fechar pedido' }).click();
  await page.reload({ waitUntil: 'load' });
  await page.getByRole('button', { name: 'Abrir meu pedido' }).click();
  assert.equal(await order.locator('.order-item').count(), 3);
  assert.equal(await page.locator('#customer-name').inputValue(), 'Ana de Souza');
  assert.equal(await page.locator('#delivery-address').inputValue(), 'Rua das Flores, 12');
  assert.equal(await page.locator('#consent').isChecked(), false, 'Consent must not be pre-checked after reload');
  while (await order.locator('.order-item').count()) await order.locator('.order-item').first().locator('[data-remove]').click();
  assert.equal(await page.locator('#empty-order').isVisible(), true);
  assert.equal(await page.evaluate(() => document.activeElement.closest('#empty-order') !== null), true);
  await order.getByRole('button', { name: 'Fechar pedido' }).click();
  await page.getByRole('button', { name: 'Bolos de aniversário', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar Degustação de bolos ao pedido' }).click();
  await page.getByRole('button', { name: 'Adicionar Degustação de bolos ao pedido' }).click();
  await page.getByRole('button', { name: 'Abrir meu pedido' }).click();
  assert.match(await page.locator('#order-totals').innerText(), /R\$\s*280,00/);
  await page.getByLabel('Retirada', { exact: true }).check();
  assert.equal(await page.locator('#delivery-address').isVisible(), false);
  await page.locator('#consent').check();
  const [fixedPopup] = await Promise.all([context.waitForEvent('page'), submit.click()]);
  await fixedPopup.waitForURL('https://wa.me/**');
  const fixedText = new URL((await page.evaluate(() => window.__opened)).url).searchParams.get('text');
  assert.ok(fixedText.includes('Subtotal de referência: R$ 280,00'));
  assert.ok(!fixedText.includes('Endereço:'));
  assert.deepEqual(errors, []);
  await context.close();
  console.log(`${viewport.name}: PASS — filtros, carrinho, foco, formulário, consentimento, entrega/retirada e resumo WhatsApp`);
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  for (const viewport of viewports) await runViewport(browser, viewport);
  const noJsContext = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const noJs = await noJsContext.newPage();
  await noJs.goto(baseURL, { waitUntil: 'load' });
  assert.equal(await noJs.locator('#site-nav a:visible').count(), 4);
  assert.equal(await noJs.locator('.mobile-toggle').isVisible(), false);
  assert.equal(await noJs.locator('.footer details').count(), 2);
  assert.equal(await noJs.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
  await noJsContext.close();
  await browser.close();
  console.log('Sem JavaScript: navegação, contato e informações legais alternativos disponíveis. Nenhuma mensagem foi enviada.');
})().catch(e => { console.error(e); process.exit(1); });
