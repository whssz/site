#!/usr/bin/env node
/**
 * QA OBRIGATÓRIO — roda antes de publicar qualquer site.
 *
 * Verifica, em navegador real (Chromium headless), os critérios que o olho
 * não pega: scroll horizontal, animação em loop perpétuo, elementos que
 * nunca revelam, erro de JS e prefers-reduced-motion.
 *
 * Uso:
 *   node tools/qa.mjs portfolio/index.html
 *   node tools/qa.mjs base/skeleton.html --min-loop 5
 *   node tools/qa.mjs https://site.vercel.app --min-loop 2
 *
 * Sai com código 0 se PASS, 1 se FAIL.
 */
import { pathToFileURL } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/* O navegador é opcional. Sem playwright (sessão nova, node_modules não
   persiste), o QA cai no MODO ESTÁTICO — que continua barrando site sem
   animação. Antes, o script simplesmente morria com ERR_MODULE_NOT_FOUND
   e o portão desaparecia em silêncio.                                    */
let chromium = null;
try {
  ({ chromium } = await import('playwright'));
} catch {
  chromium = null;
}

const args = process.argv.slice(2);
const target = args.find(a => !a.startsWith('--'));
const flag = (name, def) => {
  const i = args.indexOf('--' + name);
  return i > -1 ? Number(args[i + 1]) : def;
};
const MIN_LOOP = flag('min-loop', 2);
const MIN_KF   = flag('min-kf', 5);

if (!target) {
  console.error('uso: node tools/qa.mjs <arquivo-ou-url> [--min-loop 2] [--min-kf 5]');
  process.exit(2);
}

const url = /^https?:\/\//.test(target) ? target : pathToFileURL(path.resolve(target)).href;
if (!/^https?:\/\//.test(target) && !existsSync(target)) {
  console.error('arquivo não encontrado:', target);
  process.exit(2);
}

const VIEWPORTS = [
  [1440, 900, 'desktop'],
  [768, 1024, 'tablet'],
  [390, 844, 'mobile'],
];

const results = [];
const fail = [];

/* ---------------- MODO ESTÁTICO (sem navegador) ---------------- */
function staticCheck(src, label) {
  const kfNames = [...new Set((src.match(/@keyframes\s+([\w-]+)/g) || []).map(k => k.replace(/@keyframes\s+/, '')))];
  const infDecls = (src.match(/animation:[^;}]*infinite/g) || []).length;
  const hasBgLayer = /class="bg"|\.bg\{|bg-aurora|bg-blob|bg-grid/.test(src);
  const hasParticles = /motes|\.particles|sparkles|canvas id/i.test(src);
  const hasReveal = /IntersectionObserver/.test(src);
  const hasReduce = /prefers-reduced-motion:reduce/.test(src)
    && /animation-duration:\.001ms|animation:none/.test(src);
  const hasProgress = /class="bar"|id="bar"/.test(src);

  console.log('\n  QA · ' + label + '   [MODO ESTÁTICO — sem navegador]');
  console.log('  ' + '─'.repeat(64));
  console.log(`   keyframes distintos ....... ${kfNames.length} ${kfNames.length >= MIN_KF ? '✓' : '✗'}  (${kfNames.join(', ') || 'nenhum'})`);
  console.log(`   declarações infinitas ..... ${infDecls} ${infDecls >= MIN_LOOP ? '✓' : '✗'}  (mínimo ${MIN_LOOP})`);
  console.log(`   fundo contextual animado .. ${hasBgLayer ? '✓' : '✗'}`);
  console.log(`   partículas / textura ...... ${hasParticles ? '✓' : '—'}`);
  console.log(`   reveal no scroll .......... ${hasReveal ? '✓' : '✗'}`);
  console.log(`   prefers-reduced-motion .... ${hasReduce ? '✓' : '✗'}`);
  console.log(`   barra de progresso ........ ${hasProgress ? '✓' : '—'}`);

  const failStatic = [];
  if (kfNames.length < MIN_KF) failStatic.push(`${kfNames.length} keyframes (mínimo ${MIN_KF})`);
  if (infDecls < MIN_LOOP) failStatic.push(`${infDecls} animação(ões) em loop (mínimo ${MIN_LOOP})`);
  if (!hasBgLayer) failStatic.push('sem fundo contextual animado');
  if (!hasReveal) failStatic.push('sem reveal no scroll (IntersectionObserver)');
  if (!hasReduce) failStatic.push('prefers-reduced-motion não neutraliza o movimento');

  console.log('  ' + '─'.repeat(64));
  console.log('  ⚠ modo parcial: não mede scroll horizontal nem elemento invisível.');
  console.log('    Para o QA completo: bash tools/setup.sh   (instala o navegador)\n');
  if (failStatic.length) {
    console.log('  ✗ FAIL\n');
    failStatic.forEach(f => console.log('    · ' + f));
    console.log('');
    return false;
  }
  console.log('  ✓ PASS (estático)\n');
  return true;
}

if (!chromium) {
  const src = /^https?:\/\//.test(target)
    ? await (await fetch(target)).text()
    : readFileSync(target, 'utf8');
  const okStatic = staticCheck(src, target);
  process.exit(okStatic ? 0 : 1);
}

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

