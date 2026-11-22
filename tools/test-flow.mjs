#!/usr/bin/env node
/* Teste funcional do site em jsdom: DOM, carrinho, filtro, consentimento e cópia. */
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const file = process.argv[2] || 'public/index.html';
const html = readFileSync(file, 'utf8');

const results = [];
const ok = (name, pass, extra = '') => {
  results.push({ name, pass, extra });
  console.log(`  ${pass ? '✓' : '✗'} ${name}${extra ? '  — ' + extra : ''}`);
};

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/',
  beforeParse(win) {
    win.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; }
      observe(el) { this.cb([{ isIntersecting: true, target: el }], this); }
      unobserve() {}
      disconnect() {}
    };
    win.matchMedia = win.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    let copied = '';
    win.navigator.clipboard = { writeText: (t) => { copied = t; win.__copied = t; return Promise.resolve(); } };
    win.__copied = copied;
    win.requestAnimationFrame = (cb) => setTimeout(() => cb(16), 0);
    win.scrollTo = () => {};
    win.console.error = (...a) => { win.__errors = (win.__errors || []).concat(a.join(' ')); };
  }
});

const { window } = dom;
const { document } = window;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const click = (el) => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));

await new Promise((r) => {
  if (document.readyState === 'complete') r();
  else window.addEventListener('load', r);
});
await wait(60);

/* ---------- estrutura ---------- */
ok('HTML tem lang=pt-BR', document.documentElement.lang === 'pt-BR');
ok('título presente', /Pizzeria Napolitana/.test(document.title));
ok('um único <h1>', $$('h1').length === 1);
const ids = $$('[id]').map((e) => e.id);
ok('nenhum id duplicado', new Set(ids).size === ids.length, ids.length + ' ids');
ok('todas as imagens têm alt', $$('img').every((i) => i.hasAttribute('alt')));
ok('link de pular navegação existe', !!$('.skip'));

/* ---------- estado inicial ---------- */
ok('contador começa em 0', $('#cartCount').textContent.trim() === '0');
ok('carrinho começa vazio', !$('#cartEmpty').hidden && $('#cartForm').hidden);
ok('botão copiar desabilitado', $('#copyOrder').disabled);

/* ---------- adicionar ---------- */
click($('[data-add="salchipizza"]'));
await wait();
ok('adicionar incrementa contador', $('#cartCount').textContent.trim() === '1');
ok('drawer abre ao adicionar', $('#drawer').classList.contains('open'));
ok('drawer aria-hidden=false', $('#drawer').getAttribute('aria-hidden') === 'false');
ok('formulário aparece com item', !$('#cartForm').hidden && $('#cartEmpty').hidden);
ok('lista mostra o sabor', /Salchipizza/.test($('#cartItems').textContent));
ok('resumo mostra 1 item', /1 item/.test($('#summaryItems').textContent));

/* ---------- quantidades ---------- */
const plus = $('#cartItems .qty button:last-child');
click(plus);
await wait();
ok('botão + soma quantidade', $('#cartCount').textContent.trim() === '2');
const minus = $('#cartItems .qty button:first-child');
click(minus);
await wait();
ok('botão − subtrai quantidade', $('#cartCount').textContent.trim() === '1');

/* ---------- observações + modalidade ---------- */
const notes = $('#notes');
notes.value = 'Sem cebola, retirar às 20h30';
notes.dispatchEvent(new window.Event('input', { bubbles: true }));
const modeKebab = $$('input[name="mode"]')[1];
modeKebab.checked = true;
modeKebab.dispatchEvent(new window.Event('change', { bubbles: true }));
await wait();
ok('observação aceita texto', $('#notes').value.includes('Sem cebola'));

/* ---------- consentimento ---------- */
ok('copiar bloqueado sem consentimento', $('#copyOrder').disabled);
$('#cartConsent').checked = true;
$('#cartConsent').dispatchEvent(new window.Event('change', { bubbles: true }));
await wait();
ok('copiar liberado após consentimento', !$('#copyOrder').disabled);

click($('#copyOrder'));
await wait(80);
const copied = window.__copied || '';
ok('resumo copiado contém itens', /1× Salchipizza/.test(copied), JSON.stringify(copied.slice(0, 48)));
ok('resumo copiado contém observações', /Sem cebola/.test(copied));
ok('resumo copiado contém modalidade', /Para levar/.test(copied));
ok('resumo não afirma confirmação', /não confirmado|não foi confirmado|a confirmar/i.test(copied));

/* ---------- persistência ---------- */
await wait();
const stored = JSON.parse(window.localStorage.getItem('napolitana:order:v1') || '{}');
ok('pedido persistido no localStorage', stored.items && stored.items.salchipizza === 1);

/* ---------- filtro ---------- */
const chips = $$('.chip');
click(chips[1]); /* novidade */
await wait();
const visiveis = $$('.dish').filter((d) => !d.hidden);
ok('filtro deixa só novidades', visiveis.length === 1 && visiveis[0].dataset.cat === 'novidade');
click(chips[0]);
await wait();
ok('filtro "todos" restaura', $$('.dish').filter((d) => !d.hidden).length === $$('.dish').length);

/* ---------- fechar drawer / teclado ---------- */
click($('#closeCart'));
await wait();
ok('fechar drawer funciona', !$('#drawer').classList.contains('open'));
ok('overlay fecha junto', !$('#overlay').classList.contains('open'));
$('#drawer').classList.add('open');
document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
await wait();
ok('Escape fecha o drawer', !$('#drawer').classList.contains('open'));

/* ---------- remover item ---------- */
click($('[data-open-cart]'));
await wait();
click($('#cartItems .ci-rm'));
await wait();
ok('remover zera o pedido', $('#cartCount').textContent.trim() === '0' && !$('#cartEmpty').hidden);

/* ---------- conteúdo e honestidade ---------- */
const text = document.body.textContent;
ok('não promete pedido confirmado', !/pedido confirmado|confirmação automática|compra realizada/i.test(text));
ok('não inventa WhatsApp', !/wa\.me|api\.whatsapp|whatsapp\.com/i.test(html));
ok('exibe valor a confirmar', /a confirmar/i.test(text));
ok('link telefônico correto', $('a[href^="tel:+34627661061"]') !== null);
ok('política e termos linkados', !!$('a[href="#privacidade"]') && !!$('a[href="#termos"]'));
ok('prefers-reduced-motion no CSS', /prefers-reduced-motion:reduce/.test(html));
ok('sem erro de script no console', !window.__errors, window.__errors ? window.__errors.slice(0, 120) : '');

const failed = results.filter((r) => !r.pass);
console.log(`\n  ${results.length - failed.length}/${results.length} verificações ok` + (failed.length ? ` — ${failed.length} FALHA(S)` : ' — PASS'));
process.exit(failed.length ? 1 : 0);
