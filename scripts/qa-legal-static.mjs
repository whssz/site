#!/usr/bin/env node
/**
 * QA LEGAL · MODO ESTÁTICO (jsdom) — mesmo espírito do tools/qa-legal.mjs,
 * para ambientes sem navegador (sandbox sem CDN do Chromium).
 * Cobre os checáveis por máquina: lang/title/desc, alt, dado fictício,
 * links legais, consentimento, trackers, promessas sem prova.
 * Contraste e foco (que pedem layout) ficam em revisão manual documentada.
 */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const target = process.argv[2];
if (!target) { console.error('uso: node scripts/qa-legal-static.mjs <arquivo>'); process.exit(2); }
const html = readFileSync(path.resolve(target), 'utf8');

const dom = new JSDOM(html, { url: 'https://agridoce.test/' });
const { document } = dom.window;
const R = { blocking: [], warn: [], info: [] };
const txt = document.body.textContent;

/* 1. estrutura */
const lang = document.documentElement.lang || '';
const title = (document.title || '').trim();
const desc = document.querySelector('meta[name="description"]')?.content?.trim() || '';
if (!lang) R.blocking.push('falta <html lang>');
if (!title) R.blocking.push('falta <title>');
if (!desc) R.warn.push('falta meta description');
R.info.push(`lang=${lang} · title="${title.slice(0, 52)}"`);

/* 2. alt */
const imgs = [...document.querySelectorAll('img')];
const missing = imgs.filter(i => !i.hasAttribute('alt'));
const useless = imgs.filter(i => {
  const a = (i.getAttribute('alt') || '').trim().toLowerCase();
  return ['imagem', 'image', 'foto', 'photo'].includes(a) || /\.(jpe?g|png|webp|svg)$/.test(a);
});
if (missing.length) R.blocking.push(`${missing.length} imagem(ns) sem alt`);
if (useless.length) R.warn.push(`${useless.length} alt genérico`);
R.info.push(`imagens: ${imgs.length} · sem alt: ${missing.length} · genérico: ${useless.length}`);

/* 3. dado fictício */
const hits = [];
if (/00\.?000\.?000\/?0001-?00/.test(txt)) hits.push('CNPJ de exemplo');
if (/seuemail@exemplo\.com|contato@exemplo/i.test(html)) hits.push('e-mail de exemplo');
if (/\(?11\)?\s?99999-?9999|\(?00\)?\s?0000-?0000/.test(txt)) hits.push('telefone de exemplo');
if (/Rua Exemplo|Avenida Exemplo/i.test(txt)) hits.push('endereço de exemplo');
if (/SEUNUMERO|55SEUNUMERO/.test(html)) hits.push('placeholder wa.me');
const brandCtx = [title, ...[...document.querySelectorAll('header,footer,h1')].map(e => e.textContent || '')].join(' ');
if (/Seu Nome|Sua Empresa|Nome da Empresa|Sua Marca/i.test(brandCtx)) hits.push('marca de exemplo');
if (hits.length) R.blocking.push('dado fictício: ' + hits.join(', '));
R.info.push('dado fictício: ' + (hits.length ? hits.join(', ') : 'nenhum'));

/* 4. links legais */
const els = [...document.querySelectorAll('a,button')];
const has = re => els.some(e => re.test((e.textContent || '') + ' ' + (e.getAttribute('href') || '')));
const priv = has(/privacidade|privacy/i), termos = has(/termos|terms/i), cookies = has(/cookies/i), reemb = has(/reembolso|devolu|arrependiment/i);
if (!priv) R.warn.push('sem link de Política de Privacidade');
if (!termos) R.warn.push('sem link de Termos de Uso');
R.info.push(`legais: privacidade=${priv} termos=${termos} cookies=${cookies} reembolso=${reemb}`);

/* 5. consentimento */
const fields = [...document.querySelectorAll('input,textarea,select')].filter(f => !['hidden', 'checkbox', 'radio', 'submit', 'button'].includes(f.type));
const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
const consent = boxes.find(c => /consent|concord|lgpd|privacidade|aceit/i.test((c.closest('label')?.textContent || '') + ' ' + (c.id || '')));
if (fields.length && !consent) R.warn.push(`formulário com ${fields.length} campo(s) e nenhum consentimento`);
if (consent && consent.checked) R.blocking.push('consentimento pré-marcado');
R.info.push(`formulário: ${fields.length} campo(s) · consentimento: ${consent ? 'sim (desmarcado)' : 'não'}`);

/* 6. trackers */
const trackers = [];
if (/googletagmanager|gtag\(|analytics\.google/i.test(html)) trackers.push('GA4/GTM');
if (/fbq\(|fbevents/i.test(html)) trackers.push('Meta Pixel');
if (/hotjar|clarity\.ms/i.test(html)) trackers.push('heatmap');
const banner = [...document.querySelectorAll('[id*="cookie" i],[class*="cookie" i]')].some(e => /cookie/i.test(e.textContent || ''));
if (trackers.length && !banner) R.blocking.push('tracker sem banner de cookies');
if (!trackers.length && banner) R.warn.push('banner de cookies sem tracker');
R.info.push(`trackers: ${trackers.length ? trackers.join(',') : 'nenhum'} · banner: ${banner ? 'sim' : 'não'}`);

/* 9. promessas sem prova */
const pats = [/resultados? garantidos?/i, /100%\s*(de\s*)?(sucesso|eficaz|garantido)/i, /garantia (total|absoluta|de resultado)/i, /melhor (do mundo|da cidade)/i, /resultados? em \d+\s*(horas?|dias?)/i, /sem risco/i];
const claims = pats.filter(p => p.test(txt)).map(p => p.source);
if (claims.length) R.warn.push('promessa sem prova: ' + claims.join(' | '));
R.info.push('promessas sem prova: ' + (claims.length ? claims.join(' | ') : 'nenhuma'));

/* extra: canais reais */
const wa = (html.match(/wa\.me\/(\d+)/g) || []);
R.info.push('links wa.me: ' + (wa.length ? [...new Set(wa)].join(', ') : 'nenhum'));

console.log('\n  QA LEGAL (estático/jsdom) · ' + target);
console.log('  ' + '─'.repeat(64));
R.info.forEach(i => console.log('   · ' + i));
if (R.blocking.length) { console.log('\n  ✗ BLOQUEANTE'); R.blocking.forEach(b => console.log('    ! ' + b)); }
if (R.warn.length) { console.log('\n  ⚠ ALERTA'); R.warn.forEach(w => console.log('    - ' + w)); }
if (!R.blocking.length && !R.warn.length) console.log('\n  ✓ Nada pendente.');
console.log('\n  ' + (R.blocking.length ? '✗ FALHOU' : '✓ PASSOU') + '\n');
process.exit(R.blocking.length ? 1 : 0);
