#!/usr/bin/env node
/**
 * FETCH-MEDIA — baixa, em tempo de build (na Vercel), a mídia REAL da
 * Confeitaria Agridoce publicada pela própria casa:
 *  · capas de posts do Instagram oficial (@confeitariagridoce)
 *  · foto de capa da ficha pública do local no Google Maps
 * Os arquivos vão para public/assets/ e o site referencia apenas o
 * próprio domínio (nada de hotlink que expira).
 * Se um download falhar, o placeholder elegante já commitado permanece
 * e o manifesto registra a pendência — nunca se inventa mídia.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');

const MEDIA = [
  {
    dest: 'vitrine-agridoce.webp',
    code: 'MAPS-COVER',
    url: 'https://lh3.googleusercontent.com/grass-cs/AABkmLfb01cVNbsgUt5fgbXtIQv-Nw2uyYirfdgKtwIGsBV1zCGN9IruOO5XfET7ESQlD15_FG-JBHEE40pqaxS9iWz-rlcEyzQKYWIEyvy0EUnLi8ohXyYi26SpYzbmeEzxQz5MwEYR=w1200-k-no',
    origin: 'Google Maps — foto de capa da ficha pública da Confeitaria Agridoce - Delivery'
  },
  {
    dest: 'ig-burger.jpg',
    code: 'C_gACe3JM9G',
    url: 'https://scontent-msp1-1.cdninstagram.com/v/t51.71878-15/505739429_1240258794460782_6199558559165194185_n.jpg?stp=dst-jpg_e35_s640x640_tt6&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzIifQ%3D%3D&_nc_ohc=jpVObtO8PdUQ7kNvwG5wSm2&_nc_oc=AdoJAJq6Ttn0DuPV6uILuzZ6c98J1XJrXkg3E62B1L7OQgPFSGqZj7LB2H4ppLFEiBPVOHP2i2ICoSxw3eKWglD6&_nc_zt=23&_nc_ht=scontent-msp1-1.cdninstagram.com&_nc_gid=yiWvaSjq97AHbPY70JgFEA&_nc_ss=7f689&_nc_ct=RQgsPBUKFQQAAAA&oh=00_AQS2q0RHT1wa-iHjxKc0Mr_wD3QUEUUhfCbxCUpbl50eow&oe=6AFD3C23',
    origin: 'Instagram oficial @confeitariagridoce — post do concurso Melhor Hambúrguer do Brasil'
  },
  {
    dest: 'ig-morango.jpg',
    code: 'DdHUJDOMQ4D',
    url: 'https://scontent-sjc3-1.cdninstagram.com/v/t51.71878-15/804230129_2455486485276232_2894970022130435514_n.jpg?stp=dst-jpg_e35_s640x640_tt6&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=hcXQ8ZP5BaMQ7kNvwG4cKKg&_nc_oc=Adr8cIt8_LscJId6N-fojo2RyU3ECt4t--q3tG3W8k7QuAb88wYHF6LcszgRIN_AFKa_ZIJrw1K8i4kY6DGYm8AU&_nc_zt=23&_nc_ht=scontent-sjc3-1.cdninstagram.com&_nc_gid=VQnHsOCHxm4OzJRht9lXhQ&_nc_ss=7f689&_nc_ct=RQosPBUKFQQAAAA&oh=00_AQTPRjbXfwL7zPIVMTEtMFgMvwoksyg-y5gdE7mF4iB8oQ&oe=6AFD46FC',
    origin: 'Instagram oficial @confeitariagridoce — reel do morango cravejado'
  },
  {
    dest: 'ig-tortas.jpg',
    code: 'DezMOhXRj00',
    url: 'https://scontent-iad6-1.cdninstagram.com/v/t51.82787-15/862325053_18496646239111961_8009158712147758087_n.webp?stp=dst-webp_p1179x1179&_nc_cat=109&_nc_map=urlgen_bucketless&ig_cache_key=NDAxMzYwNTQ2NzM3MjAxMDgwNA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=FC31Fu28HqUQ7kNvwGnMNqG&_nc_oc=AdqH-lPQuDhiJK1Tt1ePGxQxNpLiD8EiHBMeaRclnk0JBzJveyXo7i2Sx7CtRFHk7Desq0LnPXCVjFQePNFGslEj&_nc_zt=23&_nc_ht=scontent-iad6-1.cdninstagram.com&_nc_gid=t6RG-ZKQS1k_71jD2mbWhA&_nc_ss=7d689&oh=00_AQRPMTcbS0fPSMDfFwI2QGASY6LC-mMoi3ewShNBPVB3-A&oe=6AFD5EBC',
    origin: 'Instagram oficial @confeitariagridoce — post das tortas'
  },
  {
    dest: 'ig-tortas2.jpg',
    code: 'DeRjxN4RQ8_',
    url: 'https://scontent-iad6-1.cdninstagram.com/v/t51.82787-15/841296502_18493742587111961_4573226727273009084_n.webp?stp=dst-webp_s1179x1179&_nc_cat=109&_nc_map=urlgen_bucketless&ig_cache_key=NDAwNDEzODg1NzQ5NDAyMzk5OQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=OxyyDwlQgosQ7kNvwGf1sfn&_nc_oc=AdquWI0nyvvTkf6qtr9sKu0nvlnGo7Zyq_r_eZ4MRECNgj--DO04L90TtQWp_J4U8mYJVikmrNxQ_sbD7AnHb-72&_nc_zt=23&_nc_ht=scontent-iad6-1.cdninstagram.com&_nc_gid=-k5ZC-RJU2ZrIK5ovVI96g&_nc_ss=7d580&oh=00_AQQaM_kLMCPC_33lgTQSxSqpPDq1WIJTEKPKVZ_ejd7Akg&oe=6AFD2B62',
    origin: 'Instagram oficial @confeitariagridoce — post das tortas de sábado'
  },
  {
    dest: 'ig-gratidao.jpg',
    code: 'DdHyFZ_sT0g',
    url: 'https://scontent-ord5-1.cdninstagram.com/v/t51.82787-15/803925813_18487932958111961_21441974879943762_n.jpg?stp=dst-jpegr_e35_s1179x1179_tt6&_nc_cat=103&_nc_map=urlgen_bucketless&ig_cache_key=Mzk4MzM3MjY2OTI2NzU1NzY2NA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5oZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=tFvHE1CZsbkQ7kNvwGG7Uq-&_nc_oc=AdoMbmMwM3Pv8b3ieirB1KyIZKOHtQZi5ZJoRgnUK6RNhT4F38KGiktJX8T64ngYBwnIr0xD3QvvI18Jl8-yCGj1&_nc_zt=23&se=-1&_nc_ht=scontent-ord5-1.cdninstagram.com&_nc_gid=Paj_OYgHcWvnQCzlObA4Hw&_nc_ss=7d580&oh=00_AQRvodRS1jI1p_A0wyAhN6yqS19A02bru5Na2dyQp6oliA&oe=6AFD5BE0',
    origin: 'Instagram oficial @confeitariagridoce — post de gratidão pelos +15 anos'
  }
];

const CACHE_BUST = 'v3-20261113'; // muda o hash do build → garante reexecução
const UA = { headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36 agridoce-site-build' } };

/* Espelhos que re-publicam o feed oficial: usados quando a URL assinada
   do CDN do Instagram recusa o egress do build (403). */
