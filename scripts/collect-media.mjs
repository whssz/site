#!/usr/bin/env node
/**
 * COLLECT-MEDIA — roda no runner do GitHub Actions (rede livre).
 * Baixa a mídia PÚBLICA publicada pela própria Confeitaria Agridoce:
 *   · Instagram oficial @confeitariagridoce (sem login; só endpoints públicos/embeds)
 *   · ficha pública do Google Maps (fotos expostas no HTML da ficha)
 * Salva os originais em media-raw/ + um manifesto, para curadoria humana
 * (ver, escolher, otimizar). Nada daqui vai direto para o site.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const OUT = 'media-raw';
mkdirSync(OUT + '/ig', { recursive: true });
mkdirSync(OUT + '/maps', { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const H = { 'user-agent': UA, 'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8' };
const log = [];
const note = (m) => { console.log(m); log.push(m); };
const unesc = (s) => s.replace(/\\u0026/g, '&').replace(/\\u003d/g, '=').replace(/\\\//g, '/').replace(/&amp;/g, '&');

async function get(url, headers = {}) {
  const r = await fetch(url, { headers: { ...H, ...headers }, redirect: 'follow' });
  return r;
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
  } catch (e) { note(`FAIL ${dest}: ${String(e).slice(0, 90)}`); return false; }
}

const manifest = { collectedAt: new Date().toISOString(), ig: [], maps: [] };
const CODES = ['C_gACe3JM9G','DfsmK6WxiD_','DfVwaFIs2Pe','DfNWmt0s7wJ','DfH4rfEMRJf','DezMOhXRj00','DecvfRxMrf1','DeRjxN4RQ8_','DdXc3QYmoVl','DdU1frxOqX8','DdHyFZ_sT0g','DdHxShtsvxL','DdHUJDOMQ4D'];
const seen = new Set();

/* ---------- 1. Instagram: API pública de perfil web ---------- */
try {
  const r = await get('https://www.instagram.com/api/v1/users/web_profile_info/?username=confeitariagridoce',
    { 'x-ig-app-id': '936619743392459', 'x-requested-with': 'XMLHttpRequest', referer: 'https://www.instagram.com/confeitariagridoce/' });
  note('web_profile_info: HTTP ' + r.status);
  if (r.ok) {
    const j = await r.json();
    const u = j?.data?.user;
    if (u) {
      manifest.profile = { bio: u.biography, name: u.full_name, followers: u.edge_followed_by?.count, category: u.category_name, external_url: u.external_url, business_address: u.business_address_json };
      if (u.profile_pic_url_hd) await save(u.profile_pic_url_hd, `${OUT}/ig/_profile.jpg`, 1000);
      const edges = [...(u.edge_owner_to_timeline_media?.edges || []), ...(u.edge_felix_video_timeline?.edges || [])];
      note('posts no JSON: ' + edges.length);
      for (const { node: n } of edges) {
        const code = n.shortcode; if (seen.has(code)) continue; seen.add(code);
        const cap = n.edge_media_to_caption?.edges?.[0]?.node?.text || '';
        const entry = { code, type: n.__typename, is_video: n.is_video, date: new Date(n.taken_at_timestamp * 1000).toISOString().slice(0, 10), caption: cap, files: [] };
        if (await save(n.display_url, `${OUT}/ig/${code}.jpg`)) entry.files.push(`${code}.jpg`);
        if (n.is_video && n.video_url && await save(n.video_url, `${OUT}/ig/${code}.mp4`, 20000)) entry.files.push(`${code}.mp4`);
        const kids = n.edge_sidecar_to_children?.edges || [];
        let i = 0;
        for (const { node: k } of kids) {
          i++; if (i === 1) continue;
          if (await save(k.display_url, `${OUT}/ig/${code}_${i}.jpg`)) entry.files.push(`${code}_${i}.jpg`);
          if (k.is_video && k.video_url && await save(k.video_url, `${OUT}/ig/${code}_${i}.mp4`, 20000)) entry.files.push(`${code}_${i}.mp4`);
        }
        manifest.ig.push(entry);
      }
    }
  }
} catch (e) { note('web_profile_info erro: ' + String(e).slice(0, 120)); }

