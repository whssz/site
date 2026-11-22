#!/usr/bin/env node
/**
 * QA E2E — Nello's (fluxo funcional real · SCRIPT-UNIVERSAL 14.8)
 *
 * Executa o fluxo inteiro em Chromium real e confere cada resultado:
 *   carta (busca, categorias, filtros) → pedido (adicionar, variantes,
 *   quantidade 1–99, remover, vaciar) → modalidade → consentimento que
 *   bloqueia → resumo gerado item a item → copiar / tel / mailto →
 *   rascunho local sem dados pessoais → galeria (teclado) → textos legais
 *   → menu móvel → pausa de animações → axe-core WCAG 2.1 AA → sem JS.
 *
 * Uso: node tools/qa-nellos.mjs public/index.html [--shots /tmp/shots]
 * Sai com 0 se tudo passar; 1 se qualquer verificação falhar.
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { launchBrowser } from './browser.mjs';

const args = process.argv.slice(2);
const file = path.resolve(args.find((a) => !a.startsWith('--')) || 'public/index.html');
const shotsIdx = args.indexOf('--shots');
const SHOTS = shotsIdx > -1 ? args[shotsIdx + 1] : null;
if (SHOTS) await mkdir(SHOTS, { recursive: true });

/* servidor local (contexto seguro: http://127.0.0.1) com os MESMOS cabeçalhos
   de produção do vercel.json (inclui a CSP: prova que nada externo é necessário) */