async function mirrorUrls(code) {
  const pages = [
    'https://imginn.com/p/' + code + '/',
    'https://www.pixwox.com/post/' + code + '/',
    'https://imgsed.com/p/' + code + '/'
  ];
  const out = [];
  for (const p of pages) {
    try {
      const html = await (await fetch(p, UA)).text();
      const srcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
      const pick = srcs.find(s => /cdninstagram|scontent/i.test(s)) || srcs.find(s => /^https/i.test(s) && !/logo|avatar|arrow|icon/i.test(s));
      if (pick) out.push({ url: pick, via: p });
    } catch { /* espelho fora do ar: segue */ }
  }
  return out;
}

const manifest = [];

for (const item of MEDIA) {
  const dest = join(OUT, item.dest);
  const candidates = [{ url: item.url, via: 'url direta' }];
  if (!item.code.startsWith('MAPS')) candidates.push(...await mirrorUrls(item.code));
  let done = false;
  for (const cand of candidates) {
    try {
      const res = await fetch(cand.url, UA);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 4000) throw new Error('arquivo pequeno demais (' + buf.length + ' bytes)');
      writeFileSync(dest, buf);
      manifest.push({ file: item.dest, ok: true, bytes: buf.length, via: cand.via, origin: item.origin, fetchedAt: new Date().toISOString() });
      console.log(`✓ ${item.dest} ← ${item.origin} via ${cand.via} (${buf.length} bytes)`);
      done = true;
      break;
    } catch (e) {
      console.log(`· ${item.dest} falhou via ${cand.via}: ${String(e).slice(0, 80)}`);
    }
  }
  if (!done) {
    manifest.push({ file: item.dest, ok: false, origin: item.origin, kept: existsSync(dest) ? 'placeholder local' : 'ausente' });
    console.log(`✗ ${item.dest}: todas as fontes falharam — mantido placeholder elegante`);
  }
}

writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({ site: 'Confeitaria Agridoce', nota: 'Mídia real da casa baixada no build; placeholders marcados com ok:false.', medias: manifest }, null, 2));
console.log(`manifest.json escrito com ${manifest.length} entradas.`);
