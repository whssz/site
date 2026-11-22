/**
 * TESTE FUNCIONAL — fluxo real num navegador real.
 * Cobre: procura/filtros da carta, opções reais, matemática do carrinho,
 * bloqueio por consentimento, URL de WhatsApp item a item, validação de
 * reserva por dia da semana, lightbox por teclado e prefers-reduced-motion.
 *
 *   node tests/flow.mjs
 */
import { launchBrowser } from '../tools/browser.mjs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const url = pathToFileURL(path.resolve('public/index.html')).href;
const browser = await launchBrowser();
const results = [];
let failures = 0;

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (!ok) failures++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? '  ·  ' + detail : ''}`);
}

/* ---------- desktop ---------- */
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 120)));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(600);

/* 1. carta completa */
const total = await page.locator('[data-item]').count();
check('carta com os 70 itens publicados', total === 70, `${total} pratos`);

const cats = await page.$$eval('[data-block]', els => els.map(e => e.dataset.block));
check('11 categorias na carta', cats.length === 11, cats.join(', '));

/* 2. procura */
await page.fill('#q', 'burrata');
await page.waitForTimeout(250);
const found = await page.locator('[data-item]:visible').count();
check('procura "burrata" filtra a carta', found > 0 && found < 20, `${found} resultados`);
await page.click('#q', { clickCount: 3 });
await page.press('#q', 'Backspace');
await page.waitForTimeout(200);

/* 3. filtro vegetariano */
await page.click('[data-filter="veg"]');
await page.waitForTimeout(300);
const vegData = await page.evaluate(() => {
  const vis = [...document.querySelectorAll('[data-item]')].filter(e => !e.hidden);
  return { total: vis.length, veg: vis.filter(e => e.hasAttribute('data-veg')).length };
});
check('filtro vegetariano só mostra pratos vegetarianos', vegData.total === vegData.veg && vegData.total > 10, `${vegData.total} pratos, ${vegData.veg} veg`);
await page.click('[data-filter="veg"]');
await page.waitForTimeout(250);

/* 4. categoria */
await page.click('[data-cat="pizze"]');
await page.waitForTimeout(300);
const pizze = await page.locator('[data-item]:visible[data-cat="pizze"]').count();
check('categoria Pizze mostra as 10 pizzas', pizze === 10, `${pizze}`);
await page.click('[data-cat="all"]');
await page.waitForTimeout(250);

/* limpa estado de execuções anteriores */
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(500);

/* 5. carrinho: adiciona com opção real */
await page.evaluate(() => {
  document.querySelector('[data-name="Calzone Napoletano"] input[value="Bacon enrolado"]').checked = true;
  document.querySelector('[data-name="Calzone Napoletano"] [data-add]').click();
  document.querySelector('[data-name="Spaghetti pomodoro"] [data-add]').click();
  document.querySelector('[data-name="Água c/ gás"] input[value="0,75 L"]').checked = true;
  document.querySelector('[data-name="Água c/ gás"] [data-add]').click();
});
await page.waitForTimeout(500);

const count = await page.locator('[data-count]').first().textContent();
check('contador do pedido soma 3 itens', count.trim() === '3', count.trim());

/* 6. abrir carrinho e conferir valores */
await page.click('[data-open-cart]');
await page.waitForTimeout(500);
const rows = await page.locator('#cartList .ci').count();
check('carrinho lista 3 linhas', rows === 3, `${rows}`);
const optTxt = await page.locator('#cartList .oi').first().textContent();
check('opção escolhida aparece no carrinho', /Bacon enrolado/.test(optTxt || ''), optTxt || '');
const subtotal = (await page.locator('#subtotal').textContent()).trim();
check('subtotal = 18,00 + 14,50 + 3,00 = 35,50 €', subtotal === '35,50 €', subtotal);

/* 7. quantidade e remoção */
await page.locator('#cartList .ci').nth(1).locator('[data-inc]').click();
await page.waitForTimeout(250);
const sub2 = (await page.locator('#subtotal').textContent()).trim();
check('aumentar quantidade recalcula o total', sub2 === '50,00 €', sub2);
await page.locator('#cartList .ci').nth(1).locator('[data-dec]').click();
await page.waitForTimeout(250);
await page.locator('#cartList .ci').first().locator('[data-rm]').click();
await page.waitForTimeout(300);
const rows2 = await page.locator('#cartList .ci').count();
const sub3 = (await page.locator('#subtotal').textContent()).trim();
check('remover item atualiza linhas e total', rows2 === 2 && sub3 === '17,50 €', `${rows2} · ${sub3}`);

/* 8. bloqueio sem consentimento */
await page.fill('#cName', 'Ana Teste');
await page.fill('#cPhone', '+351 912 345 678');
/* a sandbox não tem rede externa: interceptamos window.open para ler a URL
   exata que o site gera (o teste real é a URL, não a página do WhatsApp) */
await page.evaluate(() => {
  window.__opened = [];
  window.open = (u) => { window.__opened.push(u); return null; };
});
let opened = null;
await page.click('#checkout');
await page.waitForTimeout(500);
const openedNow = await page.evaluate(() => window.__opened.slice());
opened = openedNow.length ? openedNow[0] : null;
const errShown = await page.locator('#cErr').textContent();
check('sem consentimento o envio é bloqueado', !opened && /consentimento/i.test(errShown || ''), errShown.trim().slice(0, 60));

/* 9. com consentimento gera URL do WhatsApp certa */
await page.check('#cConsent', { force: true });
await page.click('#checkout');
await page.waitForTimeout(400);
const urls = await page.evaluate(() => window.__opened.slice());
const waUrl = decodeURIComponent(urls[urls.length - 1] || '');
check('abre WhatsApp no número oficial', waUrl.includes('wa.me/351937949039'), waUrl.slice(0, 46));
check('mensagem inclui tipo de pedido', /Tipo: Retirada/.test(waUrl));
check('mensagem lista o prato com preço unitário × quantidade', /1× Spaghetti pomodoro — 14,50 €/.test(waUrl));
check('mensagem inclui a água de 0,75 L a 3,00 €', /1× Água c\/ gás \(0,75 L\) — 3,00 €/.test(waUrl));
check('mensagem inclui total sem extras', /Total \(sem extras\): 17,50 €/.test(waUrl));
check('mensagem não afirma confirmação', /Aguardo confirmação da casa/.test(waUrl) && !/confirmado/i.test(waUrl));

/* 10. cópia do resumo */
await page.click('[data-close-cart]');
await page.waitForTimeout(300);

/* 11. reservas: domingo bloqueado */
const sun = new Date(); sun.setDate(sun.getDate() + ((7 - sun.getDay()) % 7 || 7));
const iso = sun.toISOString().slice(0, 10);
await page.fill('#rDate', iso);
await page.locator('#rName').fill('Ana Teste');
await page.locator('#rPhone').fill('912345678');
await page.check('#rConsent', { force: true });
await page.click('#rSend');
await page.waitForTimeout(400);
const sunErr = (await page.locator('#rErr').textContent()).trim();
check('domingo (fechado) é recusado na reserva', /fechada/i.test(sunErr), sunErr);

/* 12. reservas: segunda só ao jantar */
const mon = new Date(); const add = ((8 - mon.getDay()) % 7) || 7; mon.setDate(mon.getDate() + add);
const isoTue = (() => { const d = new Date(); const a = ((9 - d.getDay()) % 7) || 7; d.setDate(d.getDate() + a); return d.toISOString().slice(0, 10); })();
await page.fill('#rDate', isoTue);
await page.waitForTimeout(200);
const times = await page.$$eval('#rTime option', os => os.map(o => o.value).filter(Boolean));
check('terça oferece almoço e jantar', times.includes('12:30') && times.includes('18:00') && times.includes('22:00'), times.slice(0, 3).join(' ') + ' …');
const isoMon = (() => { const d = new Date(); const a = ((8 - d.getDay()) % 7) || 7; d.setDate(d.getDate() + a); return d.toISOString().slice(0, 10); })();
await page.fill('#rDate', isoMon);
await page.waitForTimeout(200);
const monTimes = await page.$$eval('#rTime option', os => os.map(o => o.value).filter(Boolean));
check('segunda só oferece horários de jantar', monTimes.length > 0 && monTimes.every(t => +t.split(':')[0] >= 18), monTimes.join(' '));

/* 13. reserva válida gera mensagem */
await page.fill('#rDate', isoTue);
await page.waitForTimeout(200);
await page.selectOption('#rTime', '12:30');
await page.evaluate(() => { window.__opened.length = 0; });
await page.click('#rSend');
await page.waitForTimeout(400);
const urls2 = await page.evaluate(() => window.__opened.slice());
const resvUrl = decodeURIComponent(urls2[urls2.length - 1] || '');
check('reserva válida abre o WhatsApp', resvUrl.includes('wa.me/351937949039'), resvUrl.slice(0, 46));
check('reserva leva dia, hora e pessoas', /Hora: 12:30/.test(resvUrl) && /Pessoas: 2/.test(resvUrl) && /Dia: terça/.test(resvUrl));

/* 14. lightbox por teclado */
await page.click('[data-lb]');
await page.waitForTimeout(400);
const lbOn = await page.locator('#lightbox.on').count();
const lbNum = (await page.locator('#lbNum').textContent()).trim();
check('galeria abre em lightbox', lbOn === 1, lbNum);
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(300);
const lbNum2 = (await page.locator('#lbNum').textContent()).trim();
check('seta direita avança a fotografia', lbNum !== lbNum2, lbNum2);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check('Escape fecha a galeria', (await page.locator('#lightbox.on').count()) === 0);

/* 15. persistência do carrinho */
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(500);
const persisted = (await page.locator('[data-count]').first().textContent()).trim();
check('pedido sobrevive ao recarregar (localStorage)', persisted === '2', persisted);

/* 16. sem erros de JS */
check('nenhum erro de JavaScript', errs.length === 0, errs[0] || '');

await page.close();

/* ---------- mobile ---------- */
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
const mErrs = [];
m.on('pageerror', e => mErrs.push(String(e)));
await m.goto(url, { waitUntil: 'load' });
await m.waitForTimeout(500);
await m.click('[data-burger]');
await m.waitForTimeout(350);
check('menu mobile abre', (await m.locator('#mnav.on').count()) === 1);
await m.click('#mnav a[href="#carta"]');
await m.waitForTimeout(500);
check('menu mobile fecha ao navegar', (await m.locator('#mnav.on').count()) === 0);
const fabVisible = await m.locator('#cartFab').isVisible();
check('botão flutuante do pedido visível no mobile', fabVisible);
const hscroll = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('sem scroll horizontal no mobile', hscroll === 0, hscroll + 'px');
check('sem erros de JS no mobile', mErrs.length === 0, mErrs[0] || '');
await m.close();

/* ---------- reduced motion ---------- */
const r = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await r.goto(url, { waitUntil: 'load' });
await r.waitForTimeout(700);
const rm = await r.evaluate(() => ({
  running: document.getAnimations().filter(a => a.playState === 'running').length,
  hidden: [...document.querySelectorAll('.rev,.rv-fade,.rv-scale,.rv-left,.rv-right,.rv-clip')]
    .filter(e => parseFloat(getComputedStyle(e).opacity) === 0).length,
}));
check('prefers-reduced-motion para todas as animações', rm.running === 0, rm.running + ' ativas');
check('prefers-reduced-motion não esconde conteúdo', rm.hidden === 0, rm.hidden + ' ocultos');
await r.close();

await browser.close();

const pass = results.length - failures;
console.log('\n  ' + '─'.repeat(60));
console.log(`  ${failures === 0 ? '✓ PASSOU' : '✗ FALHOU'} — ${pass}/${results.length} verificações\n`);
process.exit(failures === 0 ? 0 : 1);