/* ---------- 2. Instagram: página pública de embed de cada post ---------- */
for (const code of CODES) {
  if (existsSync(`${OUT}/ig/${code}.jpg`)) continue;
  try {
    const r = await get(`https://www.instagram.com/p/${code}/embed/captioned/`);
    const html = await r.text();
    note(`embed ${code}: HTTP ${r.status}, ${html.length} bytes`);
    const entry = { code, via: 'embed', files: [] };
    const disp = [...html.matchAll(/\\?"display_url\\?":\\?"([^"\\]+(?:\\\\\/[^"\\]+|\\[^"])*?)\\?"/g)].map(m => unesc(m[1].replace(/\\\\/g, '\\')));
    const img = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/);
    const vid = html.match(/\\?"video_url\\?":\\?"(https:[^"]+?)\\?"/);
    const urls = [...new Set([...(img ? [unesc(img[1])] : []), ...disp])];
    let i = 0;
    for (const u of urls.slice(0, 6)) { i++; const f = i === 1 ? `${code}.jpg` : `${code}_${i}.jpg`; if (await save(u, `${OUT}/ig/${f}`)) entry.files.push(f); }
    if (vid) { const vu = unesc(vid[1].replace(/\\\\/g, '\\')); if (await save(vu, `${OUT}/ig/${code}.mp4`, 20000)) entry.files.push(`${code}.mp4`); }
    const cap = html.match(/class="Caption"[\s\S]*?<\/div>/);
    if (cap) entry.captionHtml = cap[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400);
    if (!urls.length) writeFileSync(`${OUT}/ig/_embed_${code}.html`, html.slice(0, 60000));
    manifest.ig.push(entry);
  } catch (e) { note(`embed ${code} erro: ${String(e).slice(0, 100)}`); }
}

/* ---------- 3. Reels: yt-dlp anônimo para os vídeos que faltarem ---------- */
for (const code of CODES) {
  if (existsSync(`${OUT}/ig/${code}.mp4`)) continue;
  try {
    execSync(`yt-dlp -q --no-warnings --no-playlist -f "mp4/best" -o "${OUT}/ig/${code}.mp4" "https://www.instagram.com/p/${code}/"`, { stdio: 'pipe', timeout: 60000 });
    if (existsSync(`${OUT}/ig/${code}.mp4`)) note(`OK   yt-dlp ${code}.mp4`);
  } catch (e) { note(`yt-dlp ${code}: ${String(e.stderr || e).slice(0, 110).replace(/\n/g, ' ')}`); }
}

/* ---------- 4. Google Maps: fotos expostas na ficha pública ---------- */
const MAPS = 'https://www.google.com/maps/place/Confeitaria+Agridoce+-+Delivery/@-22.8763107,-43.4302937,17z/data=!3m1!4b1!4m6!3m5!1s0x996208ff48c357:0x30f5f949645b765d!8m2!3d-22.8763107!4d-43.4302937!16s%2Fg%2F11c80d3b8z?hl=pt-BR';
const known = [
  'https://lh3.googleusercontent.com/grass-cs/AABkmLdY0HzVum0jxuTQ37D-3vqC2IzgGdc7qHBHAHpbkQhDkqCDurWeEPGKQvj903ZFYypiBJ9jVr99siMlhOCjtnf9IV8m1glZHYr8HqWfV-o-CiEQhftRmxx1pvm6ZB3IAx9m1Qxr',
  'https://lh3.googleusercontent.com/grass-cs/AABkmLfznGJF6Jj86Maalrc0V7LgTQpFhdmQ_GbUEiOUgqKzw8nTKA3rL-sWIaF0NrhG0SQhkOeqbYFX5ABYPGyDHNocgG9Do12ECL6B-hK3W99lj97flTh39hNdzeVkhH39B5baHwG-'
];
try {
  const r = await get(MAPS, { cookie: 'CONSENT=YES+cb; SOCS=CAI' });
  const html = unesc(await r.text());
  note(`maps: HTTP ${r.status}, ${html.length} bytes`);
  const found = [...new Set([...html.matchAll(/https:\/\/lh3\.googleusercontent\.com\/(?:p|grass-cs|gps-cs-s|gps-proxy|places)\/[A-Za-z0-9_\-]+/g)].map(m => m[0]))];
  note('maps: URLs de foto no HTML: ' + found.length);
  const all = [...new Set([...found, ...known])];
  let i = 0;
  for (const u of all.slice(0, 40)) { i++; const f = `maps-${String(i).padStart(2, '0')}.jpg`; if (await save(u + '=w1600-h1600-k-no', `${OUT}/maps/${f}`)) manifest.maps.push({ file: f, url: u }); }
} catch (e) { note('maps erro: ' + String(e).slice(0, 120)); }

manifest.log = log;
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log('manifesto escrito.');
