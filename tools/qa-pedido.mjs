#!/usr/bin/env node
/**
 * QA FUNCIONAL E2E — Sistema de Pedidos, Filtros, Rodízio/Reservas, Galeria e Modais Legais
 * Uso: node tools/qa-pedido.mjs public/index.html
 */
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { launchBrowser } from './browser.mjs';

const target = process.argv[2] || 'public/index.html';
const url = /^https?:\/\//.test(target) ? target : pathToFileURL(path.resolve(target)).href;

const checks = [];
const assert = (cond, label, detail = '') => {
  checks.push({ ok: Boolean(cond), label, detail });
};

const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()); });

// Intercepta window.open para inspecionar URLs do WhatsApp sem abrir aba externa
await page.addInitScript(() => {
  window.__OPENED_URLS__ = [];
  window.open = (u) => { window.__OPENED_URLS__.push(String(u)); return null; };
});

await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(400);

// 1. Todas as imagens carregadas com dimensões reais (naturalWidth > 0)
const imgAudit = await page.evaluate(async () => {
  const imgs = [...document.querySelectorAll('img')];
  for (const img of imgs) {
    img.loading = 'eager';
    try { await img.decode(); } catch {}
  }
  const broken = imgs.filter(i => i.naturalWidth === 0).map(i => i.alt || i.id);
  return { total: imgs.length, broken };
});
assert(imgAudit.total >= 18 && imgAudit.broken.length === 0,
  `Imagens reais carregadas (${imgAudit.total}/${imgAudit.total})`,
  imgAudit.broken.join('; '));

// 2. Cardápio completo (33 itens, 7 abas) + filtros + busca
const initialItems = await page.locator('#menuContainer .menu-item').count();
const tabsCount = await page.locator('#catTabs .cat-tab').count();
assert(initialItems === 33 && tabsCount === 7, `Cardápio completo renderizado (${initialItems} itens, ${tabsCount} abas)`);

await page.click('.cat-tab[data-cat="veganas"]');
const veganCount = await page.locator('#menuContainer .menu-item').count();
assert(veganCount === 6, `Aba Pizzas Veganas retorna 6 pizzas (${veganCount})`);
await page.click('.cat-tab[data-cat="todas"]');

await page.click('.diet-chip[data-diet="pistachio"]');
const pistCount = await page.locator('#menuContainer .menu-item').count();
assert(pistCount >= 5, `Filtro Com Pistáchio retorna receitas com pistáchio (${pistCount})`);
await page.click('.diet-chip[data-diet="pistachio"]');

await page.fill('#menuSearch', 'friarielli');
const searchCount = await page.locator('#menuContainer .menu-item').count();
assert(searchCount === 2, `Busca por ingrediente 'friarielli' retorna clássica + vegana (${searchCount})`);
await page.fill('#menuSearch', '');

// 3. Fluxo de pedido: adicionar rápida + personalizar com extras e nota + variação
await page.locator('#popularGrid .card', { hasText: 'Capricciosa' }).locator('button', { hasText: 'Adicionar' }).click(); // Capricciosa 15,50 €

const spacCard = page.locator('#popularGrid .card', { hasText: 'Spacchiosa' });
await spacCard.locator('button', { hasText: 'Personalizar' }).click();
await page.locator('#extrasList input[value="bufala"]').check();       // +3,50 €
await page.locator('#extrasList input[value="gluten-free"]').check();  // +3,00 €
await page.fill('#itemNoteInput', 'Cortar em 6 fatias');
await page.click('#modalQtyPlus');                                      // qty = 2 -> (18,50 + 6,50)*2 = 50,00 €
const modalTotal = await page.locator('#modalTotalPrice').textContent();
assert(modalTotal.trim() === '50,00 €', `Cálculo no modal com extras × 2 = 50,00 € (${modalTotal})`);
await page.click('#modalConfirmAdd');

await page.getByRole('button', { name: /Escolher opção de Pão de Alho/i }).click();
await page.locator('#variationList input[value="Com queijo vegan (100% vegetal)"]').check(); // 7,00 €
await page.click('#modalConfirmAdd');

// Total esperado: 17,50 (Capricciosa) + 50,00 (2x Spacchiosa c/ extras) + 7,00 (Pão de Alho) = 74,50 € (4 unidades)
const badgeBefore = await page.locator('#hdrCartCount').textContent();
const floatTotal = await page.locator('#floatCartTotal').textContent();
assert(badgeBefore === '4' && floatTotal === '74,50 €', `Subtotal exato no carrinho (4 itens = 74,50 €; obtido ${badgeBefore} / ${floatTotal})`);

// 4. Persistência em localStorage após reload
await page.reload({ waitUntil: 'load' });
const badgeAfter = await page.locator('#hdrCartCount').textContent();
assert(badgeAfter === '4', `Persistência do pedido após reload (${badgeAfter} itens)`);

// 5. Edição no carrinho + bloqueio de consentimento + mensagem WhatsApp
await page.click('#openCartBtn');
await page.locator('#cartList .cart-item', { hasText: 'Pão de Alho' }).locator('.cart-remove').click();
const totalAfterRemove = await page.locator('#cartTotalValue').textContent();
assert(totalAfterRemove === '67,50 €', `Remoção atualiza total em tempo real para 67,50 € (${totalAfterRemove})`);

const cartConsentDefault = await page.locator('#cartConsent').isChecked();
assert(cartConsentDefault === false, 'Consentimento do carrinho desmarcado por padrão');

