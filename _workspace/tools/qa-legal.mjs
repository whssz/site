#!/usr/bin/env node
/**
 * QA LEGAL / ACESSIBILIDADE — verifica o que é verificável por máquina.
 *
 * Complementa o tools/qa.mjs (que cuida de animação e layout).
 * Base normativa: CONFORMIDADE-E-LEGAL.md
 *
 * Uso:
 *   node tools/qa-legal.mjs migaica/index.html
 *   node tools/qa-legal.mjs https://site.vercel.app --strict
 *
 * BLOQUEIA (exit 1): lang/title ausente · imagem sem alt · dado de exemplo
 *                    (CNPJ/telefone fictício)
 * ALERTA (não bloqueia, mas vai no relatório): o resto.
 * Com --strict, alerta também derruba.
 */
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const target = args.find(a => !a.startsWith('--'));
const STRICT = args.includes('--strict');

if (!target) {
  console.error('uso: node tools/qa-legal.mjs <arquivo-ou-url> [--strict]');
  process.exit(2);
}
if (!/^https?:\/\//.test(target) && !existsSync(target)) {
  console.error('arquivo não encontrado:', target);
  process.exit(2);
}
const url = /^https?:\/\//.test(target) ? target : pathToFileURL(path.resolve(target)).href;

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(1000);

const R = { blocking: [], warn: [], info: [] };

/* ---------- 1. estrutura mínima ---------- */
const head = await page.evaluate(() => ({
  lang: document.documentElement.lang || '',
  title: (document.title || '').trim(),
  desc: (document.querySelector('meta[name="description"]')?.content || '').trim(),
}));
if (!head.lang) R.blocking.push('falta <html lang="pt-BR">');
if (!head.title) R.blocking.push('falta <title>');
if (!head.desc) R.warn.push('falta meta description');
R.info.push(`lang=${head.lang || '—'} · title="${head.title.slice(0, 48)}"`);

/* ---------- 2. alt nas imagens ---------- */
const imgs = await page.evaluate(() => {
  const all = [...document.querySelectorAll('img')];
  const missing = all.filter(i => !i.hasAttribute('alt'));
  const useless = all.filter(i => {
    const a = (i.getAttribute('alt') || '').trim().toLowerCase();
    return a === 'imagem' || a === 'image' || a === 'foto' || a === 'photo' || /\.(jpe?g|png|webp|svg)$/.test(a);
  });
  return {
    total: all.length,
    missing: missing.length,
    missingSrc: missing.slice(0, 4).map(i => (i.currentSrc || i.src || '').slice(-60)),
    useless: useless.length,
    uselessAlt: useless.slice(0, 3).map(i => i.getAttribute('alt')),
  };
});
if (imgs.missing > 0) R.blocking.push(`${imgs.missing} de ${imgs.total} imagem(ns) sem alt — ex.: ${imgs.missingSrc.join(' | ')}`);
if (imgs.useless > 0) R.warn.push(`${imgs.useless} alt genérico ("imagem"/"foto") — ex.: ${imgs.uselessAlt.join(', ')}`);
R.info.push(`imagens: ${imgs.total} · sem alt: ${imgs.missing}`);

/* ---------- 3. dados de exemplo no ar ---------- */
const fake = await page.evaluate(() => {
  const txt = document.body.innerText;
  const html = document.documentElement.innerHTML;
  const hits = [];
  if (/00\.?000\.?000\/?0001-?00/.test(txt)) hits.push('CNPJ de exemplo');
  if (/seuemail@exemplo\.com|email@exemplo|contato@exemplo/i.test(html)) hits.push('e-mail de exemplo');
  if (/\(?11\)?\s?99999-?9999|\(?00\)?\s?0000-?0000/.test(txt)) hits.push('telefone de exemplo');
  if (/Rua Exemplo|Avenida Exemplo|logradouro/i.test(txt)) hits.push('endereço de exemplo');
  if (/SEUNUMERO|55SEUNUMERO/.test(html)) hits.push('placeholder de telefone no link (wa.me)');
  // "Seu Nome" só é problema quando é a MARCA do site (header/título/footer),
  // não quando é label de formulário pedindo o nome do cliente.
  const brandCtx = [
    document.title || '',
    ...[...document.querySelectorAll('header,footer,.brand,[class*="brand" i],h1')].map(e => e.innerText || '')
  ].join(' ');
  if (/Seu Nome|Sua Empresa|Nome da Empresa|Sua Marca/i.test(brandCtx)) hits.push('marca/empresa de exemplo no header, título ou footer');
  return hits;
});
if (fake.length) R.blocking.push(`dado fictício publicado: ${fake.join(', ')}`);

