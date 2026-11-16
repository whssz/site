#!/usr/bin/env node
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const target = process.argv[2] || 'index.html';
const url = /^https?:\/\//.test(target) ? target : pathToFileURL(path.resolve(target)).href;
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const errors = [];
let assertions = 0;
const check = (condition, message) => { assertions++; assert.ok(condition, message); };

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    window.__openedLinks = [];
    window.open = (href) => { window.__openedLinks.push(String(href)); return { focus() {} }; };
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(350);

  check((await page.title()).includes('Clô & Saint'), 'título da página');
  check(await page.locator('#menuList .menu-item').count() === 7, 'a aba inicial apresenta os sete combos');
  check(await page.locator('img:not([alt])').count() === 0, 'todas as imagens têm texto alternativo');
  check(await page.locator('video[data-video]').count() === 3, 'três loops de vídeo oficiais estão presentes');

  await page.getByRole('tab', { name: 'Doces' }).click();
  check(await page.locator('#menuList .menu-item').count() === 4, 'aba Doces');
  await page.getByRole('button', { name: 'Adicionar Pistache ao pedido' }).click();
  await page.getByRole('button', { name: 'Adicionar Pistache ao pedido' }).click();
  await page.getByRole('button', { name: 'Adicionar Ganache de Chocolate ao pedido' }).click();
  await page.getByRole('button', { name: 'Abrir pedido; 3 itens' }).click();
  check(await page.locator('#cartDialog').evaluate((dialog) => dialog.open), 'carrinho abre como diálogo');
  check((await page.locator('#cartSubtotal').innerText()).replace(/\s/g, ' ') === 'R$ 88,00', 'subtotal inicial de R$ 88,00');
  await page.getByRole('button', { name: 'Diminuir quantidade de Pistache' }).click();
  check((await page.locator('#cartSubtotal').innerText()).replace(/\s/g, ' ') === 'R$ 58,00', 'quantidade e subtotal são editáveis');

  await page.locator('#orderName').fill('Arena QA');
  await page.locator('#orderNotes').fill('Preferência registrada no teste');
  await page.getByRole('button', { name: /Preparar pedido no WhatsApp/ }).click();
  check(await page.locator('#privacyConsent').evaluate((input) => input.checked) === false, 'consentimento não vem pré-marcado');
  check((await page.evaluate(() => window.__openedLinks.length)) === 0, 'WhatsApp não abre sem consentimento');
  await page.locator('#privacyConsent').check();
  await page.getByRole('button', { name: /Preparar pedido no WhatsApp/ }).click();
  const opened = await page.evaluate(() => window.__openedLinks.slice());
  check(opened.length === 1, 'um link do WhatsApp é preparado após o consentimento');
  const whatsapp = new URL(opened[0]);
  check(whatsapp.hostname === 'wa.me' && whatsapp.pathname === '/5521994866035', 'destino do pedido é o WhatsApp oficial');
  const message = whatsapp.searchParams.get('text') || '';
  check(message.includes('1 × Pistache') && message.includes('1 × Ganache de Chocolate'), 'resumo inclui os itens e quantidades editados');
  check(message.includes('R$ 58,00') || message.includes('R$ 58,00'), 'resumo inclui o subtotal atualizado');
  check(message.includes('Arena QA') && message.includes('Preferência registrada no teste'), 'resumo inclui os campos opcionais');
  check(!/pedido confirmado/i.test(message), 'a mensagem não afirma confirmação automática');
  check((await page.locator('#orderStatus').innerText()).includes('a equipe confirma'), 'interface informa que a equipe confirma o pedido');

  await page.locator('input[name="fulfillment"][value="delivery"]').check();
  check(await page.locator('#deliveryPanel').isVisible(), 'opção de entrega mostra o 99Food');
  check(await page.locator('#pickupPanel').isHidden(), 'entrega não envia o carrinho de retirada pelo WhatsApp');
  check(await page.locator('#deliveryPanel a').getAttribute('href') === 'https://oia.99app.com/dlp9/f4lZFm?area=BR', 'destino de entrega corresponde ao Linktree oficial');
  await page.getByRole('button', { name: 'Limpar pedido' }).click();
  check((await page.locator('#cartSubtotal').innerText()).replace(/\s/g, ' ') === 'R$ 0,00', 'carrinho pode ser esvaziado');
  await page.locator('[data-close-cart]').click();

  await page.getByRole('button', { name: 'Política de Privacidade' }).click();
  check(await page.locator('#privacidade').evaluate((dialog) => dialog.open), 'modal de privacidade abre');
  await page.keyboard.press('Escape');
  check(!(await page.locator('#privacidade').evaluate((dialog) => dialog.open)), 'Escape fecha privacidade');
  await page.getByRole('button', { name: 'Termos de Uso' }).click();
  check(await page.locator('#termos').evaluate((dialog) => dialog.open), 'modal de termos abre');
  await page.keyboard.press('Escape');
  check(!(await page.locator('#termos').evaluate((dialog) => dialog.open)), 'Escape fecha termos');

  const viewports = [[1440, 900], [768, 1024], [390, 844]];
  const widths = [];
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(100);
    const result = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    widths.push({ width, overflow: result.scroll - result.client });
    check(result.scroll === result.client, `sem scroll horizontal em ${width}px (doc ${result.scroll}, client ${result.client})`);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole('button', { name: 'Abrir navegação' }).click();
  check(await page.locator('#mobileNav').isVisible(), 'navegação móvel abre');
  await page.locator('#mobileNav a[href="#cardapio"]').click();
  check(await page.locator('#mobileNav').isHidden(), 'navegação móvel fecha após escolher um destino');

  const openConsoleErrors = errors.slice();
  check(openConsoleErrors.length === 0, `nenhum erro de JavaScript/console: ${openConsoleErrors.join(' | ') || 'ok'}`);
  await page.close();

  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await reduced.goto(url, { waitUntil: 'load', timeout: 60000 });
  await reduced.waitForTimeout(350);
  const motion = await reduced.evaluate(() => ({
    running: document.getAnimations().filter((animation) => animation.playState === 'running').length,
    hiddenReveals: [...document.querySelectorAll('.rev,.rv-fade,.rv-scale,.rv-left,.rv-right,.rv-clip,[data-reveal]')]
      .filter((element) => {
        const style = getComputedStyle(element);
        return Number.parseFloat(style.opacity) === 0 || (style.clipPath !== 'none' && /100%/.test(style.clipPath));
      }).length,
    movingVideos: [...document.querySelectorAll('video[data-video]')].filter((video) => !video.paused).length,
  }));
  check(motion.running === 0, `reduced-motion encerra animações CSS (${motion.running} ativas)`);
  check(motion.hiddenReveals === 0, `reduced-motion não deixa conteúdo oculto (${motion.hiddenReveals})`);
  check(motion.movingVideos === 0, `reduced-motion pausa vídeos (${motion.movingVideos} reproduzindo)`);
  await reduced.close();

  console.log(`E2E PASS · ${assertions} verificações · viewports ${widths.map((x) => `${x.width}px=${x.overflow}px`).join(', ')} · reduced-motion CSS/vídeo/reveals ok`);
} catch (error) {
  console.error('E2E FAIL:', error.stack || error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
