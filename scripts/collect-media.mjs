#!/usr/bin/env node
/**
 * COLLECT-MEDIA — roda no runner do GitHub Actions (rede livre).
 * Baixa a mídia PÚBLICA e OFICIAL da Quatro em 1 (confeitaria, Campo Grande — RJ):
 *   · Instagram oficial @quatroem1 (endpoints públicos/embeds, sem login)
 *   · ficha pública do Google Maps (fotos expostas no HTML da ficha)
 *   · cardápio oficial whatsmenu.com.br/quatroem1 (linkado na bio oficial)
 *   · marca: logos publicados pelo próprio cliente no cardápio e no beacons.ai
 * Salva os originais em media-raw/ com manifesto, para curadoria local.
 * Nada aqui vai direto para o site sem seleção.
 */
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';

const OUT = 'media-raw';
for (const d of ['ig', 'maps', 'menu', 'brand']) mkdirSync(`${OUT}/${d}`, { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const H = { 'user-agent': UA, 'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8' };
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

const manifest = { collectedAt: new Date().toISOString(), client: 'Quatro em 1', ig: [], maps: [], menu: [], brand: [] };

/* ---------- 1. Instagram: API pública de perfil web ---------- */
try {
  const r = await get('https://www.instagram.com/api/v1/users/web_profile_info/?username=quatroem1',
    { 'x-ig-app-id': '936619743392459', 'x-requested-with': 'XMLHttpRequest', referer: 'https://www.instagram.com/quatroem1/' });
  note('web_profile_info: HTTP ' + r.status);
  if (r.ok) {
    const j = await r.json();
    const u = j?.data?.user;
    if (u) {
      manifest.profile = {
        bio: u.biography, name: u.full_name, followers: u.edge_followed_by?.count,
        category: u.category_name, external_url: u.external_url,
        ig_id: u.id, city: u.business_address_json?.city_name,
        category_list: (u.category_list || []).map(c => c?.name)
      };
      if (u.profile_pic_url_hd) await save(u.profile_pic_url_hd, `${OUT}/ig/_profile.jpg`, 1000);
      const edges = [...(u.edge_owner_to_timeline_media?.edges || []), ...(u.edge_felix_video_timeline?.edges || [])];
      note('posts no JSON: ' + edges.length);
      for (const { node: n } of edges) {
        const code = n.shortcode;
        const cap = n.edge_media_to_caption?.edges?.[0]?.node?.text || '';
        const entry = {
          code, type: n.__typename, is_video: n.is_video,
          date: new Date(n.taken_at_timestamp * 1000).toISOString().slice(0, 10),
          caption: cap, likes: n.edge_liked_by?.count, plays: n.video_view_count, files: []
        };
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
  } else {
    note('web_profile_info body: ' + (await r.text()).slice(0, 300));
  }
} catch (e) { note('web_profile_info erro: ' + String(e).slice(0, 160)); }

/* ---------- 2. Instagram: posts oficiais conhecidos (embed público) ---------- */
const CODES = [
  'DZNBQ8XR3cb', 'DYr33WWuuRg', 'DR4vwyNAPoh', 'DfxKvD2O4kk', 'DfvH3QERdpt',
  'DfsjES6O5Am', 'Dfr5lWWu2Li', 'Dfp7nXyuxKM', 'DfnWTr1umYP', 'Dfk0mV0ROCg',
  'DfiP0Htxt1h', 'DffWdyoOqdF'
];
for (const code of CODES) {
  if (existsSync(`${OUT}/ig/${code}.jpg`)) continue;
  try {
    const r = await get(`https://www.instagram.com/p/${code}/embed/captioned/`);
    const html = await r.text();
    note(`embed ${code}: HTTP ${r.status}, ${html.length} bytes`);
    const entry = { code, via: 'embed', files: [] };
    const disp = [...html.matchAll(/\\?"display_url\\?\":\\?\"([^\"\\\\]+(?:\\\\\/[^\"\\\\]+|\\\\[^\"])*?)\\?\"/g)].map(m => unesc(m[1].replace(/\\\\/g, '\\')));
    const img = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/);
    const urls = [...new Set([...(img ? [unesc(img[1])] : []), ...disp])];
    let i = 0;
    for (const u of urls.slice(0, 4)) { i++; const f = i === 1 ? `${code}.jpg` : `${code}_${i}.jpg`; if (await save(u, `${OUT}/ig/${f}`)) entry.files.push(f); }
    const cap = html.match(/class="Caption"[\s\S]*?<\/div>/);
    if (cap) entry.caption = cap[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600);
    if (!urls.length) writeFileSync(`${OUT}/ig/_embed_${code}.html`, html.slice(0, 60000));
    manifest.ig.push(entry);
  } catch (e) { note(`embed ${code} erro: ${String(e).slice(0, 130)}`); }
}

/* ---------- 3. Reels: yt-dlp anônimo ---------- */
for (const code of CODES) {
  if (existsSync(`${OUT}/ig/${code}.mp4`)) continue;
  try {
    execSync(`yt-dlp -q --no-warnings --no-playlist -f "mp4/best" -o "${OUT}/ig/${code}.mp4" "https://www.instagram.com/p/${code}/"`, { stdio: 'pipe', timeout: 120000 });
    if (existsSync(`${OUT}/ig/${code}.mp4`)) note(`OK   yt-dlp ${code}.mp4 (${statSync(`${OUT}/ig/${code}.mp4`).size} bytes)`);
  } catch (e) { note(`yt-dlp ${code}: ${String(e.stderr || e).slice(0, 130).replace(/\n/g, ' ')}`); }
}

/* ---------- 4. Google Maps: fotos expostas na ficha pública ---------- */
const PLACE_ID = '0x9be534751efb47:0x7c74f524fa4bd01f';
const MAPS_URLS = [
  `https://www.google.com/maps/place/Quatro+em+1/@-22.9076336,-43.5754456,17z/data=!3m1!4b1!4m6!3m5!1s${encodeURIComponent(PLACE_ID)}!8m2!3d-22.9076336!4d-43.5754456!16s%2Fg%2F11rjw65v1z?hl=pt-BR`,
  `https://www.google.com/maps/place/Quatro+em+1/data=!4m2!3m1!1s${encodeURIComponent(PLACE_ID)}?hl=pt-BR`,
  'https://www.google.com/maps/place/Quatro+em+1/@-22.9076336,-43.5754456,17z/data=!4m6!3m5!1s0x9be534751efb47:0x7c74f524fa4bd01f!8m2!3d-22.9076336!4d-43.5754456!16s%2Fg%2F11rjw65v1z!3m1!1e3?hl=pt-BR'
];
const mapsFound = new Set();
for (const murl of MAPS_URLS) {
  try {
    const r = await get(murl, { cookie: 'CONSENT=YES+cb; SOCS=CAI' });
    const html = unesc(await r.text());
    note(`maps: HTTP ${r.status}, ${html.length} bytes`);
    for (const m of html.matchAll(/https:\/\/lh3\.googleusercontent\.com\/(?:p|grass-cs|gps-cs-s|gps-proxy|places)\/[A-Za-z0-9_\-]+/g)) mapsFound.add(m[0]);
    for (const m of html.matchAll(/https:\/\/lh5\.googleusercontent\.com\/(?:p|grass-cs|gps-cs-s|places)\/[A-Za-z0-9_\-]+/g)) mapsFound.add(m[0]);
  } catch (e) { note('maps erro: ' + String(e).slice(0, 140)); }
}
note('maps: URLs de foto encontradas: ' + mapsFound.size);
let mi = 0;
for (const u of [...mapsFound].slice(0, 70)) {
  mi++;
  const f = `maps-${String(mi).padStart(2, '0')}.jpg`;
  if (await save(u + '=w1600-h1600-k-no', `${OUT}/maps/${f}`, 5000)) manifest.maps.push({ file: f, url: u });
}

/* ---------- 5. Cardápio oficial (whatsmenu) — fotos reais dos produtos ---------- */
const WM1 = 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/quatroem1/products/';
const WM2 = 'https://whatsmenu.s3.amazonaws.com/production/quatroem1/products/';
/* [nome-no-disco, caminho, categoria] */
const MENU = [
  ['charlotte-morango-grande', '1135634/quatroem1vqu82x2egbhvs7lwebp', 'doces'],
  ['paosinho-batata', '2304804/quatroem1rvl33apcovhqfirwebp', 'salgados'],
  ['rosquinha-ninho', '3587289/6C4560C9E3E54497A5022F15C5EF6719', 'doces'],
  ['bandeja-mini-hamburguer', '2448589/IMG_0667', 'salgados'],
  ['mini-pizza', '2460751/quatroem1QbxvcBUuQTdI6ZDwebp', 'salgados'],
  ['sanduiche-natural', '2460758/quatroem1O1ncft74mogBL0zwebp', 'salgados'],
  ['bolo-aipim-coco', '2368337/quatroem1j1mJkdVXiGKnKQawebp', 'bolos'],
  ['lasanha-bolonhesa', '1220176/quatroem1dxttxzdhxcd2ffbwebp', 'salgados'],
  ['penne-frango-bacon', '1220179/quatroem1da9fiwipd6tqfrdwebp', 'salgados'],
  ['escondidinho-carne', '1220180/quatroem1a8xhmkzysp0ldtywebp', 'salgados'],
  ['penne-camarao', '1220200/quatroem1CnLZR6EUsRsPNcbwebp', 'salgados'],
  ['espetinho-morango', '2438315/quatroem1nfDD9eSC9Ng1JUKwebp', 'doces'],
  ['brigadeiro-gourmet', '2460723/quatroem16MgcIWoinVQM8tQwebp', 'doces'],
  ['brigadeiro-confete', '2460724/quatroem1yMuO6BqsxZlJFOwwebp', 'doces'],
  ['brigadeiro-amendoim', '2460725/quatroem1WYqK8S0vquGRRHtwebp', 'doces'],
  ['palha-italiana-ninho', '2463849/quatroem12vMCESlInWnlo69webp', 'chocolates'],
  ['palha-italiana-oreo', '2463850/quatroem1s2I3ouIifdjiMnuwebp', 'chocolates'],
  ['cone-trufado-ninho-nutella', '2696238/IMG_8015', 'chocolates'],
  ['pave-oreo-brigadeiro', '2460792/quatroem1AQiOSMPrR41DkQdwebp', 'doces'],
  ['pave-prestigio', '2460794/quatroem1MvM8ZBU5ESHpOrOwebp', 'doces'],
  ['pave-banana-caramelada', '2460799/quatroem1KYIC1c4beTdXXMPwebp', 'doces'],
  ['pave-cafe', '2549699/ImagemdoWhatsAppde20241017as10', 'doces'],
  ['naked-cake-15cm', '2437399/quatroem1vl7195QIrRoOhbOwebp', 'bolos'],
  ['naked-cake-20cm', '2437401/quatroem1bXwiKm7DXHcQTfOwebp', 'bolos'],
  ['bolo-pote-brigadeiro-doce-leite', '1060833/quatroem1hdctbdjthyj3c7vwebp', 'bolos'],
  ['bolo-pote-limao', '737944/quatroem1mwi0b5cswgsfdtswebp', 'bolos'],
  ['bolo-pote-prestigio', '1027162/quatroem1ckp7c4pzquks8pgwebp', 'bolos'],
  ['bolo-pote-ninho-morango', '2362849/quatroem1ltPmORMzh5qPrtiwebp', 'bolos'],
  ['bolo-pote-ninho-pistache', '2966855/IMG_1741', 'bolos'],
  ['bolo-pote-bem-casado', '3084835/IMG_1646', 'bolos'],
  ['bolo-pote-cafe-chocolate', '3308883/bolo2', 'bolos'],
  ['bolo-pote-morango-suspiro', '3308885/WhatsAppImage20261001at16', 'bolos'],
  ['bolo-pote-pudim', '3359818/9a092ad2156441b1ac4053c41a830c63', 'bolos'],
  ['copo-ninho-duplo', '737965/quatroem1ow67swhaatxa73jwebp', 'doces'],
  ['copo-morango', '737964/quatroem1ujbsdvopdng6xghwebp', 'doces'],
  ['copo-napolitano', '901818/quatroem1rgmbf4wm6mtl5imwebp', 'doces'],
  ['copo-brigadeiro', '737963/quatroem16hxizspplh6jy7iwebp', 'doces'],
  ['copo-ouro-branco', '737966/quatroem1ic26nqhayqxjcvtwebp', 'doces'],
  ['copo-maracuja-chocolate', '882927/quatroem15rpychgqwlsce8pwebp', 'doces'],
  ['copo-kinder-bueno', '791304/quatroem1ggby81cfthnzpfuwebp', 'chocolates'],
  ['copo-kinder-ovo', '737996/twhatsappimage20221106at1455371jpeg', 'chocolates'],
  ['copudim', '813524/quatroem1uezy9d0ynspizvrwebp', 'doces'],
  ['copo-salada-frutas', '2504321/quatroem1uizFWbF4eWXnvdRwebp', 'doces'],
  ['quindim', '2460885/quatroem1eDtXRghMvLGsTTSwebp', 'doces'],
  ['cookie-nutella', '2463391/quatroem1ccgqvftioiq24sgwebp', 'chocolates'],
  ['cookie-mm', '2483949/quatroem1NU2jzr8wX1vmQohwebp', 'chocolates'],
  ['cookie-kinder-bueno', '2778257/ImagemdoWhatsAppde20250329as11', 'chocolates'],
  ['fatia-cookie-nutella', '2937113/cookiepistache', 'chocolates'],
  ['banoffe', '737957/quatroem1abmptra6kd3esnkwebp', 'doces'],
  ['bombom-morango', '737954/WhatsAppImage20261001at16', 'doces'],
  ['bombom-uva', '737956/quatroem109x4qfuahqrogjbwebp', 'doces'],
  ['pudim-leite-condensado', '737972/quatroem1odaocly6hzimhmfwebp', 'doces'],
  ['charlotte-morango-pequena', '790081/tWhatsApp%20Image%202022-11-01%20at%2015.02.21.jpeg', 'doces'],
  ['charlotte-pessego', '790082/WhatsAppImage20260603at16', 'doces'],
  ['cheesecake-morango', '791300/quatroem18vfpgth0gzkmkiywebp', 'doces'],
  ['folhatella', '794156/WhatsAppImage20260603at16', 'doces'],
  ['bombom-cenoura', '1303129/quatroem1etRNnYqGunq3DiIwebp', 'chocolates'],
  ['torta-alema-pote', '2281095/IMG_4819', 'doces'],
  ['espetinho-morango-chocolate', '2369257/quatroem1B5f7BoI3jhOvUCLwebp', 'chocolates'],
  ['bombom-nutella-kinder', '2891316/quatroem144c0SzCKhl446tWwebp', 'chocolates'],
  ['bombom-nutella', '2891318/quatroem1BhPylbX7Ozvl3Awwebp', 'chocolates'],
  ['bombom-ovomaltine', '2891319/quatroem1Dth5sD3nQonMH8webp', 'chocolates'],
  ['bombom-oreo', '2891320/quatroem1jm3ApLQNZAoWuLewebp', 'chocolates'],
  ['bombom-ferrero', '3001136/ferrero', 'chocolates'],
  ['pudim-pote-vidro', '3352394/image', 'doces'],
  ['fatia-nozes', '785359/quatroem1wno8rvsj7zjfvmiwebp', 'bolos'],
  ['fatia-torta-alema', '787332/quatroem1ixxqdnn2atvm8fpwebp', 'bolos'],
  ['fatia-pistache-frutas-vermelhas', '1066181/quatroem1qh2nmpuapkc9jhfwebp', 'bolos'],
  ['fatia-rafaello-coco', '785368/quatroem1qke1xssz4aehfdewebp', 'bolos'],
  ['fatia-palha-italiana', '3303813/WhatsAppImage20260408at12', 'chocolates'],
  ['caseirinho-laranja', '2460897/quatroem1feb7ytvrishqr4gwebp', 'bolos'],
  ['caseirinho-formigueiro', '2460900/quatroem1TqLLLmLkMEpFpC8webp', 'bolos'],
  ['assado-calabresa-requeijao', '1000465/quatroem14mpi3i52mwdtiwiwebp', 'salgados'],
  ['coxinha-frango', '751165/quatroem1fsyzka5ajl3ikokwebp', 'salgados'],
  ['coxinha-costela-requeijao', '1157094/quatroem1IFFB0FIMsYswMGUwebp', 'salgados'],
  ['enroladinho-salsicha', '932081/quatroem1ikgvs2xma5iayhfwebp', 'salgados'],
  ['mini-assados-sortidos', '2382883/quatroem15KbETFQ34X75Gjkwebp', 'salgados'],
  ['hot-dog-fechado', '2605271/ImagemdoWhatsAppde20241125as09', 'salgados'],
  ['pastel-forno-frango', '2698166/IMG_3160', 'salgados'],
  ['hot-dog-recheado', '2898920/namorados', 'salgados'],
  ['sanduiche-contra-filet', '3116291/AA5BACFD7FE34E9CB5E33EC4F3C4A077', 'salgados'],
  ['mini-sanduiche-atum', '3601013/OitoBunsRecheadoscomAlfaceFresca', 'salgados'],
  ['sanduiche-integral', '3602464/SanduicheMultigraoscomFiambreeQueijo', 'salgados'],
  ['sacole-maracuja', '2723295/IMG_3411', 'doces'],
  ['sacole-ninho-nutella', '2723298/IMG_3414', 'doces'],
  ['sacole-coco', '2745321/COCO', 'doces'],
  ['sacole-abacaxi-4-leites', '3049618/ImagemdoWhatsAppde20251117as11', 'doces'],
  ['coca-cola', '805710/tcoca.jpg', 'bebidas'],
  ['h2oh-limao', '805717/t19802371.jpg', 'bebidas'],
  ['canjica-quatro-leite', '1097615/quatroem1cswtxlmksv7lgtxwebp', 'doces'],
  ['canjica-pacoca', '1097617/quatroem1p0h3zuspnzpkeyvwebp', 'doces'],
  ['caseirinho-fuba-coco-goiabada', '2858196/fuba', 'bolos'],
  ['bobó-camarao', '2854258/IMG_8414', 'salgados']
];
for (const [name, path, cat] of MENU) {
  const f = `${name}.img`;
  const tries = [WM1 + path, WM2 + path];
  let ok = false;
  for (const url of tries) { if (await save(url, `${OUT}/menu/${f}`, 3000)) { ok = true; manifest.menu.push({ file: f, name, cat, url }); break; } }
  if (!ok) note(`menu sem imagem: ${name}`);
}

/* ---------- 6. Marca: logos publicados pelo próprio cliente ---------- */
const BRAND = {
  'logo-principal-fundo-branco.png': 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/quatroem1/tLogo-principal-(fundo-branco)%20(1).png',
  'submarca-fundo-marrom.png': 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/quatroem1/tbSubmarca-(fundo-marrom).png',
  'perfil-beacons.png': 'https://cdn.beacons.ai/user_content/ZRH6BtjxI2Yvl6PN9LHmG9cjXg43/profile_quatroem1.png'
};
for (const [f, url] of Object.entries(BRAND)) {
  if (await save(url, `${OUT}/brand/${f}`, 1000)) manifest.brand.push({ file: f, url });
}
/* cardápio oficial: HTML para conferência de preços/nomes */
try {
  const r = await get('https://whatsmenu.com.br/quatroem1');
  const html = await r.text();
  note('whatsmenu: HTTP ' + r.status + ', ' + html.length + ' bytes');
  if (html.length > 5000) writeFileSync(`${OUT}/brand/_whatsmenu.html`, html);
} catch (e) { note('whatsmenu erro: ' + String(e).slice(0, 130)); }

manifest.log = log;
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
note('manifesto escrito. ig=' + manifest.ig.length + ' maps=' + manifest.maps.length + ' menu=' + manifest.menu.length + ' brand=' + manifest.brand.length);
