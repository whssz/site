#!/usr/bin/env node
/**
 * INJETOR DA CAMADA DE ANIMAÇÃO — um comando, qualquer HTML.
 *
 * Existe porque "lembrar de animar" não é garantia. Este script transforma
 * em mecânica o que antes era promessa: pega um site — mesmo escrito do zero,
 * sem nenhuma animação — e injeta o kit completo.
 *
 * Uso:
 *   node tools/inject-anim.mjs site/index.html
 *   node tools/inject-anim.mjs site/index.html --accent "#E000A5"
 *   node tools/inject-anim.mjs --refresh            (atualiza sites que já têm o kit)
 *
 * O que ele faz:
 *   1. injeta tools/anim-kit.css (tokenizado — a cor segue o :root do site)
 *   2. injeta a marcação do fundo animado + fio + barra de progresso
 *   3. injeta tools/anim-kit.js (reveal variado, parallax, progresso)
 *   4. marca as <section> com data-bridge (glows que atravessam seções)
 *   5. detecta o acento do site e avisa se ele estiver fixo no código
 *
 * Idempotente: rodar duas vezes não duplica nada. `--refresh` substitui.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KIT_CSS = path.join(HERE, 'anim-kit.css');
const KIT_JS = path.join(HERE, 'anim-kit.js');

const MARK = 'ANIM-KIT v2';
const START = '<!-- ANIM-KIT v2 -->';
const END = '<!-- /ANIM-KIT v2 -->';

const args = process.argv.slice(2);
const refresh = args.includes('--refresh');
const accentIdx = args.indexOf('--accent');
const accentOverride = accentIdx > -1 ? args[accentIdx + 1] : null;
const files = args.filter(a => !a.startsWith('--') && a !== accentOverride);

const DEFAULT_TARGETS = [
  'base/skeleton.html',
  'portfolio/index.html',
  'portfolio/template.html'
];

if (!existsSync(KIT_CSS) || !existsSync(KIT_JS)) {
  console.error('\n✗ Kit não encontrado ao lado do script.');
  console.error('  Esperado: tools/anim-kit.css e tools/anim-kit.js\n');
  process.exit(2);
}

const CSS = readFileSync(KIT_CSS, 'utf8');
const JS = readFileSync(KIT_JS, 'utf8');

const MARKUP = `
<!-- ANIM-KIT v2 -->
<div class="bg" aria-hidden="true">
  <div class="bg-aurora"></div>
  <div class="bg-blob b1"></div>
  <div class="bg-blob b2"></div>
  <div class="bg-blob b3"></div>
  <div class="bg-grid"></div>
  <div class="motes"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
</div>
<div class="thread" aria-hidden="true"></div>
<div class="bar" id="bar" aria-hidden="true"></div>
<!-- /ANIM-KIT v2 -->
`;

/* ---------- detecção de acento ---------- */
function detectAccent(html) {
  const root = html.match(/:root\s*\{[\s\S]*?\}/);
  if (!root) return { found: [], hardcoded: [] };
  const block = root[0];
  const found = [];
  if (/--accent\s*:/.test(block)) found.push('--accent');
  if (/--magenta\s*:/.test(block)) found.push('--magenta');
  if (/--gold\s*:/.test(block)) found.push('--gold');
  const hardcoded = (html.match(/rgba?\(\s*201\s*,\s*164\s*,\s*106/g) || []).length
    + (html.match(/rgba?\(\s*224\s*,\s*0\s*,\s*165/g) || []).length;
  return { found, hardcoded };
}

/* ---------- marcação das seções ---------- */
function markBridges(html) {
  let count = 0;
  let i = 0;
  html = html.replace(/<section\b([^>]*)>/g, (m, attrs) => {
    if (/data-bridge/.test(attrs)) return m;
    // hero não é ponte: ele já tem os próprios glows
    if (/class="[^"]*\bhero\b/.test(attrs)) return m;
    // seções que já são tratadas pelos ids clássicos não precisam de marcador
    if (/id="(projetos|processo|sobre)"/.test(attrs)) return m;
    const tag = ['a', 'b', 'c'][i % 3];
    i++; count++;
    return `<section${attrs} data-bridge="${tag}">`;
  });
  return { html, count };
}

function strip(html) {
  return html
    .replace(/\/\* =+\s*\n\s*ANIM-KIT v2[\s\S]*?(?=<\/style>)/, '')
    .replace(/\/\* =+\s*\n\s*ANIM-LAYER v1[\s\S]*?(?=<\/style>)/, '')
    .replace(/\/\* =+\s*\n\s*MIGA-ANIM[\s\S]*?(?=<\/style>)/, '')
    .replace(/\n?<!-- ANIM-KIT v2 -->[\s\S]*?<!-- \/ANIM-KIT v2 -->\n?/, '\n')
    .replace(/\n?<!-- =+ FUNDO CONTEXTUAL ANIMADO =+ -->[\s\S]*?<div class="bar" id="bar" aria-hidden="true"><\/div>\n?/, '\n')
    .replace(/<script data-anim-kit>[\s\S]*?<\/script>\n?/, '');
}

function inject(file) {
  let html = readFileSync(file, 'utf8');
  const before = HTML_LEN(html);

  if (html.includes(MARK) && !refresh) {
    console.log(`· ${file}: já tem o kit (use --refresh para atualizar)`);
    return { file, skipped: true };
  }
  if (refresh) html = strip(html);

  const hasStyle = html.includes('</style>');
  const hasBody = html.includes('<body>') || /<body\b[^>]*>/.test(html);
  const hasBodyClose = html.includes('</body>');

  if (!hasStyle || !hasBody) {
    console.log(`✗ ${file}: precisa ter <style> e <body> para receber o kit`);
    return { file, failed: true };
  }

  // 1. CSS
  const i = html.lastIndexOf('</style>');
  html = html.slice(0, i) + '\n/* ANIM-KIT v2 */\n' + CSS + '\n' + html.slice(i);

  // 2. marcação
  const openTag = html.match(/<body\b[^>]*>/);
  const j = openTag.index + openTag[0].length;
  html = html.slice(0, j) + MARKUP + html.slice(j);

  // 3. seções como ponte
  const bridges = markBridges(html);
  html = bridges.html;

  // 4. JS antes de </body>
  if (hasBodyClose) {
    const k = html.lastIndexOf('</body>');
    html = html.slice(0, k) + `<script data-anim-kit>\n${JS}\n</script>\n` + html.slice(k);
  }

  // 5. acento
  const acc = detectAccent(html);
  if (accentOverride) {
    const rootRe = /(:root\s*\{)/;
    if (rootRe.test(html)) {
      html = html.replace(rootRe, `$1\n  --accent:${accentOverride}; /* definido pelo injetor */`);
    }
  }

  writeFileSync(file, html, 'utf8');

  const kf = (html.match(/@keyframes\s+([\w-]+)/g) || []);
  const uniq = [...new Set(kf.map(k => k.replace(/@keyframes\s+/, '')))];
  console.log(`✓ ${file}`);
  console.log(`   ${before.toLocaleString('pt-BR')} → ${HTML_LEN(html).toLocaleString('pt-BR')} bytes`);
  console.log(`   keyframes: ${uniq.length} → ${uniq.join(', ')}`);
  console.log(`   seções-ponte marcadas: ${bridges.count}`);
  console.log(`   acento detectado: ${acc.found.length ? acc.found.join(' > ') : 'NENHUM'}` +
    (accentOverride ? ` · forçado para ${accentOverride}` : ''));
  if (!acc.found.length) {
    console.log('   ⚠ o site não define --accent/--magenta/--gold: o fundo animado usará o fallback dourado.');
    console.log('     rode com --accent "#SUA_COR" ou defina um desses tokens no :root.');
  }
  return { file, uniq: uniq.length, bridges: bridges.count };
}

const HTML_LEN = s => Buffer.byteLength(s, 'utf8');

console.log('\n  INJETOR ANIM-KIT v2');
console.log('  ' + '─'.repeat(58));
const targets = files.length ? files : DEFAULT_TARGETS;
const results = targets.map(inject);
console.log('  ' + '─'.repeat(58));
const ok = results.filter(r => r.skipped || r.uniq >= 5);
console.log(`  ${ok.length}/${results.length} arquivo(s) com o kit completo.`);
console.log('  Verifique com: node tools/qa.mjs <arquivo>\n');
process.exit(ok.length === results.length ? 0 : 1);
