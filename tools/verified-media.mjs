// Only explicitly approved, locally hosted material can enter the photo gallery.
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function withVerifiedExtras(html,root,menu){
 const extra=JSON.parse(readFileSync(join(root,'src/verified-extras.json'),'utf8'));
 function file(path){if(!/^assets\/[\w-]+\.(webp|avif|mp4)$/.test(path)||!existsSync(join(root,'src',path)))throw Error('Mídia local não encontrada: '+path);return `@@file:${path}@@`;}
 function media(m,hero=false){
  if(!m.approved||!m.source||!m.alt||!Number.isInteger(m.width)||!Number.isInteger(m.height)||m.width<=0||m.height<=0)throw Error('A mídia precisa de autorização, origem, descrição e dimensões.');
  const attrs=`width="${m.width}" height="${m.height}"`;
  if(m.type==='photo')return `<img ${hero?'class="hero-food photo-original" fetchpriority="high"':'loading="lazy"'} src="${file(m.src)}" alt="${esc(m.alt)}" ${attrs} decoding="async">`;
  if(m.type==='video')return `<div class="verified-video ${hero?'hero-video':''}"><img class="video-poster" ${hero?'fetchpriority="high"':'loading="lazy"'} src="${file(m.poster)}" alt="${esc(m.alt)}" ${attrs}><video data-video="${file(m.src)}" poster="${file(m.poster)}" aria-label="${esc(m.alt)}" preload="none" muted autoplay loop playsinline ${attrs} hidden></video></div>`;
  throw Error('Tipo de mídia real inválido.');
 }
 if(extra.heroMedia){const m=extra.heroMedia;html=html.replace(/(<div class="food-stage stack">)<picture>[\s\S]*?<\/picture>(<\/div>)/,(_,a,b)=>a+media(m,true)+b).replace('Arte do cardápio da casa',esc(m.caption||'Da nossa cozinha'));}
 const gallery=extra.gallery.length?`<section class="verified-gallery" aria-label="Galeria da casa"><div class="wrap"><div class="eyebrow"><span class="rule"></span>Nosso espaço</div><h2>Galeria <em>da casa</em></h2><div class="gallery-grid">${extra.gallery.map(m=>`<figure>${media(m)}<figcaption>${esc(m.caption||m.alt)}</figcaption></figure>`).join('')}</div></div></section>`:'';
 const offers=extra.promotionIds.map(id=>{const item=menu.find(p=>p.id===id);if(!item||!item.source||!item.approved||!['Combos','Promoções'].includes(item.group)||!Number.isInteger(item.cents))throw Error('Oferta sem confirmação da casa.');return `<article class="dish"><h4>${esc(item.name)}</h4><p>${esc(item.description)}</p><div class="dish-bottom"><span class="dish-price">${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(item.cents/100)}</span><button class="add-btn" data-add="${esc(id)}">Adicionar ao pedido</button></div></article>`;});
 return html.replace('@@GALLERY@@',()=>gallery).replace('@@PROMOTIONS@@',offers.length?`<div class="verified-offers"><h3>Promoções e combos</h3><div class="dish-grid">${offers.join('')}</div></div>`:'');
}
