#!/usr/bin/env node
/**
 * COLLECT-MEDIA PASS 2 — coleta via Playwright real:
 *  1. Linktree oficial (linktr.ee/cloesaint2026) -> JSON + PDF do Cardápio 2026 (2 páginas) + logo
 *  2. Carrosséis de fotos oficiais @cloesaintpadaria (Dfmd5CXFZl7, DfuKPw-lfY8, DfSKV9dlY8Z, DezEKWxlTxU)
 *  3. Google Maps oficial -> horários expandidos completos + mais avaliações 5 estrelas reais
 *  4. Extração de frames limpos em alta resolução dos MP4s oficiais já baixados
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const OUT = 'media-raw';
for (const d of ['ig/photos', 'ig/stills', 'menu', 'brand', 'maps']) {
  mkdirSync(`${OUT}/${d}`, { recursive: true });
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const log = [];
const note = (m) => { console.log(m); log.push(m); };

const { chromium } = await import('playwright');
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({
  locale: 'pt-BR',
  viewport: { width: 1440, height: 1000 },
  userAgent: UA
});

/* ---------- 1. Linktree oficial via navegador real ---------- */
try {
  const page = await ctx.newPage();
  await page.goto('https://linktr.ee/cloesaint2026', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  const ltData = await page.evaluate(() => {
    const el = document.getElementById('__NEXT_DATA__');
    if (el) {
      try { return JSON.parse(el.textContent); } catch {}
    }
    return {
      htmlLinks: [...document.querySelectorAll('a[href]')].map(a => ({ text: a.innerText.trim(), href: a.href }))
    };
  });
  writeFileSync(`${OUT}/brand/linktree-full.json`, JSON.stringify(ltData, null, 2));
  const rawJson = JSON.stringify(ltData);
  const ugcUrls = [...new Set([...rawJson.matchAll(/https:\/\/ugc\.production\.linktr\.ee\/[^"\\?\s]+/g)].map(m => m[0]))];
  note(`linktree ugc urls encontradas: ${ugcUrls.length}`);
  let idx = 0;
  for (const u of ugcUrls) {
    idx++;
    try {
      const resp = await ctx.request.get(u);
      if (resp.ok()) {
        const buf = await resp.body();
        const ct = resp.headers()['content-type'] || '';
        if (/pdf/i.test(ct) || /\.pdf$/i.test(u)) {
          writeFileSync(`${OUT}/menu/cardapio.pdf`, buf);
          note(`OK cardapio.pdf (${buf.length} bytes) <- ${u}`);
        } else {
          const ext = /\.png$/i.test(u) || /png/i.test(ct) ? 'png' : 'jpg';
          writeFileSync(`${OUT}/brand/lt-${idx}.${ext}`, buf);
          note(`OK brand/lt-${idx}.${ext} (${buf.length} bytes) <- ${u}`);
        }
      }
    } catch (e) {
      note(`erro baixando ${u}: ${String(e).slice(0, 100)}`);
    }
  }
  await page.close();
} catch (e) {
  note('linktree playwright erro: ' + String(e).slice(0, 160));
}

/* ---------- 2. Carrosséis de fotos oficiais do Instagram via Playwright ---------- */
const PHOTO_POSTS = ['Dfmd5CXFZl7', 'DfuKPw-lfY8', 'DfSKV9dlY8Z', 'DezEKWxlTxU'];
for (const code of PHOTO_POSTS) {
  try {
    const page = await ctx.newPage();
    const captured = new Map();
    page.on('response', async (resp) => {
      const u = resp.url();
      if (/cdninstagram\.com|fbcdn\.net/.test(u) && /\.(jpe?g|webp)/i.test(u.split('?')[0]) && !/s150x150|p50x50|t51\.2885-19/i.test(u)) {
        try {
          const b = await resp.body();
          if (b.length > 18000) captured.set(u.split('?')[0], b);
        } catch {}
      }
    });
    await page.goto(`https://www.instagram.com/p/${code}/embed/captioned/`, { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
    await page.waitForTimeout(1800);
    // Clica na seta "Avançar" do carrossel até 5 vezes para carregar todos os slides
    for (let s = 0; s < 5; s++) {
      const nextBtn = page.locator('button.coreSpriteRightChevron, button[aria-label*="Avan" i], button[aria-label*="Next" i], .RightChevron').first();
      if (await nextBtn.count()) {
        await nextBtn.click().catch(() => {});
        await page.waitForTimeout(1100);
      } else break;
    }
    let si = 0;
    for (const [, buf] of captured) {
      si++;
      const fname = `${OUT}/ig/photos/${code}_${si}.jpg`;
      writeFileSync(fname, buf);
      note(`OK ${fname} (${buf.length} bytes)`);
    }
    await page.close();
  } catch (e) {
    note(`ig carousel ${code} erro: ${String(e).slice(0, 120)}`);
  }
}

/* ---------- 3. Google Maps: horários completos dia a dia + avaliações 5 estrelas ---------- */
try {
  const page = await ctx.newPage();
  const mapsUrl = 'https://www.google.com/maps/place/Cl%C3%B4+%26+Saint/@-22.9554073,-43.1784101,17z/data=!4m15!1m8!3m7!1s0x997f3ce80fa82f:0xeabf2f0579e7b1af!2zQ2zDtCAmIFNhaW50!8m2!3d-22.9554073!4d-43.1784101!10e9!16s%2Fg%2F11vc58f397!3m5!1s0x997f3ce80fa82f:0xeabf2f0579e7b1af!8m2!3d-22.9554073!4d-43.1784101!16s%2Fg%2F11vc58f397?hl=pt-BR';
  await page.goto(mapsUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);
  const acceptBtn = page.locator('button:has-text("Aceitar tudo"), button:has-text("Accept all"), form[action*="consent"] button').first();
  if (await acceptBtn.count()) {
    await acceptBtn.click().catch(() => {});
    await page.waitForTimeout(2800);
  }
  // Extrai tabela de horários direto do DOM (mesmo oculta em table.eK4R0e / tr.y0skZc)
  const hoursTable = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('table tr')].map(tr => tr.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean);
    const ariaHours = [...document.querySelectorAll('[aria-label*="feira" i], [aria-label*="domingo" i], [aria-label*="sábado" i], [data-item-id="oh"]')]
      .map(e => e.getAttribute('aria-label') || e.innerText);
    // Foto de capa da ficha
    const heroImg = document.querySelector('button[jsaction*="heroHeaderImage"] img, .ZKCDEc img')?.getAttribute('src') || '';
    return { rows, ariaHours, heroImg };
  });
  writeFileSync(`${OUT}/maps/hours-table.json`, JSON.stringify(hoursTable, null, 2));

  // Mais avaliações reais rolando o painel de avaliações
  const revTab = page.locator('button[role="tab"]:has-text("Avalia"), button[role="tab"]:has-text("Reviews")').first();
  if (await revTab.count()) {
    await revTab.click().catch(() => {});
    await page.waitForTimeout(2500);
    // Rola a lista de avaliações para pegar 15+ avaliações completas
    const feed = page.locator('div[role="main"] div.m6QErb.DxyBCb').first();
    for (let s = 0; s < 5; s++) {
      await feed.evaluate(el => { el.scrollTop += 1400; }).catch(() => {});
      await page.waitForTimeout(900);
    }
    const moreBtns = await page.locator('button.w8nwRe, button[aria-label*="Ver mais" i], button:has-text("Mais")').all();
    for (const b of moreBtns.slice(0, 25)) {
      await b.click().catch(() => {});
    }
    await page.waitForTimeout(800);
    const reviews = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-review-id]')];
      const seen = new Set();
      const out = [];
      for (const c of cards) {
        const id = c.getAttribute('data-review-id');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const author = c.querySelector('.d4r55')?.innerText?.trim() || '';
        const stars = c.querySelector('[role="img"][aria-label*="estrela" i], [role="img"][aria-label*="star" i]')?.getAttribute('aria-label') || '';
        const when = c.querySelector('.rsqaWe')?.innerText?.trim() || '';
        const text = c.querySelector('.wiI7pd')?.innerText?.trim() || '';
        if (author && text) out.push({ author, stars, when, text });
      }
      return out;
    });
    writeFileSync(`${OUT}/maps/reviews-full.json`, JSON.stringify(reviews, null, 2));
    note(`maps reviews completas: ${reviews.length}`);
  }
  await page.close();
} catch (e) {
  note('maps extra erro: ' + String(e).slice(0, 160));
}

await browser.close();

/* ---------- 4. Frames limpos em alta resolução dos vídeos oficiais ---------- */
const STILLS = [
  // DfZ5WXXBUsT.mp4: croissants forno, croissant partido, focaccia, sourdough, pão embalado c/ selo, logo oficial no fim
  ['DfZ5WXXBUsT.mp4', '00:00:00.8', 'croissants-forno.webp'],
  ['DfZ5WXXBUsT.mp4', '00:00:10.5', 'focaccia-alecrim.webp'],
  ['DfZ5WXXBUsT.mp4', '00:00:12.5', 'sourdough-forno.webp'],
  ['DfZ5WXXBUsT.mp4', '00:00:15.0', 'pao-selo-cloesaint.webp'],
  ['DfZ5WXXBUsT.mp4', '00:00:17.5', 'brand-card-oficial.png'],
  // DfXB2A2vndu.mp4 (sem legendas!): salão vidro, manhã da clô, panquecas, mesa da clô, fachada
  ['DfXB2A2vndu.mp4', '00:00:00.6', 'salao-vidro-botafogo.webp'],
  ['DfXB2A2vndu.mp4', '00:00:02.2', 'manha-da-clo-poche.webp'],
  ['DfXB2A2vndu.mp4', '00:00:04.2', 'panquecas-maple.webp'],
  ['DfXB2A2vndu.mp4', '00:00:06.2', 'mesa-da-clo-flor.webp'],
  ['DfXB2A2vndu.mp4', '00:00:08.5', 'panquecas-frutas-brunch.webp'],
  ['DfXB2A2vndu.mp4', '00:00:10.5', 'manha-da-clo-mesa.webp'],
  ['DfXB2A2vndu.mp4', '00:00:12.2', 'fachada-letreiro-cloesaint.webp'],
  // DfFdEltBd2c.mp4 (sem legendas!): croissant rasgando + pizzas na massa de croissant
  ['DfFdEltBd2c.mp4', '00:00:00.5', 'croissant-maos.webp'],
  ['DfFdEltBd2c.mp4', '00:00:03.8', 'croissant-alveolos.webp'],
  ['DfFdEltBd2c.mp4', '00:00:09.0', 'pizzas-massa-croissant.webp'],
  // DfAIvjwhlTJ.mp4 (sem legendas!): preparo artesanal da massa e bannetons
  ['DfAIvjwhlTJ.mp4', '00:00:03.5', 'massa-artesanal-bancada.webp'],
  // Dc1Gj1wBpnA.mp4: Dadá fundadora + salão visto do alto
  ['Dc1Gj1wBpnA.mp4', '00:00:03.6', 'dada-fundadora.webp'],
  ['Dc1Gj1wBpnA.mp4', '00:00:17.5', 'salao-alto-plantas.webp']
];

for (const [vid, ts, outName] of STILLS) {
  const src = `${OUT}/ig/${vid}`;
  if (!existsSync(src)) continue;
  try {
    execSync(`ffmpeg -v error -y -ss ${ts} -i "${src}" -frames:v 1 -q:v 82 "${OUT}/ig/stills/${outName}"`);
    note(`OK still ${outName}`);
  } catch (e) {
    note(`FAIL still ${outName}: ${String(e).slice(0, 90)}`);
  }
}

writeFileSync(`${OUT}/pass2-log.json`, JSON.stringify(log, null, 2));
note('pass 2 concluído.');
