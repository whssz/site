(function(){
  'use strict';
  var WA='5521994738183', KEY='agridoce-pedido-v1';
  var $=function(s,c){return (c||document).querySelector(s)}, $$=function(s,c){return [].slice.call((c||document).querySelectorAll(s))};
  var cart=[];
  try{var raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(raw))cart=raw.filter(function(i){return i&&typeof i.name==='string'&&i.qty>0}).map(function(i){return{name:String(i.name).slice(0,80),opt:String(i.opt||'').slice(0,20),qty:Math.min(99,Math.max(1,i.qty|0)),note:String(i.note||'').slice(0,140)}})}catch(e){cart=[]}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(cart))}catch(e){}}
  function total(){return cart.reduce(function(a,i){return a+i.qty},0)}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

  var list=$('#cartList'),formArea=$('#formArea'),sendBtn=$('#sendBtn'),fab=$('#fab'),err=$('#formErr');
  var WA_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-wa"/></svg>';
  function render(fresh){
    var n=total();
    $$('[data-count]').forEach(function(e){e.textContent=n;if(e.classList.contains('count')){e.classList.remove('bump');void e.offsetWidth;e.classList.add('bump')}});
    $('[data-count-sr]').textContent=n+(n===1?' item no pedido':' itens no pedido');
    fab.classList.toggle('on',n>0);
    formArea.hidden=!n;
    if(!n){
      list.innerHTML='<div class="empty"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#i-cupcake"/></svg><p><b>Seu pedido está vazio.</b></p><p>Adicione doces ou hambúrgueres do cardápio para começar.</p></div>';
      sendBtn.textContent='Ver o cardápio';sendBtn.dataset.mode='menu';
      return;
    }
    sendBtn.innerHTML=WA_ICON+'Finalizar pedido pelo WhatsApp';sendBtn.dataset.mode='send';
    list.innerHTML=cart.map(function(i,k){
      return '<div class="ci'+(fresh===k?' new':'')+'"><div class="ci-top"><b>'+esc(i.name)+(i.opt?'<small>Carne de '+esc(i.opt)+'</small>':'')+'</b><button type="button" class="rm" data-rm="'+k+'" aria-label="Remover '+esc(i.name)+' do pedido">Remover</button></div>'+
      '<div class="ci-row"><div class="qty"><button type="button" data-dec="'+k+'" aria-label="Diminuir quantidade de '+esc(i.name)+'">−</button><output aria-label="Quantidade">'+i.qty+'</output><button type="button" data-inc="'+k+'" aria-label="Aumentar quantidade de '+esc(i.name)+'">+</button></div>'+
      '<input type="text" data-note="'+k+'" maxlength="140" value="'+esc(i.note)+'" placeholder="Observação do item" aria-label="Observação para '+esc(i.name)+'"></div></div>';
    }).join('');
  }
  list.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    if(b.dataset.inc!=null){var i=cart[+b.dataset.inc];if(i.qty<99)i.qty++}
    else if(b.dataset.dec!=null){var k=+b.dataset.dec;cart[k].qty--;if(cart[k].qty<1)cart.splice(k,1)}
    else if(b.dataset.rm!=null){cart.splice(+b.dataset.rm,1)}
    else return;
    save();render();
  });
  list.addEventListener('input',function(e){var t=e.target;if(t.dataset.note!=null&&cart[+t.dataset.note]){cart[+t.dataset.note].note=t.value;save()}});

  var toastT,toast=$('#toast');
  function say(m){toast.textContent=m;toast.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){toast.classList.remove('on')},2600)}

  $$('.card[data-item]').forEach(function(card){
    var btn=$('.add',card),old=btn.innerHTML,t;
    btn.addEventListener('click',function(){
      var name=card.dataset.item,o=$('.opts input:checked',card),opt=o?o.value:'';
      var idx=-1;cart.forEach(function(i,k){if(i.name===name&&i.opt===opt)idx=k});
      if(idx>-1){if(cart[idx].qty<99)cart[idx].qty++}else{cart.push({name:name,opt:opt,qty:1,note:''});idx=cart.length-1}
      save();render(idx);
      btn.classList.add('ok');btn.textContent='Adicionado ao pedido';
      clearTimeout(t);t=setTimeout(function(){btn.classList.remove('ok');btn.innerHTML=old},1300);
      say(name+' adicionado ao pedido.');
    });
  });

  /* gaveta do pedido */
  var drawer=$('#drawer'),scrim=$('#scrim'),lastFocus=null;
  function openCart(){lastFocus=document.activeElement;drawer.classList.add('on');scrim.classList.add('on');drawer.setAttribute('aria-hidden','false');document.documentElement.style.overflow='hidden';setTimeout(function(){$('#closeCart').focus()},60)}
  function closeCart(){drawer.classList.remove('on');scrim.classList.remove('on');drawer.setAttribute('aria-hidden','true');document.documentElement.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus()}
  $$('[data-open-cart]').forEach(function(b){b.addEventListener('click',openCart)});
  $('#closeCart').addEventListener('click',closeCart);scrim.addEventListener('click',closeCart);
  $$('[data-close]').forEach(function(a){a.addEventListener('click',closeCart)});
  document.addEventListener('keydown',function(e){
    if(!drawer.classList.contains('on'))return;
    if(e.key==='Escape'){closeCart();return}
    if(e.key==='Tab'){var f=$$('button,a[href],input,textarea',drawer).filter(function(x){return x.offsetParent!==null});if(!f.length)return;var a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
  });

  /* entrega x retirada */
  var endWrap=$('#endWrap'),fEnd=$('#fEnd'),hint=$('#modoHint');
  function modo(){return ($('input[name="modo"]:checked')||{}).value||'Entrega'}
  function syncModo(){var ent=modo()==='Entrega';endWrap.hidden=!ent;fEnd.required=ent;hint.textContent=ent?'A taxa e a área de entrega são confirmadas pelo atendimento.':'O ponto e o horário de retirada são combinados pelo atendimento.'}
  $$('input[name="modo"]').forEach(function(r){r.addEventListener('change',syncModo)});syncModo();

  function buildMessage(){
    var nome=$('#fNome').value.trim(),end=fEnd.value.trim(),obs=$('#fObs').value.trim(),m=modo();
    var L=['Olá, Agridoce! Gostaria de fazer um pedido pelo site:','','*Itens do pedido*'];
    cart.forEach(function(i){L.push('• '+i.qty+'x '+i.name+(i.opt?' ('+i.opt+')':'')+(i.note.trim()?' | obs.: '+i.note.trim():''))});
    L.push('','*Recebimento:* '+m);
    if(m==='Entrega')L.push('*Endereço:* '+end);
    L.push('*Nome:* '+nome);
    if(obs)L.push('*Observações:* '+obs);
    L.push('','Aguardo a confirmação de disponibilidade, valores e prazo. Obrigado!');
    return L.join('\n');
  }

  $('#orderForm').addEventListener('submit',function(e){
    e.preventDefault();err.textContent='';
    if(sendBtn.dataset.mode==='menu'||!cart.length){closeCart();var c0=$('#cardapio');if(c0)c0.scrollIntoView();return}
    var nome=$('#fNome'),c=$('#fConsent');
    if(!nome.value.trim()){err.textContent='Informe seu nome para enviar o pedido.';nome.focus();return}
    if(modo()==='Entrega'&&!fEnd.value.trim()){err.textContent='Informe o endereço de entrega ou escolha retirada.';fEnd.focus();return}
    if(!c.checked){err.textContent='Marque a caixa de consentimento para continuar.';c.focus();return}
    var url='https://wa.me/'+WA+'?text='+encodeURIComponent(buildMessage());
    var w=window.open(url,'_blank');
    if(!w)location.href=url;
    say('Abrindo o WhatsApp com o seu pedido. A casa responde por lá.');
  });

  /* abas */
  var tabs=$$('.tab');
  function pick(id,focus){
    tabs.forEach(function(t){var on=t.id==='tab-'+id;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;var p=$('#'+t.getAttribute('aria-controls'));p.hidden=!on;if(on){if(focus)t.focus();$$('.rv-fade,.rv-scale,.rv-left,.rv-right,.rev',p).forEach(function(x){x.classList.add('in')})}});
  }
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(){pick(t.id.replace('tab-',''))});
    t.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();pick(tabs[(i+1)%tabs.length].id.replace('tab-',''),true)}});
  });
  $$('[data-go]').forEach(function(a){a.addEventListener('click',function(){pick(a.dataset.go)})});

  /* menu mobile */
  var links=$('#links'),mt=$('#menut');
  mt.addEventListener('click',function(){var on=links.classList.toggle('on');mt.setAttribute('aria-expanded',on);mt.setAttribute('aria-label',on?'Fechar menu':'Abrir menu')});
  $$('a',links).forEach(function(a){a.addEventListener('click',function(){links.classList.remove('on');mt.setAttribute('aria-expanded','false');mt.setAttribute('aria-label','Abrir menu')})});

  /* dia de hoje na tabela de horários */
  var tr=$('.hours tr[data-d="'+new Date().getDay()+'"]');if(tr)tr.classList.add('today');

  /* reveal .rev + vídeos só tocam quando visíveis + parallax dos doodles */
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.1});
    $$('.rev').forEach(function(el){io.observe(el)});
    var vo=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;if(e.isIntersecting&&!reduce){var p=v.play();if(p&&p.catch)p.catch(function(){})}else v.pause()})},{threshold:.2});
    $$('video').forEach(function(v){v.muted=true;if(reduce){v.removeAttribute('autoplay');v.pause()}vo.observe(v)});
  }else{$$('.rev').forEach(function(el){el.classList.add('in')})}
  if(!reduce){
    var fl=$$('.float .f svg'),tick=false;
    addEventListener('scroll',function(){if(tick)return;tick=true;requestAnimationFrame(function(){var y=window.pageYOffset;fl.forEach(function(el,i){el.style.transform='translate3d(0,'+(-((y*(0.04+i*0.015))%260)).toFixed(1)+'px,0)'});tick=false})},{passive:true});
  }
  render();
})();
