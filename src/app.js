(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const business = JSON.parse($('restaurant-data').textContent);
  const menu = JSON.parse($('menu-data').textContent);
  const byId = new Map(menu.map(item => [item.id, item]));
  const money = cents => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(cents / 100);
  const icon = name => `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const cartDialog = $('cart-dialog'), catalog = $('catalog-dialog'), optionDialog = $('option-dialog');
  const storageKey = 'la-napolitana:pedido:v1';
  const keyOf = (id,opt=-1) => id + '@' + opt;
  const state = {rows:[], note:''};
  let family = 'all', optionItem, optionQuantity = 1, toastTimer;
  const validOpt = (item,n) => item.options ? (Number.isInteger(n) && n>=0 && n<item.options.length) : n===-1;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (saved && Array.isArray(saved.rows)) {
      for (const row of saved.rows.slice(0,100)) {
        const item = byId.get(row?.id);
        if (item && validOpt(item,row.opt) && Number.isInteger(row.qty) && row.qty>0 && row.qty<=99 && !state.rows.some(r => r.id===row.id && r.opt===row.opt)) state.rows.push({id:item.id,opt:row.opt,qty:row.qty});
      }
      if (state.rows.length && typeof saved.note === 'string') state.note = saved.note.slice(0,400);
    }
  } catch { /* Private browsing can disallow storage; the order still works in memory. */ }
  const save = () => {try {if (state.rows.length) sessionStorage.setItem(storageKey,JSON.stringify(state)); else sessionStorage.removeItem(storageKey);} catch {}};
  const quantity = () => state.rows.reduce((n,row)=>n+row.qty,0);
  const tally = () => ({cents:state.rows.reduce((n,row)=>n+(byId.get(row.id).cents ?? 0)*row.qty,0),unknown:state.rows.filter(row=>byId.get(row.id).cents===null),known:state.rows.some(row=>byId.get(row.id).cents!==null)});
  const lineTitle = (item,opt) => (item.family==='salgadas' || item.group==='Pizzas doces' ? 'Pizza ' : item.group==='Gelatos' ? 'Gelato: ' : '') + item.name + (item.options ? ' — ' + item.options[opt] : '') + (item.group==='Gelatos' ? ' (2 bolas)' : '');
  function summary() {
    const t = tally();
    const lines = [`Olá, ${business.name}! Gostaria de consultar este pedido:`, ''];
    for (const r of state.rows) {
      const p = byId.get(r.id);
      lines.push(`${r.qty} × ${lineTitle(p,r.opt)} — ${p.cents === null ? 'valor e disponibilidade sob consulta' : `${money(p.cents)} cada · ${money(p.cents*r.qty)}`}`);
    }
    lines.push('');
    if (t.known) lines.push((t.unknown.length ? 'Subtotal dos itens com preço: ' : 'Total dos itens: ')+money(t.cents));
    if (t.unknown.length) lines.push('A consultar: '+t.unknown.map(r=>`${r.qty} × ${byId.get(r.id).name}`).join(', ')+'. Valor final a confirmar.');
    if (state.note.trim()) lines.push('', 'Observações: '+state.note.trim());
    lines.push('', 'Podem confirmar a disponibilidade e a forma de atendimento?');
    return lines.join('\n');
  }
  function notify(message) {
    const toast=$('toast');clearTimeout(toastTimer);toast.textContent=message;toast.classList.add('show');
    toastTimer=setTimeout(()=>toast.classList.remove('show'),2900);
  }
  function show(dialog) {
    closeNav();
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
  }
  document.querySelectorAll('dialog').forEach(d=>{
    d.addEventListener('close',()=>document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]')));
    d.addEventListener('click',e=>{if(e.target!==d)return;const b=d.getBoundingClientRect();if(e.clientX<b.left || e.clientX>b.right || e.clientY<b.top || e.clientY>b.bottom)d.close();});
  });
  function resetConsents(){ $('consent').checked=false; $('age-check').checked=false; $('cart-error').textContent=''; $('manual-copy').hidden=true; $('cart-feedback').textContent=''; }
  function renderCounts(){document.querySelectorAll('[data-count]').forEach(el=>el.textContent=quantity());document.querySelectorAll('[data-cart]').forEach(el=>el.setAttribute('aria-label',`Meu pedido, ${quantity()} ${quantity()===1?'item':'itens'}`));}
  function stepper(id,opt,qty,place){
    const name=escape(byId.get(id).name);
    const key=escape(keyOf(id,opt));
    return `<span class="stepper"><button type="button" data-step="-1" data-key="${key}" data-place="${place}" aria-label="Diminuir quantidade de ${name}">${icon('minus')}</button><output aria-label="Quantidade de ${name}">${qty}</output><button type="button" data-step="1" data-key="${key}" data-place="${place}" ${qty>=99?'disabled':''} aria-label="Aumentar quantidade de ${name}">${icon('plus')}</button></span>`;
  }
  function renderCatalog(){
    const query=normalize($('menu-search').value.trim());
    const list=menu.filter(p=>(family==='all'||p.family===family)&&normalize([p.name,p.group,p.description,...(p.options||[])].join(' ')).includes(query));
    $('result-count').textContent=`${list.length} ${list.length===1?'item':'itens'}`;
    document.querySelectorAll('[data-family]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.family===family)));
    const groups=new Map();list.forEach(p=>{if(!groups.has(p.group))groups.set(p.group,[]);groups.get(p.group).push(p);});
    let html='';
    for(const [group,products] of groups){
      html+=`<div class="catalog-group"><h3 class="group-heading">${escape(group)}</h3>${products.some(p=>p.alcohol)?'<p class="group-note">Bebidas alcoólicas somente para maiores de 18 anos.</p>':''}<div class="dish-grid">`;
      for(const p of products){
        const row=state.rows.find(r=>r.id===p.id && r.opt===-1);
        const price=p.cents===null?'Sob consulta':money(p.cents);
        html+=`<article class="dish" data-dish="${p.id}"><h4>${escape(p.name)}</h4>${p.description?`<p>${escape(p.description)}</p>`:''}<div class="dish-bottom"><span class="dish-price">${price}</span>${row?stepper(p.id,-1,row.qty,'menu'):`<button class="add-btn" data-add="${p.id}" aria-label="${p.options?'Escolher sabor de':'Adicionar'} ${escape(p.name)}">${icon('plus')}${p.options?'Escolher sabor':p.cents===null?'Incluir consulta':'Adicionar'}</button>`}</div></article>`;
      }
      html+='</div></div>';
    }
    $('catalog-list').innerHTML=html||`<div class="no-results"><h3>Nenhum sabor encontrado.</h3><p>Tente outro nome ou veja o cardápio completo.</p><button class="btn btn-outline" data-clear-filters>Limpar filtros</button></div>`;
  }
  function openCatalog(nextFamily='all',keep=false){
    if(cartDialog.open)cartDialog.close();
    if(!keep){family=nextFamily;$('menu-search').value='';}
    renderCatalog();show(catalog);
    if(!keep)$('catalog-scroll').scrollTop=0;
    $('catalog-feedback').textContent='Escolha os itens do seu pedido.';
  }
  function updateSummaryLink(){
    const target=$('send-order');const valid=/^\d{10,15}$/.test(business.whatsapp);
    target.hidden=!valid; $('consent').closest('label').hidden=!valid;
    if(valid && state.rows.length) target.href=`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(summary())}`;
    else target.removeAttribute('href');
    if(!$('manual-copy').hidden)$('copy-text').value=summary();
  }
  function renderCart(){
    const empty=!state.rows.length;$('cart-empty').hidden=!empty;$('cart-filled').hidden=empty;
    $('cart-items').innerHTML=state.rows.map(r=>{
      const p=byId.get(r.id), title=lineTitle(p,r.opt);
      return `<li class="cart-row" data-line="${keyOf(r.id,r.opt)}"><div class="row-top"><h3>${escape(p.name)}</h3><strong>${p.cents===null?'Sob consulta':money(p.cents*r.qty)}</strong></div><p class="variant">${escape(p.options?p.options[r.opt]:p.group)} · ${p.cents===null?'Consultar disponibilidade':money(p.cents)+' / un.'}</p><div class="row-bottom">${stepper(r.id,r.opt,r.qty,'cart')}<button class="remove-btn" data-remove="${keyOf(r.id,r.opt)}" aria-label="Remover ${escape(title)}">${icon('trash')}Remover</button></div></li>`;
    }).join('');
    $('order-note').value=state.note;
    const t=tally();$('total-label').textContent=t.unknown.length?(t.known?'Subtotal com preço':'Valor dos itens'):'Total dos itens';
    $('cart-total').textContent=(!empty && !t.known)?'Sob consulta':money(t.cents);
    $('price-note').textContent=t.unknown.length?'Não inclui '+t.unknown.map(r=>`${r.qty} × ${byId.get(r.id).name}`).join(', ')+'. Valor final a confirmar.':'';
    $('age-label').hidden=!state.rows.some(r=>byId.get(r.id).alcohol);
    updateSummaryLink();renderCounts();
  }
  function change(id,opt,delta,focusPlace){
    const p=byId.get(id);if(!p||!validOpt(p,opt)||!Number.isInteger(delta))return;
    const row=state.rows.find(r=>r.id===id && r.opt===opt);
    const prev=row?row.qty:0, next=Math.max(0,Math.min(99,prev+delta));
    if(next===prev){const msg=next===99?'O limite por seleção é de 99 unidades.':'Quantidade inalterada.';$('catalog-feedback').textContent=msg;$('cart-feedback').textContent=msg;return;}
    if(row)row.qty=next;else if(next>0)state.rows.push({id,opt,qty:next});
    state.rows=state.rows.filter(r=>r.qty>0);
    if(!state.rows.length)state.note='';
    save();resetConsents();renderCart();if(catalog.open)renderCatalog();
    const message=next===0?`${p.name} removido do pedido.`:`${p.name}: ${next} ${next===1?'unidade':'unidades'} no pedido.`;
    if(cartDialog.open)$('cart-feedback').textContent=message;else if(catalog.open)$('catalog-feedback').textContent=message;else notify(message);
    if(focusPlace){const panel=focusPlace==='cart'?cartDialog:catalog;const match=panel.querySelector(`[data-key="${keyOf(id,opt)}"][data-step="${delta<0?-1:1}"]:not(:disabled)`)||panel.querySelector(`[data-add="${id}"]`)||panel.querySelector('.cart-row button')||panel.querySelector('#cart-empty button');match?.focus({preventScroll:true});}
  }
  function addProduct(id,source){
    const item=byId.get(id);if(!item)return;
    if(item.options){
      optionItem=item;optionQuantity=1;$('option-name').textContent=item.name;
      $('options').innerHTML='<legend class="sr-only">Sabor</legend>'+item.options.map((o,i)=>`<label><input type="radio" name="flavour" value="${i}" required><span>${escape(o)}</span></label>`).join('');
      $('opt-qty').value='1';$('opt-less').disabled=true;$('opt-more').disabled=false;$('opt-total').textContent=money(item.cents);$('option-warning').textContent='';show(optionDialog);
    }else change(id,-1,1,source?.closest('#catalog-dialog')?'menu':null);
  }
  const optWarning=document.createElement('p');optWarning.id='option-warning';optWarning.className='field-error';optWarning.setAttribute('role','alert');$('options').after(optWarning);
  $('option-form').noValidate=true;
  $('option-form').addEventListener('submit',e=>{
    e.preventDefault();const selected=$('options').querySelector('input:checked');
    if(!selected){$('option-warning').textContent='Escolha um sabor de soda para continuar.';$('options').querySelector('input').focus();return;}
    const selectedOpt=Number(selected.value),existing=state.rows.find(r=>r.id===optionItem.id && r.opt===selectedOpt);
    if((existing?.qty||0)+optionQuantity>99){$('option-warning').textContent='O limite por sabor é de 99 unidades. Ajuste a quantidade no pedido.';return;}
    optionDialog.close();change(optionItem.id,selectedOpt,optionQuantity);catalog.querySelector(`[data-add="${optionItem.id}"]`)?.focus({preventScroll:true});
  });
  $('options').addEventListener('change',()=>$('option-warning').textContent='');
  function setOptQty(d){optionQuantity=Math.max(1,Math.min(99,optionQuantity+d));$('opt-qty').value=String(optionQuantity);$('opt-total').textContent=money(optionItem.cents*optionQuantity);$('opt-less').disabled=optionQuantity===1;$('opt-more').disabled=optionQuantity===99;}
  $('opt-less').addEventListener('click',()=>setOptQty(-1));$('opt-more').addEventListener('click',()=>setOptQty(1));
  $('menu-search').addEventListener('input',()=>{renderCatalog();$('catalog-scroll').scrollTop=0;});
  $('order-note').addEventListener('input',e=>{state.note=e.target.value.slice(0,400);resetConsents();save();updateSummaryLink();});
  $('keep-browsing').addEventListener('click',()=>openCatalog(family,true));
  $('send-order').addEventListener('click',e=>{
    if(!state.rows.length){e.preventDefault();return;}
    if(!$('age-label').hidden && !$('age-check').checked){e.preventDefault();$('cart-error').textContent='Confirme sua maioridade para incluir bebidas alcoólicas.';$('age-check').focus();return;}
    if(!$('consent').checked){e.preventDefault();$('cart-error').textContent='Autorize o compartilhamento do resumo para abrir o WhatsApp.';$('consent').focus();return;}
    updateSummaryLink();$('cart-error').textContent='';$('cart-feedback').textContent='Revise a mensagem no WhatsApp e envie quando estiver tudo certo.';
  });
  ['consent','age-check'].forEach(id=>$(id).addEventListener('change',()=>{$('cart-error').textContent='';}));
  $('copy-order').addEventListener('click',async()=>{
    const text=summary();let ok=false;
    try {await navigator.clipboard.writeText(text);ok=true;} catch {
      $('manual-copy').hidden=false;$('copy-text').value=text;$('copy-text').focus();$('copy-text').select();
      try {ok=document.execCommand('copy');} catch{}
    }
    $('manual-copy').hidden=ok;$('cart-feedback').textContent=ok?'Resumo copiado. Nenhum pedido foi enviado.':'O resumo está selecionado. Use a opção Copiar do seu dispositivo.';
  });
  function openLegal(which){$('legal-title').textContent=which==='termos'?'Termos de uso':'Política de Privacidade';$('legal-body').replaceChildren($(which==='termos'?'terms-text':'privacy-text').content.cloneNode(true));show($('legal-dialog'));$('legal-dialog').querySelector('.dialog-pad').scrollTop=0;}
  function closeNav(){const btn=$('nav-toggle');$('mobile-nav').hidden=true;btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Abrir navegação');btn.innerHTML=icon('menu');}
  $('nav-toggle').addEventListener('click',()=>{const open=$('mobile-nav').hidden;if(!open){closeNav();return;}$('mobile-nav').hidden=false;$('nav-toggle').setAttribute('aria-expanded','true');$('nav-toggle').setAttribute('aria-label','Fechar navegação');$('nav-toggle').innerHTML=icon('close');});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('mobile-nav').hidden){closeNav();$('nav-toggle').focus();}});
  matchMedia('(min-width:701px)').addEventListener('change',e=>{if(e.matches)closeNav();});
  document.addEventListener('click',e=>{
    const b=e.target.closest('button,a');
    if(!$('mobile-nav').hidden && (!e.composedPath().includes($('hdr')) || e.target.closest('#mobile-nav a')))closeNav();
    if(!b)return;
    if(b.hasAttribute('data-close')){b.closest('dialog')?.close();return;}
    if(b.dataset.legal){e.preventDefault();openLegal(b.dataset.legal);return;}
    if(b.hasAttribute('data-menu')){openCatalog(b.dataset.menu);return;}
    if(b.hasAttribute('data-cart')){renderCart();show(cartDialog);return;}
    if(b.dataset.family){family=b.dataset.family;renderCatalog();$('catalog-scroll').scrollTop=0;return;}
    if(b.hasAttribute('data-clear-filters')){family='all';$('menu-search').value='';renderCatalog();$('menu-search').focus();return;}
    if(b.dataset.add){addProduct(b.dataset.add,b);return;}
    if(b.dataset.step){const [id,op]=b.dataset.key.split('@');change(id,Number(op),Number(b.dataset.step),b.dataset.place);return;}
    if(b.dataset.remove){const [id,op]=b.dataset.remove.split('@');change(id,Number(op),-99,'cart');}
  });
  const reviews=[
    ['Pedro Barros','Excelente massa, pizza muito recheada. Pessoal muito atencioso, gostei muito do espaço. Recomendo!!'],
    ['Larri Oliveira','Ótimo atendimento! Pizzas de qualidade! Sobremesas maravilhosas! Amei! Recomendo!'],
    ['Rondinelle Nery','Melhor pizza da cidade!! música ambiente de ótimo gosto. Pizzas maravilhosas!! E o ambiente nem se fala, parece que tô no interior de fortaleza estando na cidade']
  ];
  let review=0;
  function setReview(d){review=(review+d+reviews.length)%reviews.length;const [who,quote]=reviews[review];$('quote-content').innerHTML=`<blockquote>${escape(quote)}</blockquote><p class="quote-author">${escape(who)} <span>· Google Maps</span></p>`;$('review-page').textContent=`0${review+1} / 03`;}
  $('prev-review').addEventListener('click',()=>setReview(-1));$('next-review').addEventListener('click',()=>setReview(1));
  const links=[...document.querySelectorAll('.desktop-nav a')];const sections=links.map(a=>document.querySelector(a.hash));let navFrame=0;
  function activeSection(){navFrame=0;let current=0;sections.forEach((s,i)=>{if(s.getBoundingClientRect().top<=innerHeight*.33) current=i;});if(window.scrollY+innerHeight>=document.documentElement.scrollHeight-3)current=sections.length-1;links.forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
  window.addEventListener('scroll',()=>{if(!navFrame)navFrame=requestAnimationFrame(activeSection);},{passive:true});activeSection();
  const motion=$('motion-setting');const reduced=matchMedia('(prefers-reduced-motion: reduce)');let paused=false;try{paused=sessionStorage.getItem('la-napolitana:motion')==='paused';}catch{}
  function syncMotion(){document.documentElement.classList.toggle('motion-off',paused||reduced.matches);motion.hidden=reduced.matches;motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'Retomar movimento':'Pausar movimento';}
  motion.addEventListener('click',()=>{paused=!paused;try{sessionStorage.setItem('la-napolitana:motion',paused?'paused':'on');}catch{}syncMotion();});reduced.addEventListener('change',syncMotion);syncMotion();
  // Videos are optional: posters on phones/reduced motion; one visible, silent clip at a time.
  const videos=[...document.querySelectorAll('video[data-video]')];
  if(videos.length){
    const small=matchMedia('(max-width:620px)'), visible=new Set();
    const update=()=>{const active=(!document.hidden&&!small.matches&&!paused&&!reduced.matches)?videos.find(v=>visible.has(v)):null;
      for(const v of videos){const poster=v.previousElementSibling;if(v!==active){v.pause();v.hidden=true;poster.hidden=false;continue;}
        if(!v.getAttribute('src'))v.src=v.dataset.video;v.muted=true;v.hidden=false;poster.hidden=true;v.play().catch(()=>{v.hidden=true;poster.hidden=false;});
      }
    };
    const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting)visible.add(e.target.querySelector('video'));else visible.delete(e.target.querySelector('video'));}update();},{threshold:.2});
    videos.forEach(v=>observer.observe(v.parentElement));small.addEventListener('change',update);reduced.addEventListener('change',update);motion.addEventListener('click',update);document.addEventListener('visibilitychange',update);
  }
  renderCart();
  if(location.hash==='#privacidade'||location.hash==='#termos')openLegal(location.hash.slice(1));
})();
