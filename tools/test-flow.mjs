#!/usr/bin/env node
/** Teste funcional do fluxo de pedido em jsdom (sem navegador gráfico).
 *  Verifica: adicionar, somar, diminuir, remover, modalidade, observações,
 *  consentimento, resumo copiado e abertura/fechamento do carrinho.
 */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const copied = [];
const errors = [];
const dom = new JSDOM(html, {
  url: 'https://pizzeria-napolitana-site.vercel.app/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  beforeParse(win) {
    win.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    win.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    win.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 0);
    win.cancelAnimationFrame = clearTimeout;
    Object.defineProperty(win.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: text => { copied.push(text); return Promise.resolve(); } }
    });
    win.addEventListener('error', e => errors.push(e.message));
  }
});
const { window } = dom;
const { document } = window;
await new Promise(r => window.addEventListener('load', r, { once: true }));
await new Promise(r => setTimeout(r, 60));

const $ = s => document.querySelector(s);
const results = [];
function check(name, condition, detail = '') {
  results.push({ name, ok: !!condition, detail });
  if (!condition) errors.push(name + (detail ? ' → ' + detail : ''));
}
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

// 1. cardápio → pedido
check('cardápio renderiza 4 itens', document.querySelectorAll('.serv').length === 4);
click($('[data-add="salchipizza"]'));
check('adicionar 1 item atualiza badge', $('#cartCountHeader').textContent === '1', $('#cartCountHeader').textContent);
check('item aparece no carrinho', $('#cartItems').textContent.includes('Salchipizza'));
click($('[data-add="salchipizza"]'));
check('adicionar novamente soma quantidade', $('#cartCountHeader').textContent === '2');
click($('[data-add="carbonara"]'));
check('segundo sabor entra no pedido', $('#cartCountHeader').textContent === '3');

// 2. edição
click($('[data-dec="salchipizza"]'));
check('diminuir quantidade funciona', $('#cartCountHeader').textContent === '2');
click($('[data-remove="carbonara"]'));
check('remover item funciona', $('#cartCountHeader').textContent === '1' && !$('#cartItems').textContent.includes('Carbonara'));

// 3. filtro de categorias
click($('[data-filter="novidade"]'));
check('filtro mostra só novidade', [...document.querySelectorAll('.serv')].filter(e => !e.hidden).length === 1);
click($('[data-filter="all"]'));
check('filtro tudo restaura cardápio', [...document.querySelectorAll('.serv')].filter(e => !e.hidden).length === 4);

// 4. modalidade, observação, consentimento e resumo
const radios = document.querySelectorAll('input[name="modality"]');
radios[1].checked = true;
$('#cartNotes').value = 'Sem cebola; retirar às 20h';
click($('#copyOrder'));
check('envio bloqueado sem consentimento', copied.length === 0, 'copiados: ' + copied.length);
$('#cartConsent').checked = true;
click($('#copyOrder'));
await new Promise(r => setTimeout(r, 30));
const msg = copied[0] || '';
check('resumo copiado uma vez', copied.length === 1, 'copiados: ' + copied.length);
check('resumo contém quantidade e item', /1 × Salchipizza/.test(msg), msg.slice(0, 120));
check('resumo contém modalidade escolhida', msg.includes('Retirada no Mercado Municipal'));
check('resumo contém observação', msg.includes('Sem cebola; retirar às 20h'));
check('resumo não afirma pedido confirmado', !/confirmado|confirmada/i.test(msg.replace(/confirmação pelo atendimento/i, '')));
check('resumo informa valor a confirmar', /a confirmar pela pizzaria/i.test(msg));

// 5. abrir/fechar carrinho
click($('#openCartHeader'));
check('carrinho abre', $('#cart').classList.contains('open'));
document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('Esc fecha carrinho', !$('#cart').classList.contains('open'));

// 6. persistência
check('pedido salvo localmente', JSON.parse(window.localStorage.getItem('pizzaria-napolitana-pedido') || '{}').salchipizza === 1);

const pad = (s, n) => String(s).padEnd(n);
console.log('\n  TESTE FUNCIONAL DO PEDIDO — jsdom');
console.log('  ' + '─'.repeat(64));
results.forEach(r => console.log('  ' + (r.ok ? '✓' : '✗') + ' ' + pad(r.name, 46) + (r.ok ? '' : r.detail)));
console.log('  ' + '─'.repeat(64));
console.log(`  ${results.filter(r => r.ok).length}/${results.length} verificações passaram`);
if (errors.length) { console.log('\n  ✗ FAIL\n' + errors.map(e => '    · ' + e).join('\n') + '\n'); process.exit(1); }
console.log('\n  ✓ PASS — fluxo funcional verificado\n');
dom.window.close();
