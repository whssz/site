#!/usr/bin/env node
/**
 * TESTE FUNCIONAL DO FLUXO DE ENCOMENDA — Amunì a Caparica
 * Requer Chromium (QA_CHROMIUM / LD_LIBRARY_PATH) e index.html já construído.
 * Uso: node scripts/test-flow.mjs [caminho-ou-url]
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(path.resolve('.studio/node_modules/playwright'));
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const target = process.argv[2] || 'index.html';
const url = /^https?:\/\//.test(target) ? target : pathToFileURL(path.resolve(target)).href;
const browser = await chromium.launch({
  executablePath: process.env.QA_CHROMIUM || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(800);

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
};

/* ---------- 1. estrutura / anti-template / honestidade ---------- */
const bodyText = await page.locator('body').innerText();
check('sem frase "Pedido confirmado"', !/pedido confirmado|encomenda confirmada|pagamento confirmado/i.test(bodyText));
check('sem promessa de entrega garantida', !/entrega garantida|entregamos em \d+/i.test(bodyText));
const sections = await page.locator('main section').count();
check('≥4 secções grandes', sections >= 4, `${sections} secções`);
const videos = await page.locator('video[src^="data:"]').count();
const imgs = await page.locator('img[src^="data:"]').count();
check('mídia real embutida (sem ficheiros externos)', videos >= 3 && imgs >= 8, `${imgs} imagens + ${videos} vídeos`);
const external = await page.evaluate(() => [...document.querySelectorAll('img,video')].filter(e => /^https?:/.test(e.currentSrc || e.src || '')).length);
check('zero mídia carregada de servidor externo', external === 0, `${external} externas`);
check('ficheiro único: só 1 <style> e scripts inline', await page.evaluate(() => document.querySelectorAll('style').length === 1 && document.querySelectorAll('script[src]').length === 0));

/* ---------- 2. filtros do cardápio ---------- */
const totalCards = await page.locator('.pizza-card').count();
await page.locator('[data-cat="veganas"]').click();
const veganCards = await page.locator('.pizza-card').count();
check('filtro por categoria funciona', veganCards === 5 && veganCards < totalCards, `${totalCards} → ${veganCards} veganas`);
await page.locator('[data-cat="todas"]').click();
check('filtro "Tudo" restaura cardápio', (await page.locator('.pizza-card').count()) === totalCards, `${totalCards} itens`);

/* ---------- 3. adicionar / quantidade / observações / subtotal ---------- */
const EUR = c => (c / 100).toFixed(2).replace('.', ',') + ' €';
await page.locator('[data-add="margherita"]').click();
await page.locator('[data-add="margherita"]').click();      // 2 × 14,00
await page.locator('[data-add="amuni"]').click();            // 1 × 17,50
check('contador do carrinho = 3', (await page.locator('#cartCount').innerText()) === '3');
await page.locator('#openCart').click();
check('painel do carrinho abre', await page.locator('#cartLayer').evaluate(e => e.classList.contains('open')));
check('2 linhas no carrinho', (await page.locator('.cart-line').count()) === 2);
check('subtotal correto (2×14,00 + 17,50)', (await page.locator('#subtotal').innerText()) === EUR(4550), await page.locator('#subtotal').innerText());

await page.locator('[data-line="margherita"] [data-step="1"]').click();   // 3 × 14,00
check('aumentar quantidade recalcula subtotal', (await page.locator('#subtotal').innerText()) === EUR(5950), await page.locator('#subtotal').innerText());
await page.locator('[data-line="margherita"] [data-step="-1"]').click();
check('diminuir quantidade recalcula subtotal', (await page.locator('#subtotal').innerText()) === EUR(4550));
await page.locator('[data-line="margherita"] textarea').fill('sem manjericão, por favor');
await page.locator('[data-line="amuni"] [data-remove]').click();
check('remover item recalcula subtotal', (await page.locator('#subtotal').innerText()) === EUR(2800));
check('1 linha restante', (await page.locator('.cart-line').count()) === 1);
await page.locator('#closeCart').click();
await page.locator('#openCart2').click();
check('observações persistem ao fechar/abrir', (await page.locator('[data-line="margherita"] textarea').inputValue()) === 'sem manjericão, por favor');
check('carrinho persiste após recarregar', await (async () => { await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(400); return (await page.locator('#cartCount').innerText()) === '2'; })());
await page.locator('#openCart').click();

/* ---------- 4. validação: modalidade + consentimento ---------- */
const wa = page.locator('#waSend');
let href = await wa.getAttribute('href');
check('ligação WhatsApp gerada com número confirmado', href.startsWith('https://wa.me/351913225786?text='), href.slice(0, 46));
let msg = decodeURIComponent(href.split('?text=')[1]);
check('resumo contém item, quantidade e preço', /2× Margherita/.test(msg) && /28,00 €/.test(msg) && /Subtotal/.test(msg));
check('resumo contém observação', /sem manjericão, por favor/.test(msg));