/* ---------- 4. termos e privacidade ---------- */
const legalLinks = await page.evaluate(() => {
  const els = [...document.querySelectorAll('a,button,[role="button"]')];
  const has = re => els.some(e => re.test((e.innerText || '') + ' ' + (e.getAttribute('href') || '')));
  return {
    privacidade: has(/privacidade|privacy/i),
    termos: has(/termos|termos de uso|terms/i),
    cookies: has(/cookies/i),
    reembolso: has(/reembolso|devolu|arrependiment/i),
  };
});
if (!legalLinks.privacidade) R.warn.push('nenhum link de Política de Privacidade encontrado');
if (!legalLinks.termos) R.warn.push('nenhum link de Termos de Uso encontrado');
R.info.push(`links legais: privacidade=${legalLinks.privacidade} termos=${legalLinks.termos} cookies=${legalLinks.cookies} reembolso=${legalLinks.reembolso}`);
if (legalLinks.reembolso) R.info.push('reembolso presente — confirme se o nicho realmente vende (senão é bloco fora de contexto)');

/* ---------- 5. consentimento em formulário ---------- */
const forms = await page.evaluate(() => {
  const fields = [...document.querySelectorAll('input,textarea,select')]
    .filter(f => !['hidden', 'checkbox', 'radio', 'submit', 'button'].includes(f.type));
  const checkboxes = [...document.querySelectorAll('input[type="checkbox"]')];
  const consent = checkboxes.find(c => {
    const label = (c.closest('label')?.innerText || '') + ' ' + (c.getAttribute('aria-label') || '') + ' ' + (c.name || '') + ' ' + (c.id || '');
    return /consent|concord|lgpd|privacidade|aceit/i.test(label);
  });
  return {
    fields: fields.length,
    hasConsent: !!consent,
    preChecked: consent ? consent.checked : null,
    consentRequired: consent ? consent.required : null,
  };
});
if (forms.fields > 0 && !forms.hasConsent) R.warn.push(`formulário com ${forms.fields} campo(s) de dado pessoal e nenhum checkbox de consentimento`);
if (forms.hasConsent && forms.preChecked) R.blocking.push('checkbox de consentimento já vem marcado — consentimento inválido');
if (forms.hasConsent && forms.consentRequired === false) R.warn.push('checkbox de consentimento sem atributo required');
R.info.push(`formulário: ${forms.fields} campo(s) · consentimento: ${forms.hasConsent ? 'sim' : 'não'}`);

/* ---------- 6. cookies vs trackers ---------- */
const trackers = await page.evaluate(() => {
  const html = document.documentElement.innerHTML;
  const found = [];
  if (/googletagmanager|gtag\(|analytics\.google/i.test(html)) found.push('GA4/GTM');
  if (/fbq\(|connect\.facebook\.net\/.*fbevents/i.test(html)) found.push('Meta Pixel');
  if (/hotjar|clarity\.ms|mouseflow/i.test(html)) found.push('heatmap');
  // barra de cookies = bloco que FALA de cookies. Checkbox de consentimento
  // de formulário não é banner (falso positivo já corrigido).
  const banner = [...document.querySelectorAll('[id*="cookie" i],[class*="cookie" i]')]
    .some(e => /cookie/i.test(e.innerText || '') && (e.innerText || '').length > 20);
  const stored = Object.keys(localStorage).some(k => /consent|cookie/i.test(k));
  return { found, banner, stored };
});
if (trackers.found.length && !trackers.banner) {
  R.blocking.push(`rastreamento instalado (${trackers.found.join(', ')}) sem barra de consentimento de cookies`);
}
if (!trackers.found.length && trackers.banner) {
  R.warn.push('barra de cookies sem nenhum rastreador — banner desnecessário (adaptação ao nicho)');
}
R.info.push(`trackers: ${trackers.found.length ? trackers.found.join(', ') : 'nenhum'} · banner: ${trackers.banner ? 'sim' : 'não'}`);

/* ---------- 7. contraste (WCAG AA) ---------- */
const contrast = await page.evaluate(() => {
  const parse = c => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
  };
  const lum = ({ r, g, b }) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const blend = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1,
  });
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };

  const bgOf = el => {
    let node = el, layers = [];
    while (node && node !== document.documentElement) {
      const s = getComputedStyle(node);
      if (s.backgroundImage && s.backgroundImage !== 'none') return { unknown: true };
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
      node = node.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return base;
  };

  const out = [];
  const els = [...document.querySelectorAll('p,h1,h2,h3,h4,h5,h6,span,a,li,button,label,small,strong,em,b,td,th')];
  for (const el of els) {
    const txt = (el.innerText || '').trim();
    if (!txt || txt.length > 400) continue;
    if (el.children.length && !/^(A|BUTTON|SPAN|STRONG|EM|B|SMALL)$/.test(el.tagName)) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) < 0.15) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const fg = parse(s.color);
    if (!fg) continue;
    const bg = bgOf(el);
    if (bg.unknown) continue;
    const eff = fg.a < 1 ? blend(fg, bg) : fg;
    const cr = ratio(eff, bg);
    const size = parseFloat(s.fontSize);
    const bold = (parseInt(s.fontWeight, 10) || 400) >= 700;
    const large = size >= 24 || (size >= 19 && bold);
    // decoração anunciada como decoração (aria-hidden) é gráfico: 3:1 basta.
    // O texto alternativo real (a nota, no caso das estrelas) está em outro elemento.
    const decorative = el.closest('[aria-hidden="true"]');
    const min = decorative ? 3 : large ? 3 : 4.5;
    if (cr < min) out.push({ txt: txt.slice(0, 34), cr: Math.round(cr * 100) / 100, min, size: Math.round(size) });
  }
  out.sort((a, b) => a.cr - b.cr);
  return { bad: out.length, worst: out.slice(0, 5) };
});
if (contrast.bad > 0) {
  R.warn.push(`${contrast.bad} texto(s) abaixo do contraste mínimo — pior: ${contrast.worst.map(w => `"${w.txt}" ${w.cr}:1 (min ${w.min})`).join(' · ')}`);
}
R.info.push(`contraste: ${contrast.bad === 0 ? 'todos os textos medidos passaram' : contrast.bad + ' abaixo do mínimo'}`);

