(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (id) => document.getElementById(id);
  const data = JSON.parse($('site-data').textContent);
  const model = orderModel(data.menu, data.order);
  const escape = (text) => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#i-${id}"></use></svg>`;
  const cartKey = 'dai-pedido-v1';
  const motionKey = 'dai-movimento-v1';
  const store = (scope, key, value) => {
    try { window[scope].setItem(key, value); } catch { /* The page still works without browser storage. */ }
  };
  const read = (scope, key) => {
    try { return window[scope].getItem(key); } catch { return null; }
  };
  let saved = {};
  try { saved = JSON.parse(read('sessionStorage', cartKey)) ?? {}; } catch { /* Start with an empty cart. */ }
  let cart = model.normalize(saved.cart);
  let mode = model.modes.includes(saved.mode) ? saved.mode : '';
  const orderDialog = $('order-dialog');
  const legalDialog = $('legal-dialog');
  const tabs = [...document.querySelectorAll('[data-menu-tab]')];
  const note = $('order-note');
  const address = $('delivery-address');
  const consent = $('order-consent');
  const summary = $('order-summary');
  const copy = $('copy-order');
  let toastTimer;
  let cartOpener = null;
  let legalOpener = null;
  let restoreCartFocus = true;
  let restoreLegalFocus = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  function saveCart() {
    store('sessionStorage', cartKey, JSON.stringify({ cart, mode }));
  }

  function setCategory(id, moveFocus = false) {
    for (const tab of tabs) {
      const selected = tab.dataset.menuTab === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = $(tab.getAttribute('aria-controls'));
      panel.hidden = !selected;
      if (selected && moveFocus) tab.focus();
    }
  }
  if (tabs.length) {
    $('menu-tabs').setAttribute('role', 'tablist');
    for (const tab of tabs) {
      tab.setAttribute('role', 'tab');
      const panel = $(tab.getAttribute('aria-controls'));
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
    }
    setCategory(tabs[0].dataset.menuTab);
    $('menu-tabs').hidden = false;
    $('menu-tabs').addEventListener('keydown', event => {
      const index = tabs.indexOf(event.target);
      if (index < 0) return;
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      setCategory(tabs[next].dataset.menuTab, true);
    });
  }

  function updateModeControls() {
    $('mode-field').hidden = model.modes.length === 0;
    const needsAddress = model.requiresAddress && mode === 'delivery';
    $('address-field').hidden = !needsAddress;
    $('consent-field').hidden = !needsAddress;
    address.required = consent.required = needsAddress;
    if (!needsAddress) {
      address.value = '';
      address.setCustomValidity('');
      consent.checked = false;
    }
  }
  const modeOptions = [['', 'A definir'], ...model.modes.map(key => [key, MODE_LABELS[key]])];
  $('mode-options').innerHTML = modeOptions.map(([key, label]) => `<label class="mode-choice"><input name="mode" type="radio" value="${key}"${key === mode ? ' checked' : ''}><span>${label}</span></label>`).join('');
  $('mode-note').textContent = model.whatsapp ? 'A casa confirma a possibilidade de entrega ou recolha.' : 'A plataforma de pedidos indica a disponibilidade para entrega ou recolha.';
  $('mode-options').addEventListener('change', event => {
    if (event.target.name !== 'mode') return;
    mode = model.modes.includes(event.target.value) ? event.target.value : '';
    saveCart();
    updateModeControls();
    renderSummary();
    showOrderStatus('');
  });
  updateModeControls();
  $('send-order').hidden = !model.whatsapp;
  if (model.whatsapp) copy.classList.replace('btn-primary', 'btn-outline');
  $('handoff-note').textContent = model.whatsapp
    ? 'A mensagem abre no WhatsApp para rever e enviar. A casa confirma o pedido.'
    : data.order.platform ? 'Copiar não envia o pedido. A seleção não é transferida para a plataforma externa.' : 'Copiar não envia o pedido. Confirme os detalhes com a casa.';

  function orderMessage() {
    return model.message({ name: data.name, cart, mode, note: note.value, address: address.value });
  }
  function renderSummary() { summary.value = orderMessage(); }
  function showOrderStatus(text) { $('order-status').textContent = text; }
  function orderLine({ item, quantity, amount }) {
    const name = escape(item.name);
    return `<li class="order-line"><div><h3>${name}</h3>${amount === null ? '' : `<p>${formatPrice(item.priceCents)} / un. · ${formatPrice(amount)}</p>`}</div>
      <div class="quantity"><button class="round" data-step="-1" data-item="${item.id}" type="button" aria-label="Diminuir quantidade de ${name}">${icon('minus')}</button>
      <output aria-label="Quantidade de ${name}">${quantity}</output><button class="round" data-step="1" data-item="${item.id}" type="button" aria-label="Aumentar quantidade de ${name}"${quantity === MAX_QUANTITY ? ' disabled' : ''}>${icon('plus')}</button>
      <button class="round delete" data-step="0" data-item="${item.id}" type="button" aria-label="Remover ${name}">${icon('x')}</button></div></li>`;
  }
  function renderCart(previousControl) {
    const view = model.summarize(cart);
    const quantity = view.quantity;
    const itemText = `${quantity} ${quantity === 1 ? 'artigo' : 'artigos'}`;
    document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = quantity; });
    document.querySelectorAll('[data-open-cart]').forEach(el => {
      const visibleText = el.classList.contains('floating-cart') ? 'Ver pedido' : el.classList.contains('bag-trigger') ? 'O meu pedido' : 'Ver o meu pedido';
      el.setAttribute('aria-label', `${visibleText}, ${itemText}`);
    });
    document.querySelector('.floating-cart').hidden = quantity === 0;
    $('order-count').textContent = itemText;
    $('order-empty').hidden = quantity > 0;
    $('order-content').hidden = $('drawer-foot').hidden = quantity === 0;
    $('order-lines').innerHTML = view.lines.map(orderLine).join('');
    $('order-totals').innerHTML = view.subtotal === null
      ? '<div><dt>Preços</dt><dd>A confirmar</dd></div>'
      : `<div><dt>${view.complete ? 'Subtotal' : 'Subtotal dos artigos com preço'}</dt><dd>${formatPrice(view.subtotal)}</dd></div><div><dt>${view.complete ? 'Total dos artigos' : 'Total'}</dt><dd>${view.complete ? formatPrice(view.subtotal) : 'A confirmar'}</dd></div>`;
    $('total-note').hidden = !view.complete;
    renderSummary();
    showOrderStatus('');
    if (previousControl) {
      const same = $('order-lines').querySelector(`[data-item="${previousControl.dataset.item}"][data-step="${previousControl.dataset.step}"]:enabled`);
      (same ?? $('order-lines').querySelector('button:enabled') ?? $('order-empty').querySelector('a')).focus({ preventScroll: true });
    }
  }

  function announce(text) {
    const toast = $('toast');
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.classList.remove('is-visible'); toast.textContent = ''; }, 2900);
  }
  const buttonTimers = new WeakMap();
  function addItem(button) {
    const id = button.dataset.add;
    if (!model.items.has(id)) return;
    if (cart[id] >= MAX_QUANTITY) {
      announce('Limite da seleção atingido para este artigo.');
      return;
    }
    cart = model.update(cart, id, 1);
    saveCart();
    renderCart();
    announce(`${model.items.get(id).name} · ${cart[id]} no pedido`);
    button.classList.add('is-added');
    const use = button.querySelector('use');
    if (use) use.setAttribute('href', '#i-check');
    clearTimeout(buttonTimers.get(button));
    buttonTimers.set(button, setTimeout(() => {
      button.classList.remove('is-added');
      if (use) use.setAttribute('href', '#i-plus');
    }, 900));
  }
  const syncEditable = () => { showOrderStatus(''); address.setCustomValidity(''); renderSummary(); };
  note.addEventListener('input', syncEditable);
  address.addEventListener('input', syncEditable);
  $('order-form').addEventListener('submit', event => {
    event.preventDefault();
    const hasItems = model.summarize(cart).quantity > 0;
    if (!model.whatsapp || !hasItems) return;
    if (address.required && !address.value.trim()) {
      address.setCustomValidity('Indique a morada para pedir entrega.');
      address.reportValidity();
      return;
    }
    if (!$('order-form').reportValidity()) return;
    const url = model.whatsappUrl(orderMessage());
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      showOrderStatus('Reveja e envie a mensagem no WhatsApp. O pedido ainda não foi confirmado pela casa.');
    }
  });
  copy.addEventListener('click', async () => {
    const text = orderMessage();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showOrderStatus('Resumo copiado. Ainda não foi enviado.');
    } catch {
      $('summary-details').open = true;
      summary.focus();
      summary.select();
      showOrderStatus('Selecione e copie o resumo apresentado. Nada foi enviado.');
    }
  });

  const nav = $('site-nav');
  const navToggle = $('nav-toggle');
  function setNav(open) {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    navToggle.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
  }
  navToggle.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    setNav(open);
    if (open) nav.querySelector('a')?.focus();
  });
  matchMedia('(max-width: 820px)').addEventListener('change', () => setNav(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); navToggle.focus(); }
  });
  function showOrder(button) {
    if (orderDialog.open) return;
    setNav(false);
    cartOpener = button;
    restoreCartFocus = true;
    renderCart();
    orderDialog.showModal();
    $('drawer-scroll').scrollTop = 0;
    $('summary-details').open = false;
  }
  function showLegal(key, element) {
    if (!['privacidade', 'termos'].includes(key)) return;
    legalOpener = element;
    restoreLegalFocus = true;
    $('privacidade').hidden = key !== 'privacidade';
    $('termos').hidden = key !== 'termos';
    $('legal-title').textContent = key === 'privacidade' ? 'Política de Privacidade' : 'Termos de Uso';
    if (!legalDialog.open) legalDialog.showModal();
    legalDialog.scrollTop = 0;
  }
  orderDialog.addEventListener('close', () => { if (restoreCartFocus && cartOpener?.isConnected && !cartOpener.hidden) cartOpener.focus({ preventScroll: true }); });
  legalDialog.addEventListener('close', () => { if (restoreLegalFocus && legalOpener?.isConnected) legalOpener.focus({ preventScroll: true }); });
  document.addEventListener('click', event => {
    const el = event.target instanceof Element ? event.target : null;
    if (!el) return;
    if (el === orderDialog || el === legalDialog) { el.close(); return; }
    const button = el.closest('button');
    const link = el.closest('a');
    const policy = el.closest('[data-policy]');
    const closer = el.closest('[data-close]');
    if (nav.classList.contains('is-open') && (link?.closest('#site-nav') || !el.closest('#hdr'))) setNav(false);
    if (policy) { event.preventDefault(); showLegal(policy.dataset.policy, policy); return; }
    if (closer) {
      if (link && closer.dataset.close === 'order-dialog') restoreCartFocus = false;
      if (link && closer.dataset.close === 'legal-dialog') {
        restoreLegalFocus = false;
        if (orderDialog.open) { restoreCartFocus = false; orderDialog.close(); }
      }
      $(closer.dataset.close).close();
      return;
    }
    if (button?.hasAttribute('data-open-cart')) { showOrder(button); return; }
    if (button?.hasAttribute('data-menu-tab')) { setCategory(button.dataset.menuTab); return; }
    if (button?.hasAttribute('data-add')) { addItem(button); return; }
    if (button?.hasAttribute('data-step')) {
      cart = model.update(cart, button.dataset.item, Number(button.dataset.step));
      if (!model.summarize(cart).quantity) {
        mode = '';
        note.value = '';
        $('mode-options').querySelector('input[value=""]').checked = true;
        updateModeControls();
      }
      saveCart();
      renderCart(button);
    }
  });

  const motionToggle = $('motion-toggle');
  let paused = read('localStorage', motionKey) === 'paused';
  function paintMotion() {
    root.dataset.motion = paused || reduce.matches ? 'paused' : 'playing';
    motionToggle.setAttribute('aria-pressed', String(paused));
    motionToggle.hidden = reduce.matches;
  }
  paintMotion();
  reduce.addEventListener('change', paintMotion);
  motionToggle.addEventListener('click', () => {
    paused = !paused;
    paintMotion();
    store('localStorage', motionKey, paused ? 'paused' : 'playing');
  });

  // Loaded only for an authorized local file, one visible clip at a time. The image is always the poster fallback.
  const videos = [...document.querySelectorAll('video[data-local-video]')];
  if (videos.length && 'IntersectionObserver' in window) {
    const mobile = matchMedia('(max-width: 620px)');
    const visible = new Set();
    function updateVideo() {
      const eligible = !mobile.matches && !paused && !reduce.matches && !navigator.connection?.saveData && !document.hidden;
      const next = eligible ? videos.find(video => visible.has(video)) : null;
      for (const video of videos) {
        if (video !== next) {
          video.pause();
          video.classList.remove('is-playing');
          continue;
        }
        if (!video.hasAttribute('src')) {
          const photo = video.parentElement.querySelector('img');
          video.poster = photo.currentSrc || photo.src;
          video.src = $(video.dataset.localVideo).textContent.trim();
        }
        video.play().then(() => { if (!video.paused) video.classList.add('is-playing'); }).catch(() => {});
      }
    }
    const watcher = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.querySelector('video'));
        else visible.delete(entry.target.querySelector('video'));
      }
      updateVideo();
    }, { threshold: .25 });
    for (const video of videos) watcher.observe(video.parentElement);
    mobile.addEventListener('change', updateVideo);
    reduce.addEventListener('change', updateVideo);
    document.addEventListener('visibilitychange', updateVideo);
    motionToggle.addEventListener('click', updateVideo);
  }

  // Keep the navigation linked to the nearest current chapter without moving focus.
  if ('IntersectionObserver' in window) {
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const anchor = links.find(a => a.hash === `#${entry.target.id}`);
        if (entry.isIntersecting) anchor.setAttribute('aria-current', 'location');
        else anchor.removeAttribute('aria-current');
      }
    }, { rootMargin: '-25% 0px -57% 0px' });
    for (const link of links) observer.observe($(link.hash.slice(1)));
  }
  renderCart();
})();
