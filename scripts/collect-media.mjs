#!/usr/bin/env node
/**
 * COLLECT-MEDIA — roda no runner do GitHub Actions (rede livre).
 * Baixa a mídia PÚBLICA e OFICIAL da Amunì a Caparica Pizzeria:
 *   · Instagram oficial @amuniacaparica (endpoints públicos/embeds, sem login)
 *   · ficha pública do Google Maps (fotos expostas no HTML da ficha)
 *   · cardápio oficial do Uber Eats (canal "Fazer uma encomenda" linkado no Maps)
 *   · Linktree oficial (logo e avatar) e site oficial amuni.pizza
 * Salva os originais em media-raw/ com manifesto, para curadoria local.
 * Nada aqui vai direto para o site sem seleção humana/visual.
 */
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';

const OUT = 'media-raw';
for (const d of ['ig', 'maps', 'menu', 'brand']) mkdirSync(`${OUT}/${d}`, { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const H = { 'user-agent': UA, 'accept-language': 'pt-PT,pt;q=0.9,en;q=0.8' };
const log = [];
const note = (m) => { console.log(m); log.push(m); };
const unesc = (s) => s.replace(/\\u0026/g, '&').replace(/\\u003d/g, '=').replace(/\\\//g, '/').replace(/&amp;/g, '&');

async function get(url, headers = {}) {
  return fetch(url, { headers: { ...H, ...headers }, redirect: 'follow' });
}
async function save(url, dest, min = 3000) {
  try {
    const r = await get(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const b = Buffer.from(await r.arrayBuffer());
    if (b.length < min) throw new Error('pequeno: ' + b.length);
    writeFileSync(dest, b);
    note(`OK   ${dest} (${b.length} bytes)`);
    return true;
  } catch (e) { note(`FAIL ${dest}: ${String(e).slice(0, 110)}`); return false; }
}

const manifest = { collectedAt: new Date().toISOString(), client: 'Amunì a Caparica Pizzeria', ig: [], maps: [], menu: [], brand: [] };

/* ---------- 1. Instagram: API pública de perfil web ---------- */
try {
  const r = await get('https://www.instagram.com/api/v1/users/web_profile_info/?username=amuniacaparica',
    { 'x-ig-app-id': '936619743392459', 'x-requested-with': 'XMLHttpRequest', referer: 'https://www.instagram.com/amuniacaparica/' });
  note('web_profile_info: HTTP ' + r.status);
  if (r.ok) {
    const j = await r.json();
    const u = j?.data?.user;
    if (u) {
      manifest.profile = { bio: u.biography, name: u.full_name, followers: u.edge_followed_by?.count, category: u.category_name, external_url: u.external_url };
      if (u.profile_pic_url_hd) await save(u.profile_pic_url_hd, `${OUT}/ig/_profile.jpg`, 1000);
      const edges = [...(u.edge_owner_to_timeline_media?.edges || []), ...(u.edge_felix_video_timeline?.edges || [])];
      note('posts no JSON: ' + edges.length);
      for (const { node: n } of edges) {
        const code = n.shortcode;
        const cap = n.edge_media_to_caption?.edges?.[0]?.node?.text || '';
        const entry = { code, type: n.__typename, is_video: n.is_video, date: new Date(n.taken_at_timestamp * 1000).toISOString().slice(0, 10), caption: cap, files: [] };
        if (await save(n.display_url, `${OUT}/ig/${code}.jpg`)) entry.files.push(`${code}.jpg`);
        if (n.is_video && n.video_url && await save(n.video_url, `${OUT}/ig/${code}.mp4`, 20000)) entry.files.push(`${code}.mp4`);
        const kids = n.edge_sidecar_to_children?.edges || [];
        let i = 0;
        for (const { node: k } of kids) {
          i++;
          if (k.display_url && await save(k.display_url, `${OUT}/ig/${code}_${i}.jpg`)) entry.files.push(`${code}_${i}.jpg`);
          if (k.is_video && k.video_url && await save(k.video_url, `${OUT}/ig/${code}_${i}.mp4`, 20000)) entry.files.push(`${code}_${i}.mp4`);
        }
        manifest.ig.push(entry);
      }
    }
  }
} catch (e) { note('web_profile_info erro: ' + String(e).slice(0, 140)); }

/* ---------- 2. Instagram: posts oficiais conhecidos (embed público) ---------- */
const CODES = ['DeMgLfJMksS','De4CQ-zsL7B','De2e8vKMtGQ','Dfe4bu0sBzY','DfcSPFtsJ4U','DfM2maPsfKg','DfFfEtcMewn','DfDHGc8Mbnh','DfAaX1cMbQP','De-RVEMMGzB','DezeX1vsMkj','DexMsW4MP0s'];
for (const code of CODES) {
  if (existsSync(`${OUT}/ig/${code}.jpg`)) continue;
  try {
    const r = await get(`https://www.instagram.com/p/${code}/embed/captioned/`);
    const html = await r.text();
    note(`embed ${code}: HTTP ${r.status}, ${html.length} bytes`);
    const entry = { code, via: 'embed', files: [] };
    const disp = [...html.matchAll(/\\?"display_url\\":\\?"([^"\\]+(?:\\\\\/[^"\\]+|\\[^"])*?)\\?"/g)].map(m => unesc(m[1].replace(/\\\\/g, '\\')));
    const img = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/);
    const urls = [...new Set([...(img ? [unesc(img[1])] : []), ...disp])];
    let i = 0;
    for (const u of urls.slice(0, 4)) { i++; const f = i === 1 ? `${code}.jpg` : `${code}_${i}.jpg`; if (await save(u, `${OUT}/ig/${f}`)) entry.files.push(f); }
    const cap = html.match(/class="Caption"[\s\S]*?<\/div>/);
    if (cap) entry.captionHtml = cap[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400);
    if (!urls.length) writeFileSync(`${OUT}/ig/_embed_${code}.html`, html.slice(0, 60000));
    manifest.ig.push(entry);
  } catch (e) { note(`embed ${code} erro: ${String(e).slice(0, 120)}`); }
}

/* ---------- 3. Reels: yt-dlp anônimo ---------- */
for (const code of CODES) {
  if (existsSync(`${OUT}/ig/${code}.mp4`)) continue;
  try {
    execSync(`yt-dlp -q --no-warnings --no-playlist -f "mp4/best" -o "${OUT}/ig/${code}.mp4" "https://www.instagram.com/p/${code}/"`, { stdio: 'pipe', timeout: 90000 });
    if (existsSync(`${OUT}/ig/${code}.mp4`)) note(`OK   yt-dlp ${code}.mp4 (${statSync(`${OUT}/ig/${code}.mp4`).size} bytes)`);
  } catch (e) { note(`yt-dlp ${code}: ${String(e.stderr || e).slice(0, 120).replace(/\n/g, ' ')}`); }
}

/* ---------- 4. Google Maps: fotos expostas na ficha pública ---------- */
const MAPS_URLS = [
  'https://www.google.com/maps/place/Amun%C3%AC+a+Caparica+Pizzeria/@38.6503608,-9.2450485,17z/data=!4m15!1m8!3m7!1s0xd1ecbdad8b5773f:0x9bcd396c41e9071!2sAmun%C3%AC+a+Caparica+Pizzeria!8m2!3d38.6503608!4d-9.2450485!10e9!16s%2Fg%2F11stts8spl!3m5!1s0xd1ecbdad8b5773f:0x9bcd396c41e9071!8m2!3d38.6503608!4d-9.2450485!16s%2Fg%2F11stts8spl?hl=pt-PT',
  'https://www.google.com/maps/place/Amun%C3%AC+a+Caparica+Pizzeria/data=!4m2!3m1!1s0xd1ecbdad8b5773f:0x9bcd396c41e9071?hl=pt-PT'
];
const knownMaps = [
  'https://lh3.googleusercontent.com/grass-cs/AABkmLfcolM8wLAs9Zsfud65Ohju1GwB5zijDlGy3gR9SEEkeRPq7srPcQWfy5hUF0k4Hevp8gXVgjNxMdKufgO8nifGWZbeWM8SwrK8y5qsvIzIhNuh83D4djPlfAknITCdSSknG6eytOi5Ebgl',
  'https://lh3.googleusercontent.com/grass-cs/AABkmLcDBTikMmpB4dT4smU8SZSLRo4hTE4RLidUayGRLc2xFcP4h4oqYsC6jCHd9i5MLMJGSC8stHEtbB6RxmBt83lm4k-4nTqyK_1TPSCsqEc8SCop4hrodeOBPD-ErJRXbrr7vPWz'
];
const mapsFound = new Set(knownMaps);
for (const murl of MAPS_URLS) {
  try {
    const r = await get(murl, { cookie: 'CONSENT=YES+cb; SOCS=CAI' });
    const html = unesc(await r.text());
    note(`maps: HTTP ${r.status}, ${html.length} bytes`);
    for (const m of html.matchAll(/https:\/\/lh3\.googleusercontent\.com\/(?:p|grass-cs|gps-cs-s|gps-proxy|places)\/[A-Za-z0-9_\-]+/g)) mapsFound.add(m[0]);
  } catch (e) { note('maps erro: ' + String(e).slice(0, 130)); }
}
note('maps: URLs de foto encontradas: ' + mapsFound.size);
let mi = 0;
for (const u of [...mapsFound].slice(0, 60)) {
  mi++;
  const f = `maps-${String(mi).padStart(2, '0')}.jpg`;
  if (await save(u + '=w1600-h1600-k-no', `${OUT}/maps/${f}`, 5000)) manifest.maps.push({ file: f, url: u });
}

/* ---------- 5. Cardápio oficial (Uber Eats linkado no Google Maps) ---------- */
const TB = 'https://tb-static.uber.com/prod/image-proc/processed_images/';
const TAIL = '/70aa2a4db7f990373ca9c376323e3dea.jpeg';
const MENU = {
  'loja-hero': '34bdfa5ecada53bc7aaab7f715c9bf32/63cdd1044c1bf03a6f4ce3a9422016b8.jpeg',
  'pizza-margherita': '9fe5116cd077212ebfaf139a56c32097' + TAIL,
  'pizza-margherita-dop': '6e90ec5f4669a4c60c50ddf0a801d243' + TAIL,
  'pizza-parmigiana': '408cd033293bb6cc293c5032f400abb3' + TAIL,
  'pizza-capricciosa': '44b895aaaa3f384b7333f1750ebded51' + TAIL,
  'pizza-salsiccia-friarielli': 'bd4ddbd0839b98d71ce19be0fa479dab' + TAIL,
  'pizza-napoli': '926217b82e7633fe7b21dd1896a4fe69' + TAIL,
  'pizza-bufalaccia': '25e72febcd31277bcc98a6e0d35b6637' + TAIL,
  'pizza-spacchiosa': '4b436393f7fd0dac112cf8a58bb14e8e' + TAIL,
  'pizza-ca-mortazza': 'd803ffa52bfbd10d479529ab16f11444' + TAIL,
  'pizza-amuni': '15f49a989c396acc35dcef0f3e207c9d' + TAIL,
  'pizza-vegan-spacchiosa': '12be5b13c71e695919a961abbaa3d998' + TAIL,
  'pizza-pepperoni': 'fa8221ec5a739e0f77a60f101fd6fcd6' + TAIL,
  'pizza-cotto-funghi': '8351dcfaf315f993db79c88c3cfb91f3' + TAIL,
  'pizza-al-funghi': '9771c306460166ac98f1e8576c865277' + TAIL,
  'pizza-super-diavola-vegan': 'bc131191a33eff3c5388e4cf39b530e9' + TAIL,
  'pizza-stracciata': 'd347525be1697655ea599ba7e16e56f6' + TAIL
};
for (const [name, path] of Object.entries(MENU)) {
  const f = `${name}.jpg`;
  if (await save(TB + path, `${OUT}/menu/${f}`, 4000)) manifest.menu.push({ file: f, name, url: TB + path });
}

/* ---------- 6. Marca: Linktree oficial + site oficial ---------- */
const BRAND = {
  'amuni-logo.png': 'https://ugc.production.linktr.ee/a1cdff72-d174-4171-8868-6c30a4a5950c_amunigigi-logo.png',
  'amuni-avatar.jpg': 'https://ugc.production.linktr.ee/0aee4e59-62a3-468e-92b4-0935f73dfcbc_WhatsApp-Image-2026-07-31-at-16.10.38.jpeg',
  'menu-thumb.png': 'https://ugc.production.linktr.ee/ccd17ccb-86cd-4cab-9f3a-a5a39758f665_menu.png'
};
for (const [f, url] of Object.entries(BRAND)) {
  if (await save(url, `${OUT}/brand/${f}`, 1000)) manifest.brand.push({ file: f, url });
}
try {
  const r = await get('https://amuni.pizza/pt');
  const html = unesc(await r.text());
  note('site oficial: HTTP ' + r.status + ', ' + html.length + ' bytes');
  const imgs = [...new Set([...html.matchAll(/https?:\/\/[^"'\\\s]+?\.(?:png|jpe?g|webp|svg)(?:\?[^"'\\\s]*)?/gi)].map(m => m[0]))];
  let i = 0;
  for (const u of imgs.slice(0, 12)) { i++; const f = `site-${String(i).padStart(2, '0')}.img`; if (await save(u, `${OUT}/brand/${f}`, 1000)) manifest.brand.push({ file: f, url: u }); }
} catch (e) { note('site oficial erro: ' + String(e).slice(0, 120)); }

manifest.log = log;
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
note('manifesto escrito.');
