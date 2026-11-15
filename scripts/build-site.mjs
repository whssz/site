#!/usr/bin/env node
/**
 * BUILD — gera index.html, um único ficheiro autossuficiente.
 * Substitui {{IMG:...}}, {{VIDEO:...}} e {{FONT:...}} por data URIs
 * de assets/embedded.json (mídia REAL + fontes locais).
 * Uso: node scripts/build-site.mjs
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const media = JSON.parse(readFileSync(path.join(ROOT, 'assets/embedded.json'), 'utf8'));
let html = readFileSync(path.join(ROOT, 'scripts/site.template.html'), 'utf8');

// Mapa JS com as fotografias das pizzas usadas pelo renderizador do cardápio.
const menuImages = {};
for (const [key, uri] of Object.entries(media)) {
  if (/^pizza-.*\.webp$/.test(key)) menuImages[key] = uri;
}
const mapJS = 'Object.assign(IMG, ' + JSON.stringify(menuImages) + ');';

const missing = new Set();
html = html.replace(/\{\{(IMG|VIDEO|FONT):([^}]+)\}\}/g, (all, type, key) => {
  if (!media[key]) { missing.add(key); return all; }
  return media[key];
});
html = html.replace('{{MEDIA_MAP}}', mapJS);

if (missing.size) {
  console.error('✗ Mídia ausente em embedded.json:', [...missing].join(', '));
  process.exit(1);
}
if (/\{\{[A-Z_]+:[^}]+\}\}/.test(html) || html.includes('{{MEDIA_MAP}}')) {
  console.error('✗ Placeholder não substituído.');
  process.exit(1);
}
const out = path.join(ROOT, 'index.html');
writeFileSync(out, html, 'utf8');
console.log(`✓ index.html · ${(statSync(out).size / 1024 / 1024).toFixed(2)} MB · ${Object.keys(menuImages).length} fotos de pizzas embutidas`);
