#!/usr/bin/env node
/**
 * EMBUTIR MÍDIA — transforma o site num único arquivo autocontido.
 * Lê cada src="assets/..." usado no HTML, converte para data URI base64
 * e grava public/index.html. O site funciona offline, em anexo, e na Vercel
 * sem depender de nenhum pedido externo.
 *
 *   node tools/inline-assets.mjs public/index.html
 */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const file = process.argv[2] || 'public/index.html';
if (!existsSync(file)) { console.error('arquivo não encontrado:', file); process.exit(2); }

const MIME = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.avif': 'image/avif', '.svg': 'image/svg+xml' };
const root = path.dirname(file);

let html = readFileSync(file, 'utf8');
/* já embutido? então os assets vêm do original guardado */
const sources = [...new Set((html.match(/src="(assets\/[^"]+)"/g) || []).map(m => m.slice(5, -1)))];
if (!sources.length) {
  console.log('· nada a embutir (o HTML já está autocontido)');
  process.exit(0);
}

let total = 0, count = 0;
for (const src of sources) {
  const p = path.join(root, src);
  if (!existsSync(p)) { console.warn('⚠ ausente:', src); continue; }
  const ext = path.extname(p).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  const b64 = readFileSync(p).toString('base64');
  total += b64.length;
  count++;
  html = html.split(`src="${src}"`).join(`src="data:${mime};base64,${b64}"`);
}

/* og:image também passa a ser embutido para preview social autocontido */
const og = html.match(/<meta property="og:image" content="(assets\/[^"]+)">/);
if (og) {
  const p = path.join(root, og[1]);
  if (existsSync(p)) {
    const mime = MIME[path.extname(p).toLowerCase()] || 'image/jpeg';
    const b64 = readFileSync(p).toString('base64');
    total += b64.length;
    html = html.replace(og[0], `<meta property="og:image" content="data:${mime};base64,${b64}">`);
  }
}

writeFileSync(file, html, 'utf8');
console.log(`✓ ${file}`);
console.log(`  ${count} imagem(ns) embutida(s) · ${(total / 1024 / 1024).toFixed(2)} MB em base64`);
console.log(`  arquivo final: ${(statSync(file).size / 1024 / 1024).toFixed(2)} MB`);
