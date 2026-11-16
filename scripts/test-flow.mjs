#!/usr/bin/env node
/**
 * TESTE FUNCIONAL REAL do fluxo de pedido da Quatro em 1.
 * Roda no runner do GitHub Actions (navegador real).
 * Verifica: adicionar, alterar quantidade, remover, total, entrega/retirada,
 * validação, consentimento e a mensagem final do WhatsApp.
 */
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const file = process.argv[2] || 'index.html';
const url = pathToFileURL(path.resolve(file)).href;
const out = [];
const log = (m) => { console.log(m); out.push(m); };
let falhas = 0;
const check = (cond, msg) => {
  log((cond ? '  OK   ' : '  FAIL ') + msg);
  if (!cond) falhas++;
};

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });

// captura o window.open do WhatsApp
await page.addInitScript(() => { window.__wa = []; window.open = (u) => { window.__wa.push(u); return null; }; });

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(900);

log('\n── 1. adicionar produtos');
const addBtns = page.locator('[data-add]:visible');
const n = await addBtns.count();
check(n > 0, `${n} botões "Adicionar" visíveis na categoria inicial`);
await addBtns.nth(0).click();
await page.waitForTimeout(250);
await addBtns.nth(1).click();
await page.waitForTimeout(250);
check(await page.locator('#badge').textContent() === '2', 'badge do carrinho = 2');

log('\n── 2. trocar de categoria e adicionar de outra aba');
await page.locator('.tab', { hasText: 'Salgados' }).click();
await page.waitForTimeout(300);
const salg = page.locator('.p-card[data-cat="salgados"] [data-add]:visible');
await salg.nth(0).click();
await page.waitForTimeout(250);
check(await page.locator('#badge').textContent() === '3', 'badge = 3 após adicionar salgado');

log('\n── 3. abrir o pedido e conferir itens');
await page.locator('#cartOpen').click();
await page.waitForTimeout(600);
check(await page.locator('#drawer').evaluate((e) => e.classList.contains('on')), 'gaveta abriu');
const itens = await page.locator('#dBody .ci').count();
check(itens === 3, `3 itens listados (vistos: ${itens})`);

log('\n── 4. alterar quantidade');
const preco1 = await page.locator('#dBody .ci .ci-p').first().textContent();
await page.locator('#dBody .ci [data-p]').first().click();
await page.waitForTimeout(300);
const qtd1 = await page.locator('#dBody .ci .qty span').first().textContent();
check(qtd1.trim() === '2', `quantidade do 1º item virou 2 (visto: ${qtd1.trim()})`);
const totalTxt = await page.locator('.d-total b').textContent();
check(/R\$ \d/.test(totalTxt), `total exibido: ${totalTxt}`);

log('\n── 5. remover item');
await page.locator('#dBody .ci [data-r]').last().click();
await page.waitForTimeout(300);
check(await page.locator('#dBody .ci').count() === 2, 'item removido (2 itens restantes)');

log('\n── 6. validação: envia sem nome');
await page.locator('#send').click();
await page.waitForTimeout(400);
check(await page.locator('#nome').evaluate((e) => e.closest('.field').classList.contains('err')),
  'campo nome marcado como erro');
check((await page.evaluate(() => window.__wa.length)) === 0, 'WhatsApp NÃO abriu sem dados válidos');

log('\n── 7. validação: consentimento obrigatório');
await page.fill('#nome', 'Cliente de teste');
await page.locator('#send').click();
await page.waitForTimeout(400);
check((await page.evaluate(() => window.__wa.length)) === 0, 'WhatsApp NÃO abriu sem consentimento');

log('\n── 8. modalidade delivery x retirada');
const endVisibleRetirada = await page.locator('#fEnd').evaluate((e) => !e.classList.contains('hidden'));
check(endVisibleRetirada === false, 'campo de endereço oculto em "Retirar na loja"');
await page.locator('[data-modo="delivery"]').click();
await page.waitForTimeout(300);
const endVisibleDelivery = await page.locator('#fEnd').evaluate((e) => !e.classList.contains('hidden'));
check(endVisibleDelivery === true, 'campo de endereço aparece em "Delivery"');

log('\n── 9. envio completo');
await page.fill('#nome', 'Cliente de teste');
await page.fill('#end', 'Rua das Flores, 123 — Campo Grande');
await page.fill('#obs', 'Sem cebola, por favor');
await page.check('#consent');
await page.locator('#send').click();
await page.waitForTimeout(700);
const was = await page.evaluate(() => window.__wa);
check(was.length === 1, `WhatsApp aberto 1 vez (${was.length})`);
if (was.length) {
  const u = was[0];
  check(u.startsWith('https://wa.me/5521982493190?text='), 'URL usa o número oficial da loja');
  const msg = decodeURIComponent(u.split('?text=')[1] || '');
  check(/\*Pedido\*/.test(msg), 'mensagem tem o bloco do pedido');
  check(/\*Total:\* R\$/.test(msg), 'mensagem tem o total');
  check(/\*Recebimento:\* Delivery/.test(msg), 'mensagem registra Delivery');
  check(/Rua das Flores, 123/.test(msg), 'mensagem leva o endereço');
  check(/Sem cebola, por favor/.test(msg), 'mensagem leva as observações');
  check(/Cliente de teste/.test(msg), 'mensagem leva o nome');
  log('\n── mensagem gerada ──\n' + msg.replace(/%0A/g, '\n') + '\n─────────────────────');
}

log('\n── 10. persistência ao recarregar');
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(800);
check(await page.locator('#badge').textContent() === '3', 'pedido preservado após recarregar (3 unidades)');

log('\n── 11. teclado e acessibilidade');
await page.locator('#cartOpen').click();
await page.waitForTimeout(500);
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
check(await page.locator('#drawer').evaluate((e) => !e.classList.contains('on')), 'Esc fecha a gaveta');

log('\n── 12. mobile 390px');
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await m.goto(url, { waitUntil: 'load' });
await m.waitForTimeout(900);
const mbarVisible = await m.locator('#mbar').isVisible();
await m.locator('[data-add]:visible').nth(0).click();
await m.waitForTimeout(400);
check(mbarVisible, 'barra de pedido aparece no mobile');
check(await m.locator('#mbar').evaluate((e) => e.classList.contains('on')), 'barra ativa com itens no mobile');
const docW = await m.evaluate(() => document.documentElement.scrollWidth);
const cliW = await m.evaluate(() => document.documentElement.clientWidth);
check(docW <= cliW + 1, `sem scroll horizontal no mobile (doc ${docW} / cli ${cliW})`);

log('\n── erros de JS: ' + (errs.length ? errs.join(' | ') : 'nenhum'));
check(errs.length === 0, 'nenhum erro de JavaScript');

await browser.close();
log('\n' + (falhas === 0 ? '✔ FLUXO APROVADO — 0 falhas' : `✘ ${falhas} FALHA(S) NO FLUXO`));
process.exit(falhas === 0 ? 0 : 1);