for (const [w, h, name] of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });

  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(1200);

  const base = await page.evaluate(() => {
    const inf = document.getAnimations().filter(a => {
      if (a.playState !== 'running') return false;
      const t = a.effect && a.effect.getTiming ? a.effect.getTiming() : {};
      return t.iterations === Infinity;
    });
    const kf = [...new Set(document.getAnimations().filter(a => a.animationName).map(a => a.animationName))];
    return {
      docW: document.documentElement.scrollWidth,
      cliW: document.documentElement.clientWidth,
      loop: inf.length,
      kf: kf.length,
      kfNames: kf,
    };
  });

  // percorre a página inteira para disparar todos os reveals
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += Math.round(innerHeight * 0.5)) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 110));
    }
    await new Promise(r => setTimeout(r, 1200));
  });

  // segunda passada: em página grande (2 MB+) o IntersectionObserver pode
  // atrasar. Aqui cada candidato é levado ao centro da tela e aguardado —
  // se ainda assim não revelar, é bug de verdade, não de tempo.
  await page.evaluate(async () => {
    const sel = '.rev,.rv-fade,.rv-scale,.rv-left,.rv-right,.rv-clip,[data-reveal]';
    const stuck = [...document.querySelectorAll(sel)].filter(e => {
      const s = getComputedStyle(e);
      return parseFloat(s.opacity) === 0 || (s.clipPath !== 'none' && /100%/.test(s.clipPath));
    }).slice(0, 8);
    for (const el of stuck) {
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      await new Promise(r => setTimeout(r, 450));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise(r => setTimeout(r, 700));
  });

  const revealed = await page.evaluate(() => {
    const sel = '.rev,.rv-fade,.rv-scale,.rv-left,.rv-right,.rv-clip,[data-reveal]';
    const els = [...document.querySelectorAll(sel)];
    const stuck = els.filter(e => {
      const s = getComputedStyle(e);
      const op = parseFloat(s.opacity);
      const clipped = s.clipPath !== 'none' && /100%/.test(s.clipPath);
      return op === 0 || clipped;
    });
    return { total: els.length, stuck: stuck.length, sample: stuck.slice(0, 3).map(e => e.className + ' ' + e.tagName) };
  });

  const after = await page.evaluate(() => ({
    loop: document.getAnimations().filter(a => a.playState === 'running' &&
      a.effect && a.effect.getTiming && a.effect.getTiming().iterations === Infinity).length,
    scrollH: document.documentElement.scrollHeight,
  }));

  const row = {
    name,
    hscroll: base.docW - base.cliW,
    loop: Math.min(base.loop, after.loop),
    kf: base.kf,
    revTotal: revealed.total,
    revStuck: revealed.stuck,
    errors: errs.length,
    height: after.scrollH,
  };
  results.push(row);

  if (row.hscroll > 0) fail.push(`${name}: scroll horizontal de ${row.hscroll}px`);
  if (row.loop < MIN_LOOP) fail.push(`${name}: ${row.loop} animação(ões) em loop (mínimo ${MIN_LOOP})`);
  if (row.kf < MIN_KF) fail.push(`${name}: ${row.kf} keyframes (mínimo ${MIN_KF})`);
  if (row.revStuck > 0) fail.push(`${name}: ${row.revStuck} elemento(s) que nunca revelam — ${revealed.sample.join(', ')}`);
  if (row.errors > 0) fail.push(`${name}: ${row.errors} erro(s) de JS — ${errs[0]}`);

  await page.close();
}

// prefers-reduced-motion: tudo parado, nada escondido
const rp = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await rp.goto(url, { waitUntil: 'load', timeout: 45000 });
await rp.waitForTimeout(900);
const rm = await rp.evaluate(() => ({
  running: document.getAnimations().filter(a => a.playState === 'running').length,
  hidden: [...document.querySelectorAll('.rev,.rv-fade,.rv-scale,.rv-left,.rv-right,.rv-clip,[data-reveal]')]
    .filter(e => {
      const s = getComputedStyle(e);
      return parseFloat(s.opacity) === 0 || (s.clipPath !== 'none' && /100%/.test(s.clipPath));
    }).length,
}));
await rp.close();
await browser.close();

if (rm.running > 0) fail.push(`reduced-motion: ${rm.running} animação(ões) ainda rodando`);
if (rm.hidden > 0) fail.push(`reduced-motion: ${rm.hidden} elemento(s) oculto(s)`);

const pad = (s, n) => String(s).padEnd(n);
console.log('\n  QA · ' + target);
console.log('  ' + '─'.repeat(64));
console.log('  ' + pad('viewport', 11) + pad('h-scroll', 10) + pad('loop', 7) + pad('keyframes', 11) + pad('revela', 9) + 'erros');
for (const r of results) {
  console.log('  ' + pad(r.name, 11) + pad(r.hscroll + 'px', 10) + pad(r.loop, 7) + pad(r.kf, 11) + pad(r.revTotal - r.revStuck + '/' + r.revTotal, 9) + r.errors);
}
console.log('  ' + '─'.repeat(64));
console.log('  reduced-motion: ' + (rm.running === 0 && rm.hidden === 0 ? 'desliga tudo ✓' : `${rm.running} animando, ${rm.hidden} oculto`));

if (fail.length) {
  console.log('\n  ✗ FAIL\n');
  fail.forEach(f => console.log('    · ' + f));
  console.log('');
  process.exit(1);
}
console.log('\n  ✓ PASS — pode publicar\n');
process.exit(0);