// bloqueio 1: sem modalidade
await wa.click({ force: true });
check('bloqueia envio sem modalidade', await page.locator('#cartErr').evaluate(e => e.classList.contains('show')) && /Escolha/.test(await page.locator('#cartErr').innerText()));
await page.locator('input[name="mod"][value="Recolha no local"]').check();
// bloqueio 2: sem consentimento
await wa.click({ force: true });
check('bloqueia envio sem consentimento', /consentimento/.test(await page.locator('#cartErr').innerText()));
check('consentimento não vem pré-marcado', !(await page.locator('#consentBox').isChecked()));
await page.locator('#consentBox').check();
href = await wa.getAttribute('href');
msg = decodeURIComponent(href.split('?text=')[1]);
check('modalidade escolhida entra no resumo', /Recolha no local/.test(msg), msg.split('\n').filter(l => /Modalidade/.test(l))[0]);
check('sem consentimento não há erro após marcar', !(await page.locator('#cartErr').evaluate(e => e.classList.contains('show'))));

/* ---------- 5. nome opcional + cópia de resumo ---------- */
await page.locator('#custName').fill('Ana');
msg = decodeURIComponent((await wa.getAttribute('href')).split('?text=')[1]);
check('nome opcional entra no resumo', /\*Nome:\* Ana/.test(msg));
await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
await page.locator('#copySummary').click();
const copied = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
const expected = decodeURIComponent((await wa.getAttribute('href')).split('?text=')[1]);
check('copiar resumo reproduz exatamente a mensagem', copied === expected, `${copied.length} / ${expected.length} chars`);

/* ---------- 6. esvaziar ---------- */
await page.locator('#clearCart').click();
check('esvaziar zera contador e subtotal', (await page.locator('#cartCount').innerText()) === '0' && (await page.locator('#subtotal').innerText()) === EUR(0));
check('estado vazio é visível', /pedido está vazio/i.test(await page.locator('.cart-empty').innerText()));
await page.locator('#closeCart').click();

/* ---------- 7. diálogos legais + links externos reais ---------- */
await page.locator('button[data-dialog="privacidade"]').first().click();
check('Política de Privacidade abre', await page.locator('#dlg-privacidade').evaluate(d => d.open));
await page.locator('#dlg-privacidade [data-close]').click();
await page.locator('button[data-dialog="termos"]').first().click();
check('Termos de Uso abrem', await page.locator('#dlg-termos').evaluate(d => d.open));
await page.locator('#dlg-termos [data-close]').click();
const links = await page.locator('a[href^="http"]').evaluateAll(as => [...new Set(as.map(a => a.getAttribute('href')))]);
check('ligações externas são reais (WhatsApp, Maps, reservas, Instagram, Uber Eats)', links.filter(h => /wa\.me|amuni\.pizza|instagram\.com|ubereats\.com|google\.com|tiktok|linktr|g\.page/.test(h)).length >= 8, `${links.length} destinos`);

/* ---------- 8. animação contínua / reduced motion ---------- */
const loops = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect.getTiming().iterations === Infinity).length);
check('loop perpétuo ativo durante navegação', loops >= 2, `${loops} animações infinitas`);
const rm = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
await rm.goto(url, { waitUntil: 'load' });
await rm.waitForTimeout(600);
const rmState = await rm.evaluate(() => ({
  running: document.getAnimations().filter(a => a.playState === 'running').length,
  paused: [...document.querySelectorAll('video')].every(v => v.paused || !v.autoplay),
  hidden: [...document.querySelectorAll('.rev,.rv-fade,.rv-scale,.rv-left,.rv-right,.rv-clip,[data-reveal]')].filter(e => parseFloat(getComputedStyle(e).opacity) === 0).length
}));
check('reduced-motion: tudo parado, vídeos pausados, nada oculto', rmState.running === 0 && rmState.paused && rmState.hidden === 0, JSON.stringify(rmState));
await rm.close();

/* ---------- 9. ausência de erros ---------- */
check('zero erros de JavaScript', errors.length === 0, errors.slice(0, 2).join(' | '));

/* ---------- screenshots ---------- */
mkdirSync('qa-shots', { recursive: true });
for (const [w, h, name] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  const sp = await browser.newPage({ viewport: { width: w, height: h } });
  await sp.goto(url, { waitUntil: 'load' });
  await sp.waitForTimeout(1000);
  await sp.screenshot({ path: `qa-shots/${name}-top.png` });
  await sp.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += innerHeight * .8) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 500));
  });
  await sp.screenshot({ path: `qa-shots/${name}-full.png`, fullPage: true });
  await sp.close();
}
console.log('\nscreenshots: qa-shots/');

await browser.close();
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} verificações passaram`);
if (failed.length) { console.log('FALHAS:', failed.map(f => f.name).join(', ')); process.exit(1); }
console.log('✓ FLUXO FUNCIONAL COMPLETO\n');
