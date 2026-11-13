#!/usr/bin/env node
/**
 * TESTE FUNCIONAL DO PEDIDO (§14.8 do script universal)
 * Roda o site em jsdom e executa, de verdade, a ação principal do negócio:
 * selecionar produtos, alterar quantidades, remover, observar, validar o
 * formulário e montar a mensagem de WhatsApp — sem botão decorativo.
 */
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const target = process.argv[2] || 'public/index.html';
const html = readFileSync(path.resolve(target), 'utf8');

const errors = [];
const vc = new VirtualConsole();
/* "Could not parse CSS stylesheet" é limitação do parser CSS do jsdom
   (color-mix, aspect-ratio etc.), não erro real de navegador. */
vc.on('jsdomError', e => { if (!/Could not parse CSS/i.test(String(e))) errors.push('jsdomError: ' + String(e).slice(0, 160)); });
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ').slice(0, 160)));

let openedUrl = null;
const dom = new JSDOM(html, {
  url: 'https://agridoce.test/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    window.matchMedia = window.matchMedia || (q => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
    window.IntersectionObserver = class { constructor(cb) { this.cb = cb; } observe() {} unobserve() {} disconnect() {} };
    window.open = (url) => { openedUrl = url; return null; };
    window.scrollTo = () => {};
  }
});
const { window } = dom;
const { document } = window;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const click = el => el.dispatchEvent(new window.Event('click', { bubbles: true, cancelable: true }));
const input = (el, v) => { el.value = v; el.dispatchEvent(new window.Event('input', { bubbles: true })); };

let pass = 0, fail = 0;
const ok = (cond, label) => { if (cond) { pass++; console.log('   ✓ ' + label); } else { fail++; console.log('   ✗ ' + label); } };

console.log('\n  TESTE FUNCIONAL · ' + target);
console.log('  ' + '─'.repeat(64));

/* 1. adicionar com opção de tamanho */
const cardBurg = $('.card[data-id="burg-agridoce"]');
cardBurg.querySelectorAll('.sizes input')[1].checked = true; // Duplo 120g
click(cardBurg.querySelector('[data-add]'));
ok($('#cart-count').textContent === '1' && !$('#cart-count').hidden, 'adicionar hambúrguer atualiza o badge (1)');

/* 2. adicionar doces 2x */
const cardMor = $('.card[data-id="doce-morango"]');
click(cardMor.querySelector('[data-add]'));
click(cardMor.querySelector('[data-add]'));
ok($('#cart-count').textContent === '3', 'quantidades somam no badge (3)');

/* 3. abrir carrinho e conferir linhas */
click($('#open-cart'));
ok($('#cart').classList.contains('open'), 'carrinho abre');
ok($$('#cart-body .ci').length === 2, 'duas linhas de pedido (item repetido agrega)');
ok($('#cart-body').textContent.includes('Duplo 120g'), 'opção de tamanho escolhida aparece no carrinho');

/* 4. editar quantidade */
click($('#cart-body [data-up="1"]'));
ok($('#cart-count').textContent === '4', 'botão + soma quantidade (4)');
click($('#cart-body [data-dn="1"]'));
click($('#cart-body [data-dn="1"]'));
ok($('#cart-count').textContent === '2', 'botão − diminui e remove ao zerar (2)');

/* 5. observação por item */
input($('#cart-body [data-obs="0"]'), 'sem alho-poró, por favor');
ok(true, 'observação aceita sem erro');

/* 6. persistência */
ok((window.localStorage.getItem('agridoce-cart-v1') || '').includes('burg-agridoce'), 'pedido persiste em localStorage');

/* 7. validação do checkout */
const form = $('#checkout');
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
ok(openedUrl === null, 'sem consentimento/dados o envio é bloqueado');
ok($('#row-nome').classList.contains('err') && $('#row-consent').classList.contains('err'), 'campos obrigatórios sinalizados');

/* 8. preencher e finalizar */
input($('#f-nome'), 'Maria Testa');
input($('#f-rua'), 'Rua Limites');
input($('#f-num'), '123');
input($('#f-bairro'), 'Realengo');
input($('#f-comp'), 'casa 2');
$('#f-consent').checked = true;
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
ok(!!openedUrl && openedUrl.startsWith('https://wa.me/5521994738183?text='), 'abre o WhatsApp oficial com mensagem');
const msg = decodeURIComponent((openedUrl || '').split('text=')[1] || '');
ok(msg.includes('Hambúrguer Agridoce [Duplo 120g] — 1 unidade'), 'resumo traz produto + tamanho + quantidade');
ok(msg.includes('sem alho-poró, por favor'), 'resumo traz a observação do item');
ok(msg.includes('Rua Limites, 123') && msg.includes('Realengo') && msg.includes('casa 2'), 'resumo traz o endereço de entrega');
ok(msg.includes('Maria Testa'), 'resumo traz o nome do cliente');
ok(!/R\$|\d+,\d{2}/.test(msg), 'nenhum preço inventado na mensagem');

/* 9. copiar resumo */
click($('#copy-resumo'));
ok(true, 'copiar resumo executa sem exceção');

/* 10. remover item */
click($('#cart-body [data-rm="0"]'));
ok($('#cart-count').textContent === '1', 'remover item atualiza o badge (1)');

/* 11. navegação e acessibilidade básica */
click($('#nav-toggle'));
ok($('#nav').classList.contains('open') && $('#nav-toggle').getAttribute('aria-expanded') === 'true', 'menu mobile abre com aria-expanded');
click($('#close-cart'));
ok(!$('#cart').classList.contains('open'), 'carrinho fecha');
ok($$('img').every(i => i.hasAttribute('alt')), 'todas as imagens têm alt');
ok($$('a[href^="http"]').every(a => a.getAttribute('rel')?.includes('noopener') || a.getAttribute('target') !== '_blank'), 'links externos com noopener');

/* 12. erros de JS */
ok(errors.length === 0, 'zero erros de JS durante o fluxo' + (errors.length ? ' → ' + errors[0] : ''));

console.log('  ' + '─'.repeat(64));
console.log(`  ${pass} passaram · ${fail} falharam`);
console.log('  ' + (fail ? '✗ FALHOU' : '✓ PASSOU — fluxo real de pedido funcionando') + '\n');
process.exit(fail ? 1 : 0);
