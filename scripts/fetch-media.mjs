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
    url: 'https://scontent-msp1-1.cdninstagram.com/v/t51.71878-15/804230129_2455486485276232_2894970022130435514_n.jpg?stp=dst-jpg_e35_s640x640_tt6&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzIifQ%3D%3D&_nc_ohc=hcXQ8ZP5BaMQ7kNvwHVlt9H&_nc_oc=AdqfhCw3KvYxF2A3KFQFXGVOYdFlxtsn44X0DZvPK9cgKx1YY6UnALUaJ3_ITG7Fzi-robgB1QuhOPt0bXNRrADX&_nc_zt=23&_nc_ht=scontent-msp1-1.cdninstagram.com&_nc_gid=yiWvaSjq97AHbPY70JgFEA&_nc_ss=7f689&_nc_ct=RQgsPBUKFQQAAAA&oh=00_AQRQYklgkbrFgjxxL3ujO7d6pS4Zd9VEkye959WFGAn3Rw&oe=6AFD46FC',
    origin: 'Instagram oficial @confeitariagridoce — reel do morango cravejado'
  },
  {
    dest: 'ig-tortas.jpg',
    code: 'DezMOhXRj00',
    url: 'https://scontent-msp1-1.cdninstagram.com/v/t51.82787-15/862325053_18496646239111961_8009158712147758087_n.webp?stp=dst-jpg_e35_s640x640_tt6&_nc_cat=109&_nc_map=urlgen_bucketless&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiRkVFRC5iZXN0X2ltYWdlX3VybGdlbi5DMiJ9&_nc_ohc=FC31Fu28HqUQ7kNvwF-TDbo&_nc_oc=Ado1zaZ4FHDlFHu_UP0Wg_LE9FVsfKF8VufYhsu3j3hmhZaAxrIKjju-f-CQA_fobGtL1n2runVPfHxrj7lrIIgO&_nc_zt=23&_nc_ht=scontent-msp1-1.cdninstagram.com&_nc_gid=yiWvaSjq97AHbPY70JgFEA&_nc_ss=7f689&_nc_ct=RQgsPBUKFQQAAAA&oh=00_AQRo776qZW-QmNQ2Tg-2VD7F2ebBHhc5zNtMeekLgGRzgA&oe=6AFD267C',
    origin: 'Instagram oficial @confeitariagridoce — post das tortas'
  },
  {
    dest: 'ig-tortas2.jpg',
    code: 'DeRjxN4RQ8_',
    url: 'https://scontent-msp1-1.cdninstagram.com/v/t51.82787-15/841296502_18493742587111961_4573226727273009084_n.webp?stp=dst-jpg_e35_s640x640_tt6&_nc_cat=109&_nc_map=urlgen_bucketless&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiRkVFRC5iZXN0X2ltYWdlX3VybGdlbi5DMiJ9&_nc_ohc=OxyyDwlQgosQ7kNvwEtzTb3&_nc_oc=AdquDTtaiaGVGfrwsY9bJcox1r30agVw7g2N72XQoSZR-R3PeUWyaFPfWW9UyYIVhkxlaXrRnJiTN4d1lt3RlvEg&_nc_zt=23&_nc_ht=scontent-msp1-1.cdninstagram.com&_nc_gid=yiWvaSjq97AHbPY70JgFEA&_nc_ss=7f689&_nc_ct=RQgsPBUKFQQAAAA&oh=00_AQS1tvZYiXeu8N1MIzdPBkIUBszzwUOSioLCUs5hqrO4qg&oe=6AFD2B62',
    origin: 'Instagram oficial @confeitariagridoce — post das tortas de sábado'
  },
  {
    dest: 'ig-gratidao.jpg',
    code: 'DdHyFZ_sT0g',
    url: 'https://scontent-msp1-1.cdninstagram.com/v/t51.82787-15/803925813_18487932958111961_21441974879943762_n.jpg?stp=dst-jpg_e35_s640x640_tt6&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiRkVFRC5iZXN0X2ltYWdlX3VybGdlbi5DMiJ9&_nc_ohc=tFvHE1CZsbkQ7kNvwGXdhO6&_nc_oc=AdoaLbIfRJBN8WAQsZjPUvePjp0lE7yPMs98hA03pnGHcVlQuQGq9bSLn6GuKmTYmaNzpZKLhFHHPM8bzKqJwvg0&_nc_zt=23&_nc_ht=scontent-msp1-1.cdninstagram.com&_nc_gid=yiWvaSjq97AHbPY70JgFEA&_nc_ss=7f689&_nc_ct=RQgsPBUKFQQAAAA&oh=00_AQSfT0RofrmOOnG61FF2CThAAMV7KoM4lOqzmscJ6Wn7nw&oe=6AFD23A0',
    origin: 'Instagram oficial @confeitariagridoce — post de gratidão pelos +15 anos'
  }
];

const UA = { headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36 agridoce-site-build' } };

/* Espelhos que re-publicam o feed oficial: usados quando a URL assinada
   do CDN do Instagram recusa o egress do build (403). */
async function mirrorUrls(code) {
  const pages = [
    'https://imginn.com/p/' + code + '/',
    'https://www.pixwox.com/post/' + code + '/'
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
