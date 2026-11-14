#!/usr/bin/env node
/* Coleta as IMAGENS dos posts do Instagram oficial (runner do Actions). Só curadoria. */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
const OUT = 'media-raw/ig'; mkdirSync(OUT, { recursive: true });
const CODES = ['DfsmK6WxiD_','DfVwaFIs2Pe','DfNWmt0s7wJ','DfH4rfEMRJf','DezMOhXRj00','DecvfRxMrf1','DeRjxN4RQ8_','DdXc3QYmoVl','DdU1frxOqX8','DdHyFZ_sT0g','DdHxShtsvxL','DdHUJDOMQ4D','C_gACe3JM9G'];
const known = JSON.parse(readFileSync('scripts/known-urls.json', 'utf8'));
const UAS = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  fb: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  tw: 'Twitterbot/1.0', gb: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
};
const log = [];
const note = m => { console.log(m); log.push(m); };
const isImg = b => (b[0] === 0xff && b[1] === 0xd8) || b.slice(0, 4).toString() === 'RIFF' || b.slice(1, 4).toString() === 'PNG';
async function grab(url, dest, ua = UAS.chrome) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': ua, 'accept-language': 'pt-BR,pt;q=0.9' }, redirect: 'follow' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const b = Buffer.from(await r.arrayBuffer());
    if (b.length < 5000 || !isImg(b)) throw new Error('não é imagem (' + b.length + ' bytes)');
    writeFileSync(dest, b); note(`OK   ${dest} ${b.length}`); return true;
  } catch (e) { note(`FAIL ${dest} <- ${url.slice(0, 60)}: ${String(e).slice(0, 80)}`); return false; }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (const code of CODES) {
  const dest = `${OUT}/${code}.jpg`;
  let ok = await grab(`https://www.instagram.com/p/${code}/media/?size=l`, dest);
  if (!ok) for (const [k, ua] of Object.entries(UAS)) {
    if (ok) break;
    try {
      const html = await (await fetch(`https://www.instagram.com/p/${code}/`, { headers: { 'user-agent': ua } })).text();
      const m = html.match(/property="og:image" content="([^"]+)"/);
      note(`og ${code} [${k}]: ${m ? 'achou' : 'sem og:image'} (${html.length} bytes)`);
      if (m) ok = await grab(m[1].replace(/&amp;/g, '&'), dest);
    } catch (e) { note(`og ${code} erro ${e}`); }
  }
  const kn = known.find(x => x.code === code);
  if (!ok && kn) ok = await grab(kn.url, dest);
  if (!ok) for (const p of [`https://imginn.com/p/${code}/`, `https://www.pixwox.com/post/${code}/`, `https://imgsed.com/p/${code}/`]) {
    if (ok) break;
    try {
      const html = await (await fetch(p, { headers: { 'user-agent': UAS.chrome } })).text();
      const srcs = [...html.matchAll(/(?:src|data-src)="([^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&')).filter(s => /cdninstagram|scontent/i.test(s));
      note(`mirror ${p}: ${srcs.length} urls`);
      for (let i = 0; i < Math.min(srcs.length, 4); i++) if (await grab(srcs[i], i ? `${OUT}/${code}_${i}.jpg` : dest)) ok = true;
    } catch (e) { note(`mirror erro ${String(e).slice(0, 60)}`); }
  }
  await sleep(1500);
}
writeFileSync('media-raw/images-log.json', JSON.stringify(log, null, 1));
