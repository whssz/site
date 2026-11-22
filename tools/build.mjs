#!/usr/bin/env node
/* Build: monta public/index.html a partir de src/ (arquivo único, sem dependências) */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(process.cwd());
const tpl = readFileSync(resolve(root, 'src/index.tpl.html'), 'utf8');
const css = readFileSync(resolve(root, 'src/site.css'), 'utf8');
const js = readFileSync(resolve(root, 'src/site.js'), 'utf8');

for (const [name, code] of [['css', css], ['js', js]]) {
  if (new RegExp(`</${name}`, 'i').test(code)) {
    console.error(`✗ src/${name === 'css' ? 'site.css' : 'site.js'} contém "</${name}" — isto quebraria o HTML.`);
    process.exit(1);
  }
}

const out = tpl
  .replace('/*__CSS__*/', () => css.trimEnd())
  .replace('/*__JS__*/', () => js.trimEnd());

const target = resolve(root, 'public/index.html');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, out, 'utf8');

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log(`✓ public/index.html — ${kb(out.length)} (css ${kb(css.length)}, js ${kb(js.length)})`);
