#!/usr/bin/env node
/**
 * Build autossuficiente — AMUNÌ a Caparica Pizzeria
 * Empacota fontes WOFF2 (OFL), fotos reais WebP (sem duplicação), CSS, JSON e JS
 * em public/index.html e injeta a camada oficial anim-kit (tools/inject-anim.mjs).
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const ASSETS_DIR = path.join(SRC, 'assets');
const FONTS_DIR = path.join(ASSETS_DIR, 'fonts');
const OUT_DIR = path.join(ROOT, 'public');
const OUT_FILE = path.join(OUT_DIR, 'index.html');

const FONT_DEFS = [
  { family: 'Nunito', weight: 500, style: 'normal', subset: 'latin-ext', file: 'nunito-latin-ext-500-normal.woff2', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' },
  { family: 'Nunito', weight: 500, style: 'normal', subset: 'latin', file: 'nunito-latin-500-normal.woff2', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
  { family: 'Nunito', weight: 700, style: 'normal', subset: 'latin-ext', file: 'nunito-latin-ext-700-normal.woff2', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' },
  { family: 'Nunito', weight: 700, style: 'normal', subset: 'latin', file: 'nunito-latin-700-normal.woff2', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
  { family: 'Nunito', weight: 800, style: 'normal', subset: 'latin-ext', file: 'nunito-latin-ext-800-normal.woff2', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' },
  { family: 'Nunito', weight: 800, style: 'normal', subset: 'latin', file: 'nunito-latin-800-normal.woff2', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
  { family: 'Fraunces', weight: 600, style: 'italic', subset: 'latin-ext', file: 'fraunces-latin-ext-600-italic.woff2', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' },
  { family: 'Fraunces', weight: 600, style: 'italic', subset: 'latin', file: 'fraunces-latin-600-italic.woff2', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
];

function buildFontFaceCSS() {
  return FONT_DEFS.map(f => {
    const b64 = readFileSync(path.join(FONTS_DIR, f.file)).toString('base64');
    return `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${f.range};}`;
  }).join('\n');
}

function loadWebpMap() {
  const map = {};
  for (const name of readdirSync(ASSETS_DIR).sort()) {
    if (!name.endsWith('.webp')) continue;
    const b64 = readFileSync(path.join(ASSETS_DIR, name)).toString('base64');
    map[name] = `data:image/webp;base64,${b64}`;
  }
  return map;
}

let html = readFileSync(path.join(SRC, 'index.html'), 'utf8');
let css = readFileSync(path.join(SRC, 'styles.css'), 'utf8');
const dataRaw = JSON.stringify(JSON.parse(readFileSync(path.join(SRC, 'data.json'), 'utf8')));
const js = readFileSync(path.join(SRC, 'site.js'), 'utf8');

const fontsCss = buildFontFaceCSS();
css = css.replace('/* __FONTS_PLACEHOLDER__ */', () => fontsCss);

const webpMap = loadWebpMap();
const inlinedInHtml = new Set();

html = html.replace(/__ASSET:([a-z0-9._-]+\.webp)__/gi, (_, file) => {
  if (!webpMap[file]) throw new Error(`Asset não encontrado: ${file}`);
  inlinedInHtml.add(file);
  return webpMap[file];
});

// Demais imagens vão em window.__AMUNI_ASSETS__ (sem duplicar as 3 já embutidas no Hero)
const jsAssets = {};
for (const [file, uri] of Object.entries(webpMap)) {
  if (!inlinedInHtml.has(file)) jsAssets[file] = uri;
}
const assetsPrelude = `window.__AMUNI_ASSETS__=${JSON.stringify(jsAssets)};\n`;

html = html.replace('/* __STYLES_PLACEHOLDER__ */', () => css);
html = html.replace('/* __DATA_PLACEHOLDER__ */', () => dataRaw);
html = html.replace('/* __SCRIPT_PLACEHOLDER__ */', () => assetsPrelude + js);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, html, 'utf8');

// Injeta a camada oficial anim-kit (CSS + DOM + JS)
execFileSync(process.execPath, [path.join(ROOT, 'tools', 'inject-anim.mjs'), OUT_FILE], {
  stdio: 'inherit',
});

const sizeKB = (statSync(OUT_FILE).size / 1024).toFixed(1);
console.log(`  ✓ public/index.html gerado (${sizeKB} KB · ${Object.keys(webpMap).length} fotos reais · ${FONT_DEFS.length} fontes WOFF2)`);
