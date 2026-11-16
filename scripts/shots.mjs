#!/usr/bin/env node
/**
 * Captura telas reais do site nos três viewports e salva em qa/telas/.
 * Serve para conferência visual — o sandbox não tem navegador.
 */
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const file = process.argv[2] || 'index.html';
const url = pathToFileURL(path.resolve(file)).href;
const dir = 'qa/telas';
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

const shots = [
  ['mobile', 390, 844, false],
  ['tablet', 768, 1024, false],
  ['desktop', 1440, 900, false],
];

for (const [nome, w, h, full] of shots) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  // dispara todos os reveals rolando a página
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += Math.round(innerHeight * 0.6)) {
      scrollTo(0, y);
      await new Promise(r => setTimeout(r, 90));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${dir}/${nome}-topo.png` });
  await page.screenshot({ path: `${dir}/${nome}-cheio.png`, fullPage: true });
  const altura = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`${nome}: ${w}x${h} · altura total ${altura}px`);
  await page.close();
}

// close-up das seções no desktop
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1200);
await page.evaluate(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  const H = document.documentElement.scrollHeight;
  for (let y = 0; y < H; y += Math.round(innerHeight * 0.6)) {
    scrollTo(0, y);
    await new Promise(r => setTimeout(r, 90));
  }
});
await page.waitForTimeout(800);
const secoes = await page.$$('section[id], footer');
for (const s of secoes) {
  const id = await s.evaluate((e) => e.id || 'footer');
  if (!id) continue;
  try {
    await s.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await s.screenshot({ path: `${dir}/sec-${id}.png` });
    console.log('secao capturada:', id);
  } catch (e) { /* seção oculta */ }
}
await page.close();
await browser.close();
console.log('telas salvas em', dir);
