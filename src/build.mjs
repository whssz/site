#!/usr/bin/env node
/* Monta public/index.html: template + CSS + JS + fontes + mídia (assets/) embutidos em base64. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = new URL('..', import.meta.url).pathname;
const b64 = p => readFileSync(p).toString('base64');
const F = (fam, pkg, w, s) => [fam, w, s, `@fontsource/${pkg}/files/${pkg}-latin-${w}-${s}.woff2`];
const FONTS = [
  F('Cormorant Garamond', 'cormorant-garamond', 500, 'normal'), F('Cormorant Garamond', 'cormorant-garamond', 600, 'normal'),
  F('Cormorant Garamond', 'cormorant-garamond', 500, 'italic'), F('Cormorant Garamond', 'cormorant-garamond', 600, 'italic'),
  F('Parisienne', 'parisienne', 400, 'normal'),
  F('DM Sans', 'dm-sans', 400, 'normal'), F('DM Sans', 'dm-sans', 500, 'normal'), F('DM Sans', 'dm-sans', 700, 'normal'),
];
const fonts = FONTS.map(([f, w, s, p]) => `@font-face{font-family:"${f}";font-weight:${w};font-style:${s};font-display:swap;src:url(data:font/woff2;base64,${b64(require.resolve(p))}) format("woff2")}`).join('\n');
let html = readFileSync(root + 'src/template.html', 'utf8');
html = html.replace('{{fonts}}', () => fonts)
  .replace('{{css}}', () => readFileSync(root + 'src/head.css', 'utf8'))
  .replace('{{js}}', () => readFileSync(root + 'src/app.js', 'utf8'))
  .replace(/\{\{img:([^}]+)\}\}/g, (_, f) => `data:image/webp;base64,${b64(root + 'assets/' + f)}`)
  .replace(/\{\{vid:([^}]+)\}\}/g, (_, f) => `data:video/mp4;base64,${b64(root + 'assets/' + f)}`);
if (/\{\{(img|vid|css|js|fonts)/.test(html)) throw new Error('marcador não resolvido');
mkdirSync(root + 'public', { recursive: true });
writeFileSync(root + 'public/index.html', html);
console.log('public/index.html', (html.length / 1024).toFixed(0) + ' KB');