await page.fill('#cartCustomerName', 'Beatriz Silva');
await page.click('#sendWhatsAppOrderBtn');
const openedWithoutConsent = await page.evaluate(() => window.__OPENED_URLS__.length);
assert(openedWithoutConsent === 0, 'Envio do pedido bloqueado sem marcar consentimento');

await page.check('input[name="fulfillment"][value="entrega"]');
await page.check('#cartConsent');
await page.click('#sendWhatsAppOrderBtn');
const openedWithoutAddress = await page.evaluate(() => window.__OPENED_URLS__.length);
assert(openedWithoutAddress === 0, 'Consulta de entrega bloqueada sem informar morada');

await page.fill('#cartAddress', 'Av. General Humberto Delgado 18, Costa de Caparica');
await page.click('#sendWhatsAppOrderBtn');

const waOrderUrl = await page.evaluate(() => window.__OPENED_URLS__[0] || '');
const decodedOrder = decodeURIComponent(waOrderUrl.split('?text=')[1] || '');
const feedbackOrder = await page.locator('#cartFeedback').textContent();
assert(
  waOrderUrl.startsWith('https://wa.me/351913225786?text=') &&
  decodedOrder.includes('1x Capricciosa — 17,50 €') &&
  decodedOrder.includes('2x Spacchiosa — 50,00 €') &&
  decodedOrder.includes('Mozzarella di Bufala Campana') &&
  decodedOrder.includes('Massa Sem Glúten') &&
  decodedOrder.includes('Cortar em 6 fatias') &&
  decodedOrder.includes('Total estimado (itens do menu): 67,50 €') &&
  !/pedido confirmado/i.test(feedbackOrder),
  'Mensagem WhatsApp formatada com itens, extras, obs., morada, total 67,50 € e feedback honesto'
);
await page.click('[data-close-dialog="cartDrawer"]');

// 6. Validação do Rodízio (bloqueia segunda, bloqueia <4 pessoas, calcula 5 × 18€ = 90,00€)
await page.fill('#bookDate', '2026-11-23'); // segunda-feira
await page.fill('#bookName', 'Tiago Costa');
await page.check('#bookConsent');
await page.click('#bookingForm button[type="submit"]');
const afterMonday = await page.evaluate(() => window.__OPENED_URLS__.length);
assert(afterMonday === 1, 'Reserva bloqueia segunda-feira (dia encerrado)');

await page.fill('#bookDate', '2026-11-26'); // quinta-feira (Rodízio)
await page.fill('#bookGuests', '3');
await page.click('#bookingForm button[type="submit"]');
const afterUnder4 = await page.evaluate(() => window.__OPENED_URLS__.length);
assert(afterUnder4 === 1, 'Rodízio bloqueia grupo com menos de 4 pessoas');

await page.fill('#bookGuests', '5');
await page.click('#bookingForm button[type="submit"]');
const waBookUrl = await page.evaluate(() => window.__OPENED_URLS__[1] || '');
const decodedBook = decodeURIComponent(waBookUrl.split('?text=')[1] || '');
assert(
  waBookUrl.startsWith('https://wa.me/351913225786?text=') &&
  decodedBook.includes('Pizza Rodízio') &&
  decodedBook.includes('26/11/2026') &&
  decodedBook.includes('90,00 €'),
  'Reserva de Rodízio formata WhatsApp com data, 5 pessoas e 90,00 €'
);

// 7. Galeria lightbox + Modais legais (Privacidade e Termos) + Pausa de movimento
await page.locator('#galleryGrid .gallery-card').first().click();
assert(await page.locator('#lightboxDialog').evaluate(d => d.open), 'Lightbox da galeria abre corretamente');
await page.click('[data-close-dialog="lightboxDialog"]');

await page.click('footer [data-open-legal="privacidade"]');
const privText = await page.locator('#legalDialogBody').textContent();
assert(privText.includes('RGPD') && privText.includes('LGPD'), 'Política de Privacidade abre com conteúdo RGPD & LGPD');
await page.click('#legalDialog .dialog-close');

await page.click('footer [data-open-legal="termos"]');
const termText = await page.locator('#legalDialogBody').textContent();
assert(termText.includes('18,00 €') && termText.includes('alergias'), 'Termos de Uso abrem com condições reais da pizzaria');
await page.click('#legalDialog .dialog-close');

await page.click('#motionToggle');
const pausedCount = await page.evaluate(() =>
  document.getAnimations().filter(a => a.animationName && a.playState === 'running').length
);
assert(pausedCount === 0, `Botão 'Pausar movimento' pausa 100% das animações (rodando: ${pausedCount})`);

assert(pageErrors.length === 0, 'Zero erros de JS ou console durante todo o fluxo E2E', pageErrors.join('; '));

await browser.close();

console.log('\n  QA PEDIDO & FLUXOS · ' + target);
console.log('  ' + '─'.repeat(64));
let failed = 0;
for (const c of checks) {
  console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}${c.detail && !c.ok ? ' — ' + c.detail : ''}`);
  if (!c.ok) failed++;
}
console.log('  ' + '─'.repeat(64));
if (failed) {
  console.log(`  ✗ FAIL (${failed} falha(s))\n`);
  process.exit(1);
}
console.log(`  ✓ PASS (${checks.length}/${checks.length} verificações funcionais aprovadas)\n`);