const dir = path.dirname(file);
let prodHeaders = {};
try {
  const vj = JSON.parse(await readFile(path.join(dir, '..', 'vercel.json'), 'utf8'));
  for (const h of (vj.headers || []).filter((x) => x.source === '/(.*)')) for (const kv of h.headers) prodHeaders[kv.key] = kv.value;
} catch { prodHeaders = {}; }
const server = createServer(async (req, res) => {
  const p = decodeURIComponent((req.url || '/').split('?')[0]);
  const target = path.join(dir, p === '/' ? path.basename(file) : p);
  try {
    const body = await readFile(target);
    res.writeHead(200, { ...prodHeaders, 'Content-Type': target.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/`;

const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); };
const eur = (s) => String(s).replace(/\s|\u00a0/g, ' ').trim();

const browser = await launchBrowser();
let AxeBuilder = null;
try { ({ default: AxeBuilder } = await import('@axe-core/playwright')); } catch { AxeBuilder = null; }

async function axeScan(page, label) {
  if (!AxeBuilder) { check(`axe · ${label}`, false, '@axe-core/playwright não instalado'); return; }
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const v = r.violations;
  check(`axe WCAG 2.1 AA · ${label}`, v.length === 0,
    v.length ? v.map((x) => `${x.id} (${x.nodes.length}): ${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`).join(' ; ') : `0 violações · ${r.passes.length} regras ok · ${r.incomplete.length} p/ revisão manual`);
}

/* =================================================================
   1. DESKTOP — carta, pedido, consentimento, resumo
   ================================================================= */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: URL_.slice(0, -1) });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL_, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  const base = await page.evaluate(() => ({
    dishes: document.querySelectorAll('.dish').length,
    buttons: document.querySelectorAll('#menu button.buy').length,
    chips: document.querySelectorAll('[data-buy]').length,
    lang: document.documentElement.lang,
    trackers: /googletagmanager|gtag\(|fbq\(|hotjar|clarity\.ms/i.test(document.documentElement.innerHTML),
    external: [...document.querySelectorAll('img,script[src],link[rel="stylesheet"],iframe,video,audio,source')]
      .map((e) => e.getAttribute('src') || e.getAttribute('href') || '').filter((u) => /^https?:/i.test(u)),
    confirmed: /pedido\s+confirmado/i.test(document.body.innerText),
  }));
  check('60 platos com preço renderizados', base.dishes === 60, `${base.dishes} platos`);
  check('88 botões de adicionar (tamanhos e variantes)', base.buttons === 88 && base.chips === 0, `${base.buttons} botões`);
  check('zero rastreador e zero recurso externo carregado', !base.trackers && base.external.length === 0, base.external.join(', ') || 'nenhum');
  check('nenhum texto "pedido confirmado" na página', !base.confirmed);

  const visible = () => page.evaluate(() => document.querySelectorAll('.dish:not(.is-hidden)').length);
  await page.fill('#menu-search', 'genovesa');
  await page.waitForTimeout(250);
  const genovesa = await page.evaluate(() => [...document.querySelectorAll('.dish:not(.is-hidden) .dish-name > span:first-child')].map((e) => e.textContent));
  check('busca "genovesa" → pizza e pasta Genovesa', genovesa.length === 2, genovesa.join(', '));
  await page.fill('#menu-search', 'tiramisu');
  await page.waitForTimeout(250);
  const tira = await page.evaluate(() => ({ dishes: document.querySelectorAll('.dish:not(.is-hidden)').length, empty: document.getElementById('menu-empty').hidden, note: [...document.querySelectorAll('.menu-note:not(.is-hidden)')].map((n) => n.textContent.trim().slice(0, 30)) }));
  check('busca sem acento "tiramisu" encontra a nota de postres do dia', tira.dishes === 0 && tira.empty && tira.note.length === 1, JSON.stringify(tira.note));
  await page.fill('#menu-search', '');
  await page.click('[data-tag-filter="picante"]');
  await page.waitForTimeout(150);
  const hot = await page.evaluate(() => [...document.querySelectorAll('.dish:not(.is-hidden) .dish-name > span:first-child')].map((e) => e.textContent));
  check('filtro Picante → 5 pizzas picantes', hot.length === 5, hot.join(', '));
  await page.click('[data-tag-filter="picante"]');
  await page.click('[data-cat-filter="pasta"]');
  await page.waitForTimeout(150);
  check('categoria Pasta → 5 platos', (await visible()) === 5);
  await page.click('[data-cat-filter="all"]');
  await page.waitForTimeout(150);
  check('Toda la carta → 60 platos de novo', (await visible()) === 60);

  // adicionar: variantes de tamanho, massa+molho e bebida +18
  await page.click('#plato-cl-margherita button.buy[data-label="Mediana"]');
  await page.click('#plato-cl-margherita button.buy[data-label="Mediana"]');
  await page.click('#plato-cl-margherita button.buy[data-label="Familiar"]');
  await page.selectOption('#plato-pa-spaghetti-maccheroni [data-builder="pasta"]', 'Maccheroni');
  await page.selectOption('#plato-pa-spaghetti-maccheroni [data-builder="salsa"]', 'Pesto genovese');
  await page.click('#plato-pa-spaghetti-maccheroni button.buy');
  await page.click('#plato-be-cerveza button.buy');
  const after = await page.evaluate(() => ({
    badge: document.querySelector('.cart-btn [data-cart-count]').textContent,
    fab: !document.getElementById('cart-fab').hidden,
    lines: document.querySelectorAll('#cart-lines .line').length,
    sub: document.getElementById('cart-subtotal').textContent,
  }));
  check('5 unidades em 4 linhas (variantes separadas)', after.badge === '5' && after.lines === 4, `badge ${after.badge}, linhas ${after.lines}`);
  check('subtotal 2×7,50 + 13,50 + 9,50 + 1,50 = 39,50 €', eur(after.sub) === '39,50 €', after.sub);
  check('botão flutuante aparece com itens', after.fab);

  await page.click('.cart-btn');
  await page.waitForTimeout(200);
  check('gaveta do pedido abre como diálogo modal', await page.evaluate(() => document.getElementById('pedido-drawer').matches(':modal')));
  const lineTexts = await page.evaluate(() => [...document.querySelectorAll('#cart-lines .line')].map((l) => l.innerText.replace(/\s+/g, ' ')));
  check('linha da cerveja marcada +18', lineTexts.some((t) => /Cerveza 33 cl.*\+18/.test(t)), lineTexts[3]);
  check('linha da massa mostra massa e molho', lineTexts.some((t) => /Maccheroni.*Salsa pesto genovese/i.test(t)), lineTexts[2]);

  const mLine = '#cart-lines .line:nth-child(1)';
  await page.click(`${mLine} .q-plus`);
  check('+1 unidade → subtotal 47,00 €', eur(await page.textContent('#cart-subtotal')) === '47,00 €');
  await page.fill(`${mLine} .q-input`, '150');
  await page.press(`${mLine} .q-input`, 'Tab');
  check('quantidade digitada 150 é limitada a 99', (await page.inputValue(`${mLine} .q-input`)) === '99');
  await page.fill(`${mLine} .q-input`, '2');
  await page.press(`${mLine} .q-input`, 'Tab');
  check('quantidade editada para 2', (await page.inputValue(`${mLine} .q-input`)) === '2');
  check('menos fica desativado com 1 unidade', await page.isDisabled('#cart-lines .line:nth-child(2) .q-minus'));
  await page.click('#cart-lines .line:nth-child(4) .line-remove');
  check('remover linha (cerveja)', (await page.locator('#cart-lines .line').count()) === 3);
  check('subtotal após remover = 38,00 €', eur(await page.textContent('#cart-subtotal')) === '38,00 €');

  // modalidade + validação + consentimento bloqueando
  await page.click('label.mode:has(input[value="domicilio"])');
  check('A domicilio mostra o campo de endereço', await page.isVisible('[data-only="domicilio"]'));
  await page.click('#order-form button[type="submit"]');
  const blocked = await page.evaluate(() => ({
    send: document.getElementById('send-panel').hidden,
    consentErr: !document.getElementById('consent-error').hidden,
    addrErr: !document.getElementById('address-error').hidden,
    focus: document.activeElement && document.activeElement.name,
    checked: document.getElementById('order-consent').checked,
  }));
  check('sem consentimento: envio bloqueado, erro visível, checkbox desmarcado', blocked.send && blocked.consentErr && !blocked.checked);
  check('endereço obrigatório só em domicilio, com foco no campo', blocked.addrErr && blocked.focus === 'direccion');
  await page.fill('input[name="nombre"]', 'Lucía');
  await page.fill('input[name="direccion"]', 'Calle Real 100, San Fernando');
  await page.fill('input[name="hora"]', '21:15');
  await page.fill('textarea[name="notas"]', 'Cortada en 8 porciones');
  await page.fill('textarea[name="alergias"]', 'Frutos secos');
  await page.click('#order-form button[type="submit"]');
  check('com endereço mas sem consentimento continua bloqueado', await page.evaluate(() => document.getElementById('send-panel').hidden && document.activeElement.id === 'order-consent'));
  await page.check('#order-consent');
  await page.click('#order-form button[type="submit"]');
  await page.waitForTimeout(200);
  const text = await page.inputValue('#order-text');
  const expect = [
    "PEDIDO PARA NELLO'S", 'Modalidad: A domicilio', 'Nombre: Lucía', 'Dirección de entrega: Calle Real 100, San Fernando',
    'Hora deseada: 21:15', '2 x Margherita (mediana) — 15,00', '1 x Margherita (familiar) — 13,50',
    '1 x Maccheroni con salsa pesto genovese — 9,50', 'Subtotal orientativo: 38,00', 'Observaciones: Cortada en 8 porciones',
    'Alergias o intolerancias: Frutos secos', 'Pendiente de confirmación por el restaurante',
  ];
  const missing = expect.filter((e) => !text.replace(/\u00a0/g, ' ').includes(e));
  check('resumo gerado item a item (12 conferências)', missing.length === 0, missing.length ? 'faltou: ' + missing.join(' | ') : text.split('\n').length + ' linhas');
  check('resumo não diz "pedido confirmado"', !/pedido\s+confirmado/i.test(text));
  await page.click('#copy-order');
  await page.waitForTimeout(300);
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  check('Copiar resumo → área de transferência idêntica', clip === text, await page.textContent('#copy-status'));
  const links = await page.evaluate(() => ({
    mail: document.getElementById('mail-order').getAttribute('href'),
    tels: [...document.querySelectorAll('#send-panel a[href^="tel:"]')].map((a) => a.getAttribute('href')),
    wa: document.getElementById('wa-order').hidden,
    apps: [...document.querySelectorAll('#send-panel .send-apps a')].map((a) => new URL(a.href).hostname),
  }));
  check('mailto com assunto e corpo preenchidos', /^mailto:trattoriapizzerianellos@gmail\.com\?subject=.+&body=PEDIDO%20PARA/.test(links.mail));
  check('tel: fixo e móvel oficiais', links.tels.join() === 'tel:+34856942129,tel:+34613545303', links.tels.join(' '));
  check('WhatsApp oculto (número oficial não confirmado)', links.wa);
  check('links diretos Just Eat · Uber Eats · Glovo', links.apps.join() === 'www.just-eat.es,www.ubereats.com,glovoapp.com', links.apps.join(' '));

  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'e2e-drawer-1440.png') });
  await axeScan(page, 'gaveta aberta com resumo');

  await page.uncheck('#order-consent');
  check('desmarcar consentimento esconde o resumo', await page.evaluate(() => document.getElementById('send-panel').hidden && !document.getElementById('order-text').value));

  const stored = await page.evaluate(() => localStorage.getItem('nellos-pedido-v1') || '');
  check('rascunho salvo só com platos e modalidade', /"mode":"domicilio"/.test(stored) && /cl-margherita/.test(stored) && !/Lucía|Calle Real|Frutos|Cortada/.test(stored), stored.slice(0, 120));

  await page.keyboard.press('Escape');
  check('Esc fecha a gaveta', !(await page.evaluate(() => document.getElementById('pedido-drawer').open)));

  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  const restored = await page.evaluate(() => ({
    lines: document.querySelectorAll('#cart-lines .line').length,
    nombre: document.querySelector('input[name="nombre"]').value,
    mode: document.querySelector('input[name="mode"]:checked').value,
  }));
  check('recarregar restaura o pedido sem dados pessoais', restored.lines === 3 && restored.nombre === '' && restored.mode === 'domicilio', JSON.stringify(restored));

  await page.click('.cart-btn');
  await page.click('#cart-clear');
  await page.click('#clear-yes');
  check('Vaciar pedido com confirmação', await page.evaluate(() => !document.querySelectorAll('#cart-lines .line').length && !document.getElementById('cart-empty').hidden && document.getElementById('cart-fab').hidden));
  await page.keyboard.press('Escape');

  // galeria
  await page.click('.g-fig .g-btn >> nth=0');
  await page.waitForTimeout(150);
  const lb1 = await page.evaluate(() => ({ open: document.getElementById('lightbox').open, img: !!document.querySelector('#lb-fig img[alt]'), n: document.getElementById('lb-count').textContent }));
  await page.keyboard.press('ArrowRight');
  const lb2 = await page.textContent('#lb-count');
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'e2e-lightbox-1440.png') });
  await page.keyboard.press('Escape');
  const lbFocus = await page.evaluate(() => ({ open: document.getElementById('lightbox').open, focus: document.activeElement.className }));
  check('galeria: abre, seta → muda foto, Esc fecha e devolve o foco', lb1.open && lb1.img && lb1.n === '1 / 11' && lb2 === '2 / 11' && !lbFocus.open && lbFocus.focus === 'g-btn', `${lb1.n} → ${lb2}`);

  // textos legais
  await page.click('footer a[href="#privacy"]');
  const priv = await page.evaluate(() => document.getElementById('privacy').matches(':modal') && /RGPD/.test(document.getElementById('privacy').innerText));
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'e2e-privacy-1440.png') });
  await axeScan(page, 'política de privacidade aberta');
  await page.keyboard.press('Escape');
  await page.click('footer a[href="#terms"]');
  const terms = await page.evaluate(() => document.getElementById('terms').matches(':modal') && /B10872992/.test(document.getElementById('terms').innerText));
  await page.click('#terms [data-close-dialog]');
  check('Política de privacidade e Aviso legal abrem como modal e fecham', priv && terms && !(await page.evaluate(() => document.getElementById('terms').open)));

  check('CSP de produção ativa e sem nenhuma violação', !!prodHeaders['Content-Security-Policy'] && !errors.some((e) => /Content Security Policy|CSP/i.test(e)), prodHeaders['Content-Security-Policy'] ? 'default-src \'none\' …' : 'sem CSP');
  check('0 erro de JavaScript (desktop)', errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

/* =================================================================
   2. ACESSIBILIDADE — página inteira + pausa de animações
   ================================================================= */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await axeScan(page, 'página inteira (desktop)');
  await ctx.close();

  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage();
  await p2.goto(URL_, { waitUntil: 'load' });
  await p2.waitForTimeout(800);
  const running = () => p2.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.getTiming().iterations === Infinity).length);
  const before = await running();
  await p2.click('#hdr [data-motion-toggle]');
  await p2.waitForTimeout(200);
  const paused = await running();
  const pressed = await p2.getAttribute('#hdr [data-motion-toggle]', 'aria-pressed');
  await p2.click('#hdr [data-motion-toggle]');
  await p2.waitForTimeout(200);
  const resumed = await running();
  check('botão pausa todas as animações em loop e retoma (WCAG 2.2.2)', before >= 8 && paused === 0 && pressed === 'true' && resumed === before, `${before} → ${paused} → ${resumed}`);
  await ctx2.close();
}

/* =================================================================
   3. MOBILE 390 — menu, filtros compactos, botão flutuante, gaveta
   ================================================================= */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL_, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#nav-toggle');
  const navOpen = await page.evaluate(() => !document.getElementById('mobile-nav').hidden && document.getElementById('nav-toggle').getAttribute('aria-expanded') === 'true' && document.activeElement.closest('#mobile-nav') !== null && document.querySelector('main').inert);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'e2e-mnav-390.png') });
  await page.click('#mobile-nav a[href="#carta"]');
  await page.waitForTimeout(400);
  const navClosed = await page.evaluate(() => document.getElementById('mobile-nav').hidden && !document.querySelector('main').inert);
  check('menu móvel abre (foco dentro, fundo inerte) e fecha ao navegar', navOpen && navClosed);

  check('filtros compactos no celular (busca recolhida)', !(await page.isVisible('#menu-search')));
  await page.click('#tools-more');
  check('lupa expande busca e filtros', await page.isVisible('#menu-search') && (await page.getAttribute('#tools-more', 'aria-expanded')) === 'true');
  await page.click('#tools-more');

  await page.click('#plato-esp-tricolore button.buy');
  await page.waitForTimeout(150);
  check('botão flutuante mostra 1 · 14,50 €', eur(await page.textContent('#cart-fab')).includes('1') && eur(await page.textContent('#cart-fab')).includes('14,50 €'));
  await page.click('#cart-fab');
  await page.waitForTimeout(200);
  const dims = await page.evaluate(() => ({ w: document.getElementById('pedido-drawer').getBoundingClientRect().width, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  check('gaveta ocupa a tela toda no celular, sem scroll horizontal', dims.w === 390 && dims.sw === dims.cw, JSON.stringify(dims));
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'e2e-drawer-390.png') });
  await axeScan(page, 'gaveta no celular');
  await page.keyboard.press('Escape');
  await axeScan(page, 'página inteira (celular)');
  check('0 erro de JavaScript (celular)', errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

/* =================================================================
   4. SEM JAVASCRIPT — conteúdo e textos legais acessíveis
   ================================================================= */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'load' });
  const nojs = await page.evaluate(() => {
    const vis = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.1 && r.width > 0 && r.height > 0; };
    return {
      dishes: [...document.querySelectorAll('.dish')].filter(vis).length,
      prices: [...document.querySelectorAll('[data-buy]')].filter(vis).length,
      buttons: document.querySelectorAll('button.buy').length,
      jsOnlyVisible: [...document.querySelectorAll('.js-only')].filter(vis).length,
      noscript: /Para pedir, llama al/.test(document.body.innerText),
      privacy: vis(document.getElementById('privacy')) && /Responsable/.test(document.getElementById('privacy').innerText),
      terms: vis(document.getElementById('terms')),
      hiddenHeads: [...document.querySelectorAll('.sec-head h2,.sec-label,.stat,.step,.quote')].filter((e) => !vis(e)).length,
      tel: !!document.querySelector('#hdr a[href="tel:+34856942129"]') && vis(document.querySelector('#hdr a[href="tel:+34856942129"]')),
    };
  });
  check('sem JS: 60 platos e 88 preços visíveis, sem botões inertes', nojs.dishes === 60 && nojs.prices === 88 && nojs.buttons === 0 && nojs.jsOnlyVisible === 0, JSON.stringify({ d: nojs.dishes, p: nojs.prices, b: nojs.buttons, js: nojs.jsOnlyVisible }));
  check('sem JS: aviso de pedido por telefone e botão Llamar no topo', nojs.noscript && nojs.tel);
  check('sem JS: privacidade e aviso legal legíveis na página', nojs.privacy && nojs.terms);
  check('sem JS: nenhum conteúdo escondido à espera de animação', nojs.hiddenHeads === 0, `${nojs.hiddenHeads} ocultos`);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'e2e-nojs-1440.png') });
  await ctx.close();
}

await browser.close();
server.close();

/* relatório */
const pad = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n));
console.log('\n  QA E2E · Nello\'s · ' + path.relative(process.cwd(), file));
console.log('  ' + '─'.repeat(96));
for (const r of results) console.log(`  ${r.ok ? '✓' : '✗'} ${pad(r.name, 66)} ${r.info ? '· ' + String(r.info).slice(0, 120) : ''}`);
console.log('  ' + '─'.repeat(96));
const failed = results.filter((r) => !r.ok);
console.log(`  ${results.length - failed.length}/${results.length} verificações passaram` + (failed.length ? ` · ${failed.length} falharam` : ''));
console.log(failed.length ? '\n  ✗ FAIL\n' : '\n  ✓ PASS — fluxo funcional verificado\n');
process.exit(failed.length ? 1 : 0);
