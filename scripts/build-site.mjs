#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const templatePath = path.join(root, 'src/site-template.html');
const assetsDir = path.join(root, 'assets');
const template = readFileSync(templatePath, 'utf8');

const assetKeys = new Set([
  ...[...template.matchAll(/data-asset="([a-z0-9-]+)"/g)].map((m) => m[1]),
  ...[...template.matchAll(/data-video="([a-z0-9-]+)"/g)].map((m) => m[1]),
  ...[...template.matchAll(/data-poster="([a-z0-9-]+)"/g)].map((m) => m[1]),
]);
assetKeys.add('logo-wordmark-alpha'); // Open Graph preview.

function findAsset(key) {
  const names = readdirSync(assetsDir);
  const file = names.find((name) => path.parse(name).name === key && !statSync(path.join(assetsDir, name)).isDirectory());
  if (!file) throw new Error(`Asset ausente: assets/${key}.*`);
  const ext = path.extname(file).toLowerCase();
  const mime = ({
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.mp4': 'video/mp4',
  })[ext];
  if (!mime) throw new Error(`Formato não suportado para arquivo único: ${file}`);
  return `data:${mime};base64,${readFileSync(path.join(assetsDir, file)).toString('base64')}`;
}

const media = {};
let mediaBytes = 0;
for (const key of assetKeys) {
  media[key] = findAsset(key);
  mediaBytes += Buffer.byteLength(media[key], 'utf8');
}

const fonts = {
  PF400_LATIN: 'playfair-latin-400.woff2',
  PF400_EXT: 'playfair-latin-ext-400.woff2',
  PF400I_LATIN: 'playfair-latin-400-italic.woff2',
  PF400I_EXT: 'playfair-latin-ext-400-italic.woff2',
  JK400_LATIN: 'jakarta-latin-400.woff2',
  JK400_EXT: 'jakarta-latin-ext-400.woff2',
  JK500_LATIN: 'jakarta-latin-500.woff2',
  JK500_EXT: 'jakarta-latin-ext-500.woff2',
  JK600_LATIN: 'jakarta-latin-600.woff2',
  JK600_EXT: 'jakarta-latin-ext-600.woff2',
};
let html = template;
for (const [token, file] of Object.entries(fonts)) {
  const fontPath = path.join(assetsDir, 'fonts', file);
  const data = readFileSync(fontPath).toString('base64');
  html = html.replaceAll(`@@${token}@@`, data);
}
html = html.replace('@@MEDIA_MAP@@', JSON.stringify(media).replaceAll('<', '\\u003c'));
html = html.replace('@@LOGO_OG@@', media['logo-wordmark-alpha']);

if (html.includes('@@')) throw new Error('Ainda há token não resolvido no HTML final.');
const out = path.join(root, 'index.html');
writeFileSync(out, html, 'utf8');
console.log(`✓ ${path.relative(root, out)} gerado a partir do template.`);
console.log(`  ${assetKeys.size} mídias inline · ${(mediaBytes / 1024 / 1024).toFixed(2)} MB em mídia.`);
console.log(`  ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB antes da injeção de animação.`);
