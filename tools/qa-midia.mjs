import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser } from './browser.mjs';

// A solid-color fixture exercises the asset pipeline without using, replacing or
// publishing any business media. Only the temporary copy receives this manifest.
const scratch = mkdtempSync(join(tmpdir(), 'supremo-qa-midia-'));
let browser;
try {
  const source = new URL('../src/', import.meta.url);
  const staged = join(scratch, 'src');
  cpSync(source, staged, { recursive: true });
  cpSync(new URL('./', import.meta.url), join(scratch, 'tools'), { recursive: true });
  for (const name of ['capa-tecnica.webp', 'capa-tecnica-mobile.webp', 'amostra-tecnica.mp4']) {
    cpSync(new URL(`fixtures/${name}`, import.meta.url), join(staged, 'assets', name));
  }
  const photo = { photo: 'capa-tecnica.webp', mobile: 'capa-tecnica-mobile.webp', width: 64, height: 48, alt: 'Quadro azul da amostra técnica' };
  const clip = { ...photo, video: 'amostra-tecnica.mp4' };
  const manifest = join(staged, 'midia.json');
  const fixtureManifest = {
    hero: clip,
    experiencia: photo,
    cta: photo,
    produtos: { maracuja: photo },
    galeria: { 'doce-de-leite': clip, 'maracuja-milho': clip },
  };
  writeFileSync(manifest, JSON.stringify(fixtureManifest));
  execFileSync(process.execPath, [join(scratch, 'tools', 'build.mjs')]);
  const url = pathToFileURL(join(scratch, 'public', 'index.html')).href;

  browser = await launchBrowser();
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto(url);
  const hero = desktop.locator('#inicio video');
  await hero.waitFor({ state: 'visible' });
  await desktop.waitForFunction(() => document.querySelector('#inicio video').currentTime > 0, undefined, { timeout: 5000 });
  assert.equal(await hero.evaluate(v => v.muted && v.loop && v.playsInline && !v.paused && v.poster.startsWith('data:image/webp')), true);
  assert.equal(await desktop.locator('#inicio .media-slot img').getAttribute('fetchpriority'), 'high');
  assert.equal(await desktop.locator('[data-product="maracuja"] .media-slot img').getAttribute('loading'), 'lazy');
  assert.equal(await desktop.locator('[data-product="milho-verde"] .media-slot img').count(), 0);
  assert.equal(await desktop.locator('.media-slot img').count(), 6);

  await desktop.locator('.gallery-grid').evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await desktop.waitForFunction(() => {
    const playing = [...document.querySelectorAll('video')].filter(v => !v.hidden && !v.paused);
    return playing.length === 1 && playing[0].closest('#galeria') && playing[0].currentTime > 0;
  }, undefined, { timeout: 6000 });
  assert.equal(await hero.evaluate(v => v.hidden && v.paused), true);
  assert.equal(await desktop.locator('#galeria video').count(), 2);
  await desktop.emulateMedia({ reducedMotion: 'reduce' });
  await desktop.waitForFunction(() => [...document.querySelectorAll('video')].every(v => v.hidden && v.paused));
  await desktop.close();
  console.log('✓ Desktop: capa local, reprodução silenciosa em loop, um clipe visível por vez e pausa ao reduzir movimento');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobile.goto(url);
  await mobile.waitForFunction(() => document.querySelector('#inicio .media-slot img').naturalWidth === 32);
  assert.deepEqual(await mobile.locator('video').evaluateAll(videos => videos.map(v => [v.hidden, v.hasAttribute('src')])), [[true, false], [true, false], [true, false]]);
  assert.equal(await mobile.locator('#inicio .media-slot img').getAttribute('alt'), photo.alt);
  await mobile.close();
  console.log('✓ Celular: versão leve da capa, texto alternativo e nenhum clipe iniciado');

  const reduced = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await reduced.goto(url);
  await reduced.waitForFunction(() => document.querySelector('#inicio .media-slot img').naturalWidth === 64);
  assert.deepEqual(await reduced.locator('video').evaluateAll(videos => videos.map(v => [v.hidden, v.hasAttribute('src')])), [[true, false], [true, false], [true, false]]);
  await reduced.close();
  console.log('✓ Movimento reduzido desde a abertura: capa estática sem iniciar o MP4');

  // An invalid entry must fail before production output is written.
  const validOutput = readFileSync(join(scratch, 'public', 'index.html'));
  writeFileSync(manifest, JSON.stringify({ ...fixtureManifest, hero: { ...clip, alt: '' } }));
  assert.throws(() => execFileSync(process.execPath, [join(scratch, 'tools', 'build.mjs')], { stdio: 'pipe' }), /Configure WebP\/AVIF, alt/);
  assert.deepEqual(readFileSync(join(scratch, 'public', 'index.html')), validOutput);
  console.log('✓ Registro inválido não sobrescreve o último build; amostras de teste não entram no site');
} finally {
  if (browser) await browser.close();
  rmSync(scratch, { recursive: true, force: true });
}
