#!/usr/bin/env node
/**
 * COLLECT-MEDIA — roda no GitHub Actions (rede livre).
 * Coleta APENAS informações e mídias públicas e oficiais da Clô & Saint:
 *  1. Linktree oficial (linktr.ee/cloesaint2026) -> JSON, logo/avatar e PDF do Cardápio (2 páginas)
 *  2. Instagram oficial (@cloesaintpadaria) -> fotos, carrosséis e Reels publicados pela própria marca
 *  3. Google Maps oficial (Clô & Saint, Botafogo) -> dados da ficha, avaliações reais em texto e aba "Pelo proprietário"
 *  4. Site institucional (cloesaint.com.br, se acessível)
 */
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';

const OUT = 'media-raw';
for (const d of ['ig', 'maps', 'maps/owner', 'menu', 'brand']) {
  mkdirSync(`${OUT}/${d}`, { recursive: true });
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const H = { 'user-agent': UA, 'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8' };
const log = [];
const note = (m) => { console.log(m); log.push(m); };
const unesc = (s) => s.replace(/\\u0026/g, '&').replace(/\\&/g, '&').replace(/\\=/g, '=').replace(/\\\//g, '/').replace(/&amp;/g, '&');

async function get(url, headers = {}) {
  return fetch(url, { headers: { ...H, ...headers }, redirect: 'follow' });
}

async function save(url, dest, min = 1500) {
  try {
    const r = await get(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const b = Buffer.from(await r.arrayBuffer());
    if (b.length < min) throw new Error('pequeno: ' + b.length);
    writeFileSync(dest, b);
    note(`OK   ${dest} (${b.length} bytes)`);
    return b.length;
  } catch (e) {
    note(`FAIL ${dest}: ${String(e).slice(0, 120)}`);
    return 0;
  }
}

const manifest = {
  collectedAt: new Date().toISOString(),
  client: 'Clô & Saint',
  linktree: {},
  ig: [],
  maps: { ownerPhotos: [], info: {}, reviews: [] },
  brand: []
};

/* ---------- 1. Linktree oficial (linktr.ee/cloesaint2026) ---------- */
try {
  const r = await get('https://linktr.ee/cloesaint2026');
  const html = await r.text();
  note(`linktree: HTTP ${r.status}, ${html.length} bytes`);
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (m) {
    const nextData = JSON.parse(m[1]);
    const acc = nextData?.props?.pageProps?.account || {};
    const links = nextData?.props?.pageProps?.links || acc?.links || [];
    manifest.linktree = {
      username: acc.username,
      pageTitle: acc.pageTitle,
      description: acc.description,
      profilePictureUrl: acc.profilePictureUrl,
      customAvatar: acc.customAvatar,
      theme: acc.theme,
      links: links.map(l => ({
        id: l.id,
        title: l.title,
        url: l.url,
        type: l.type,
        modifiers: l.modifiers,
        rules: l.rules
      }))
    };
    writeFileSync(`${OUT}/brand/linktree.json`, JSON.stringify(manifest.linktree, null, 2));
    if (acc.profilePictureUrl) {
      const cleanAvatar = acc.profilePictureUrl.split('?')[0];
      if (await save(cleanAvatar, `${OUT}/brand/linktree-avatar.jpg`, 500)) {
        manifest.brand.push({ file: 'linktree-avatar.jpg', url: cleanAvatar, source: 'Linktree oficial @cloesaint2026' });
      }
    }
    // Procura todos os PDFs ou imagens do Linktree
    const allUrls = [...new Set([...m[1].matchAll(/https:\/\/ugc\.production\.linktr\.ee\/[^"\\?\s]+/g)].map(x => x[0]))];
    note(`linktree ugc urls: ${allUrls.length}`);
    let ui = 0;
    for (const u of allUrls) {
      ui++;
      if (/\.pdf$/i.test(u)) {
        await save(u, `${OUT}/menu/cardapio.pdf`, 2000);
        manifest.linktree.pdfUrl = u;
      } else {
        const ext = (u.match(/\.(jpe?g|png|webp|svg)$/i)?.[1] || 'jpg').toLowerCase();
        await save(u, `${OUT}/brand/lt-ugc-${ui}.${ext}`, 500);
      }
    }
    // Também checa links com PDF em l.url ou modifiers
    for (const l of links) {
      const candidates = [l.url, l?.modifiers?.amazonAffiliate, JSON.stringify(l)].join(' ');
      const pdfMatch = candidates.match(/https?:\/\/[^"\\\s]+\.pdf[^"\\\s]*/i);
      if (pdfMatch && !existsSync(`${OUT}/menu/cardapio.pdf`)) {
        await save(pdfMatch[0], `${OUT}/menu/cardapio.pdf`, 2000);
        manifest.linktree.pdfUrl = pdfMatch[0];
      }
    }
  }
} catch (e) {
  note('linktree erro: ' + String(e).slice(0, 160));
}

/* ---------- 2. Instagram oficial (@cloesaintpadaria) ---------- */
// Posts confirmados como publicados pela própria @cloesaintpadaria (excluído DexUf-lNIXl que é de @aboadazs)
const OFFICIAL_CODES = [
  'DfuKPw-lfY8',
  'Dfmd5CXFZl7',
  'DfZ5WXXBUsT',
  'DfXB2A2vndu',
  'DfSKV9dlY8Z',
  'DfFdEltBd2c',
  'DfAIvjwhlTJ',
  'DezEKWxlTxU',
  'DdbtiTFx39g',
  'DdMOpwvB_N1',
  'Dc1Gj1wBpnA'
];
const seenCodes = new Set();

try {
  const r = await get('https://www.instagram.com/api/v1/users/web_profile_info/?username=cloesaintpadaria', {
    'x-ig-app-id': '936619743392459',
    'x-requested-with': 'XMLHttpRequest',
    referer: 'https://www.instagram.com/cloesaintpadaria/'
  });
  note('ig web_profile_info: HTTP ' + r.status);
  if (r.ok) {
    const j = await r.json();
    const u = j?.data?.user;
    if (u) {
      manifest.igProfile = {
        username: u.username,
        name: u.full_name,
        bio: u.biography,
        followers: u.edge_followed_by?.count,
        category: u.category_name,
        external_url: u.external_url,
        business_address: u.business_address_json,
        business_phone: u.business_phone_number,
        business_email: u.business_email
      };
      if (u.profile_pic_url_hd) {
        await save(u.profile_pic_url_hd, `${OUT}/brand/ig-profile-hd.jpg`, 800);
      }
      const edges = [
        ...(u.edge_owner_to_timeline_media?.edges || []),
        ...(u.edge_felix_video_timeline?.edges || [])
      ];
      note('ig edges no JSON: ' + edges.length);
      for (const { node: n } of edges) {
        const ownerUser = n?.owner?.username;
        if (ownerUser && ownerUser !== 'cloesaintpadaria') {
          note(`SKIP collab/terceiro ${n.shortcode} (owner=${ownerUser})`);
          continue;
        }
        const code = n.shortcode;
        if (seenCodes.has(code)) continue;
        seenCodes.add(code);
        if (!OFFICIAL_CODES.includes(code)) OFFICIAL_CODES.push(code);
        const cap = n.edge_media_to_caption?.edges?.[0]?.node?.text || '';
        const entry = {
          code,
          owner: ownerUser || 'cloesaintpadaria',
          type: n.__typename,
          is_video: n.is_video,
          date: n.taken_at_timestamp ? new Date(n.taken_at_timestamp * 1000).toISOString().slice(0, 10) : null,
          caption: cap,
          files: []
        };
        if (n.display_url && await save(n.display_url, `${OUT}/ig/${code}.jpg`)) entry.files.push(`${code}.jpg`);
        if (n.is_video && n.video_url && await save(n.video_url, `${OUT}/ig/${code}.mp4`, 15000)) entry.files.push(`${code}.mp4`);
        const kids = n.edge_sidecar_to_children?.edges || [];
        let ki = 0;
        for (const { node: k } of kids) {
          ki++;
          if (k.display_url && await save(k.display_url, `${OUT}/ig/${code}_${ki}.jpg`)) entry.files.push(`${code}_${ki}.jpg`);
          if (k.is_video && k.video_url && await save(k.video_url, `${OUT}/ig/${code}_${ki}.mp4`, 15000)) entry.files.push(`${code}_${ki}.mp4`);
        }
        manifest.ig.push(entry);
      }
    }
  }
} catch (e) {
  note('ig web_profile_info erro: ' + String(e).slice(0, 150));
}

// Fallback por embed público para cada shortcode oficial
for (const code of OFFICIAL_CODES) {
  try {
    const r = await get(`https://www.instagram.com/p/${code}/embed/captioned/`);
    const html = await r.text();
    note(`embed ${code}: HTTP ${r.status}, ${html.length} bytes`);
    // Verifica autor no embed para nunca pegar post de terceiro
    const userMatch = html.match(/class="UsernameText"[^>]*>([^<]+)</);
    const embedAuthor = userMatch ? userMatch[1].trim() : '';
    if (embedAuthor && embedAuthor !== 'cloesaintpadaria') {
      note(`SKIP embed ${code}: autor=${embedAuthor}`);
      continue;
    }
    let entry = manifest.ig.find(x => x.code === code);
    if (!entry) {
      entry = { code, owner: embedAuthor || 'cloesaintpadaria', via: 'embed', files: [] };
      manifest.ig.push(entry);
    }
    const disp = [...html.matchAll(/\\?"display_url\\?":\\?"([^"\\]+(?:\\\\\/[^"\\]+|\\[^"])*?)\\?"/g)]
      .map(m => unesc(m[1].replace(/\\\\/g, '\\')));
    const img = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/);
    const vid = html.match(/\\?"video_url\\?":\\?"(https:[^"]+?)\\?"/);
    const urls = [...new Set([...(img ? [unesc(img[1])] : []), ...disp])]
      .filter(u => !/s150x150|profile_pic/i.test(u));
    let i = 0;
    for (const u of urls.slice(0, 6)) {
      i++;
      const f = i === 1 ? `${code}.jpg` : `${code}_${i}.jpg`;
      if (!existsSync(`${OUT}/ig/${f}`) && await save(u, `${OUT}/ig/${f}`)) {
        entry.files.push(f);
      }
    }
    if (vid && !existsSync(`${OUT}/ig/${code}.mp4`)) {
      const vu = unesc(vid[1].replace(/\\\\/g, '\\'));
      if (await save(vu, `${OUT}/ig/${code}.mp4`, 15000)) entry.files.push(`${code}.mp4`);
    }
    const cap = html.match(/class="Caption"[\s\S]*?<\/div>/);
    if (cap && !entry.caption) {
      entry.caption = cap[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 900);
    }
  } catch (e) {
    note(`embed ${code} erro: ${String(e).slice(0, 120)}`);
  }
}

// Reels via yt-dlp para garantir vídeos MP4 reais
const REEL_CODES = ['Dc1Gj1wBpnA', 'DdMOpwvB_N1', 'DfXB2A2vndu', 'DfAIvjwhlTJ', 'DfFdEltBd2c', 'DdbtiTFx39g', 'DfZ5WXXBUsT'];
for (const code of REEL_CODES) {
  if (existsSync(`${OUT}/ig/${code}.mp4`)) continue;
  try {
    execSync(`yt-dlp -q --no-warnings --no-playlist -f "mp4/best" -o "${OUT}/ig/${code}.mp4" "https://www.instagram.com/p/${code}/"`, {
      stdio: 'pipe',
      timeout: 75000
    });
    if (existsSync(`${OUT}/ig/${code}.mp4`)) {
      note(`OK   yt-dlp ${code}.mp4 (${statSync(`${OUT}/ig/${code}.mp4`).size} bytes)`);
    }
  } catch (e) {
    note(`yt-dlp ${code}: ${String(e.stderr || e).slice(0, 120).replace(/\n/g, ' ')}`);
  }
}

/* ---------- 3. Site antigo (cloesaint.com.br) se responder ---------- */
try {
  const r = await get('https://cloesaint.com.br/');
  if (r.ok) {
    const html = await r.text();
    writeFileSync(`${OUT}/brand/cloesaint-site.html`, html.slice(0, 120000));
    const imgs = [...new Set([...html.matchAll(/https?:\/\/[^"'\s>]+\.(?:png|svg|webp|jpe?g)/gi)].map(m => m[0]))];
    let si = 0;
    for (const u of imgs.slice(0, 15)) {
      si++;
      const ext = (u.match(/\.(png|svg|webp|jpe?g)$/i)?.[1] || 'png').toLowerCase();
      await save(u, `${OUT}/brand/site-${si}.${ext}`, 400);
    }
  }
} catch (e) {
  note('cloesaint.com.br indisponivel: ' + String(e).slice(0, 100));
}

/* ---------- 4. Google Maps via Playwright (ficha + avaliações reais + aba Pelo proprietário) ---------- */
try {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({
    locale: 'pt-BR',
    viewport: { width: 1440, height: 960 },
    userAgent: UA
  });
  const page = await ctx.newPage();
  const mapsUrl = 'https://www.google.com/maps/place/Cl%C3%B4+%26+Saint/@-22.9554073,-43.1784101,17z/data=!4m15!1m8!3m7!1s0x997f3ce80fa82f:0xeabf2f0579e7b1af!2zQ2zDtCAmIFNhaW50!8m2!3d-22.9554073!4d-43.1784101!10e9!16s%2Fg%2F11vc58f397!3m5!1s0x997f3ce80fa82f:0xeabf2f0579e7b1af!8m2!3d-22.9554073!4d-43.1784101!16s%2Fg%2F11vc58f397?hl=pt-BR';
  await page.goto(mapsUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);

  // Aceita banner de cookies do Google se aparecer
  const acceptBtn = page.locator('button:has-text("Aceitar tudo"), button:has-text("Accept all"), form[action*="consent"] button').first();
  if (await acceptBtn.count()) {
    await acceptBtn.click().catch(() => {});
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: `${OUT}/maps/ficha-overview.png` });

  // Extrai dados visíveis da visão geral
  const info = await page.evaluate(() => {
    const txt = (sel) => document.querySelector(sel)?.innerText?.trim() || '';
    const allButtons = [...document.querySelectorAll('button,[data-item-id],[aria-label]')]
      .map(el => ({
        itemId: el.getAttribute('data-item-id') || '',
        aria: el.getAttribute('aria-label') || '',
        text: (el.innerText || '').trim().slice(0, 200)
      }))
      .filter(x => x.itemId || /endere|hor[áa]rio|telefone|avali|estrela|website|card[áa]pio|menu/i.test(x.aria));
    return {
      title: txt('h1'),
      ratingText: txt('.F7nice'),
      category: txt('button[jsaction*="category"]'),
      panelText: (document.querySelector('[role="main"]')?.innerText || '').slice(0, 5000),
      items: allButtons.slice(0, 40)
    };
  });
  manifest.maps.info = info;
  writeFileSync(`${OUT}/maps/place-info.json`, JSON.stringify(info, null, 2));

  // Abre horários completos se houver botão de expansão
  const hoursToggle = page.locator('[data-item-id*="oh"], [aria-label*="horário" i], [aria-label*="Hours" i]').first();
  if (await hoursToggle.count()) {
    await hoursToggle.click().catch(() => {});
    await page.waitForTimeout(1000);
    const hoursText = await page.evaluate(() => (document.querySelector('[role="main"]')?.innerText || '').slice(0, 6000));
    writeFileSync(`${OUT}/maps/hours-expanded.txt`, hoursText);
  }

  // Aba Avaliações (somente texto real e nome do autor, sem baixar foto de cliente)
  const revTab = page.locator('button[role="tab"]:has-text("Avalia"), button[role="tab"]:has-text("Reviews")').first();
  if (await revTab.count()) {
    await revTab.click().catch(() => {});
    await page.waitForTimeout(2800);
    // Expande botões "Mais" nos textos de avaliação
    const moreBtns = await page.locator('button[aria-label*="Ver mais" i], button:has-text("Mais")').all();
    for (const b of moreBtns.slice(0, 12)) {
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
        const author = c.querySelector('.d4r55')?.innerText?.trim() || c.getAttribute('aria-label') || '';
        const stars = c.querySelector('[role="img"][aria-label*="estrela" i], [role="img"][aria-label*="star" i]')?.getAttribute('aria-label') || '';
        const when = c.querySelector('.rsqaWe')?.innerText?.trim() || '';
        const text = c.querySelector('.wiI7pd')?.innerText?.trim() || '';
        if (author && text) out.push({ author, stars, when, text });
      }
      return out.slice(0, 15);
    });
    manifest.maps.reviews = reviews;
    writeFileSync(`${OUT}/maps/reviews.json`, JSON.stringify(reviews, null, 2));
    note(`maps reviews reais extraídas: ${reviews.length}`);
  }

  // Aba Fotos -> procura especificamente "Pelo proprietário" / "By owner"
  const photosTab = page.locator('button[role="tab"]:has-text("Fotos"), button[role="tab"]:has-text("Photos"), button[aria-label*="Foto" i]').first();
  if (await photosTab.count()) {
    await photosTab.click().catch(() => {});
    await page.waitForTimeout(2800);
    const ownerChip = page.locator('button[role="tab"]:has-text("proprietário"), button[role="tab"]:has-text("By owner"), button:has-text("Pelo proprietário"), button:has-text("By owner")').first();
    const hasOwnerTab = (await ownerChip.count()) > 0;
    note(`maps aba Pelo proprietário encontrada: ${hasOwnerTab}`);
    if (hasOwnerTab) {
      await ownerChip.click().catch(() => {});
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${OUT}/maps/owner-tab.png` });
      const ownerUrls = await page.evaluate(() => {
        const urls = new Set();
        for (const el of document.querySelectorAll('a[data-photo-index] div[style*="background-image"], div[role="img"][style*="background-image"], img[src*="googleusercontent.com"]')) {
          const st = el.getAttribute('style') || '';
          const m = st.match(/https:\/\/lh3\.googleusercontent\.com\/[^")]+/);
          if (m) urls.add(m[0].split('=')[0]);
          const src = el.getAttribute('src') || '';
          if (/lh3\.googleusercontent\.com\/(p|gps|places|grass)/.test(src)) urls.add(src.split('=')[0]);
        }
        return [...urls];
      });
      note(`maps fotos do proprietário: ${ownerUrls.length}`);
      let oi = 0;
      for (const u of ownerUrls.slice(0, 20)) {
        oi++;
        const f = `owner-${String(oi).padStart(2, '0')}.jpg`;
        if (await save(`${u}=w1400-h1400-k-no`, `${OUT}/maps/owner/${f}`, 4000)) {
          manifest.maps.ownerPhotos.push({ file: f, url: u, byOwner: true });
        }
      }
    }
  }

  await browser.close();
} catch (e) {
  note('maps playwright erro: ' + String(e).slice(0, 200));
}

manifest.log = log;
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
note('manifesto finalizado.');