/* ---------- 8. foco visível por teclado ---------- */
const focus = await page.evaluate(async () => {
  const seen = [];
  window.scrollTo(0, 0);
  for (let i = 0; i < 14; i++) {
    const el = document.activeElement;
    if (el && el !== document.body) {
      const s = getComputedStyle(el);
      const outline = parseFloat(s.outlineWidth) || 0;
      const shadow = s.boxShadow && s.boxShadow !== 'none';
      if (outline === 0 && !shadow) seen.push((el.tagName + '.' + (el.className || '')).slice(0, 40));
    }
  }
  return seen;
});
// a varredura real do Tab é feita abaixo com o teclado
const focusHits = [];
for (let i = 0; i < 14; i++) {
  await page.keyboard.press('Tab');
  // elementos com `transition:all` animam o outline de 0 → 3px:
  // sem esperar o settle, todo botão com transição pareceria "sem foco".
  await page.waitForTimeout(380);
  const bad = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const s = getComputedStyle(el);
    const outline = parseFloat(s.outlineWidth) || 0;
    const shadow = s.boxShadow && s.boxShadow !== 'none';
    if (outline === 0 && !shadow) return (el.tagName + ' ' + (el.className || el.id || '')).slice(0, 46);
    return null;
  });
  if (bad) focusHits.push(bad);
}
if (focusHits.length) R.warn.push(`${focusHits.length} elemento(s) focáveis sem indicação visual de foco — ex.: ${[...new Set(focusHits)].slice(0, 4).join(' | ')}`);
R.info.push(`teclado: ${focusHits.length === 0 ? 'foco visível em todos os 14 primeiros' : focusHits.length + ' sem foco visível'}`);

/* ---------- 9. promessas sem prova ---------- */
const claims = await page.evaluate(() => {
  const t = document.body.innerText;
  const pats = [
    /resultados? garantidos?/i, /100%\s*(de\s*)?(sucesso|eficaz|garantido)/i,
    /garantia (total|absoluta|de resultado)/i, /melhor (do mundo|da cidade|da regi[ãa]o)/i,
    /resultados? em \d+\s*(horas?|dias?|semanas?)/i, /sem risco/i, /renda garantida/i,
  ];
  return pats.filter(p => p.test(t)).map(p => p.source);
});
if (claims.length) R.warn.push(`possível promessa sem comprovação no texto: ${claims.join(' | ')}`);

await page.close();
await browser.close();

/* ---------- relatório ---------- */
const line = '─'.repeat(68);
console.log('\n  QA LEGAL · ' + target);
console.log('  ' + line);
R.info.forEach(i => console.log('   · ' + i));
console.log('  ' + line);

if (R.blocking.length) {
  console.log('\n  ✗ BLOQUEANTE (' + R.blocking.length + ')');
  R.blocking.forEach(b => console.log('    ! ' + b));
}
if (R.warn.length) {
  console.log('\n  ⚠ ALERTA (' + R.warn.length + ')');
  R.warn.forEach(w => console.log('    - ' + w));
}
if (!R.blocking.length && !R.warn.length) console.log('\n  ✓ Nada pendente.');

const failed = R.blocking.length > 0 || (STRICT && R.warn.length > 0);
console.log('\n  ' + (failed ? '✗ FALHOU' : '✓ PASSOU') +
  (R.blocking.length ? ' (há item bloqueante)' : STRICT && R.warn.length ? ' (—strict: alerta conta como falha)' : '') + '\n');
process.exit(failed ? 1 : 0);
