(() => {
  'use strict';
  const $ = (selector, el = document) => el.querySelector(selector);
  const $$ = (selector, el = document) => [...el.querySelectorAll(selector)];
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const safe = value => String(value).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s]);
  const { items, business } = JSON.parse($('#store-data').textContent);
  const catalog = new Map(items.map(item => [item.id, item]));
  const money = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  const format = cents => money.format(cents / 100);
  const orderKey = 'brutta-order-v1';
  const motionKey = 'brutta-motion-v1';
  const unitLimit = 99;

  function getLocal(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function setLocal(key, value) {
    try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* Private or embedded browsers retain state in memory. */ }
  }
  const basket = new Map();
  try {
    const stored = JSON.parse(getLocal(orderKey));
    if (Array.isArray(stored)) for (const row of stored) {
      if (Array.isArray(row) && catalog.has(row[0]) && Number.isSafeInteger(row[1]) && row[1] > 0) basket.set(row[0], Math.min(row[1], unitLimit));
    }
  } catch { /* Ignore obsolete or damaged local state. */ }

  const dialog = $('#order-dialog');
  const cartToggle = $('#cart-toggle');
  const orderLines = $('#order-lines');
  const note = $('#order-note');
  const noteHelp = $('#note-help');
  const orderPreview = $('#order-preview');
  const summary = $('#order-summary');
  const copyButton = $('#order-copy');
  const channel = $('#order-channel');
  const channelNote = $('#order-channel-note');
  const consent = $('#wa-agree');
  let method = 'pickup';
  let returnFocus = null;
  let toastTimer;
  let feedbackTimer;

  function subtotal() {
    let cents = 0;
    for (const [id, qty] of basket) cents += catalog.get(id).cents * qty;
    return cents;
  }
  function summaryText() {
    const entries = [...basket].map(([id, quantity]) => {
      const item = catalog.get(id);
      return `• ${quantity} × ${item.name} — ${format(item.cents * quantity)}`;
    });
    const methodText = method === 'delivery' ? 'entrega pela Uber Eats' : 'recolha na Brutta';
    return [
      `Resumo de encomenda | ${business.name}`,
      `Modalidade: ${methodText}`,
      '', ...entries, '',
      `Subtotal de referência: ${format(subtotal())}`,
      'Referência: preços de recolha na Uber Eats, sem taxas de entrega.',
      'Valor final e disponibilidade a confirmar.',
      ...(note.value.trim() ? ['', `Observações: ${note.value.trim()}`] : [])
    ].join('\n');
  }
  function announce(text) {
    const toast = $('#toast');
    $('span', toast).textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }
  function updateBadge() {
    const count = [...basket.values()].reduce((a, b) => a + b, 0);
    $('#cart-count').textContent = count;
    cartToggle.setAttribute('aria-label', `O meu pedido ${count} ${count === 1 ? 'artigo' : 'artigos'}`);
  }
  function clearFeedback() {
    clearTimeout(feedbackTimer);
    $('#copy-feedback').textContent = '';
  }
  function refreshSummary() {
    summary.textContent = basket.size ? summaryText() : '';
    const delivery = method === 'delivery';
    const useWhatsapp = !!(business.whatsapp && !delivery);
    const whatsappReady = useWhatsapp && consent.checked && basket.size > 0;
    if (consent) $('#wa-consent').hidden = !useWhatsapp || !basket.size;
    $('span', channel).textContent = delivery ? 'Abrir na Uber Eats' : useWhatsapp ? 'Abrir no WhatsApp' : 'Ligar para encomendar';
    $('use', channel).setAttribute('href', `#i-${delivery ? 'out' : useWhatsapp ? 'chat' : 'phone'}`);
    if (delivery || whatsappReady) {
      channel.target = '_blank';
      channel.rel = 'noopener noreferrer';
    } else {
      channel.removeAttribute('target');
      channel.removeAttribute('rel');
    }
    channel.href = delivery ? business.delivery : useWhatsapp
      ? (whatsappReady ? `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(summary.textContent)}` : '#wa-consent')
      : `tel:${business.phone}`;
    channelNote.textContent = delivery
      ? 'O pedido não transita para a Uber Eats. Selecione os artigos na plataforma e confirme preços, taxas e disponibilidade.'
      : useWhatsapp
        ? 'Reveja e envie a mensagem no WhatsApp. A encomenda só fica confirmada pela Brutta.'
        : 'Use o resumo ao ligar. Confirme o preço, a disponibilidade e o horário de recolha com a Brutta.';
    note.placeholder = delivery ? 'Ex.: observação para se lembrar ao encomendar' : 'Ex.: a hora a que pretende passar';
    noteHelp.textContent = delivery ? 'Não inclua dados pessoais. A nota não passa para a plataforma.' : 'Não inclua dados pessoais. As observações não confirmam um horário de recolha.';
    clearFeedback();
  }
  function renderOrder() {
    const empty = !basket.size;
    $('#order-empty').hidden = !empty;
    $('#order-content').hidden = empty;
    $('#order-footer').hidden = empty;
    orderLines.innerHTML = [...basket].map(([id, quantity]) => {
      const item = catalog.get(id);
      const name = safe(item.name);
      return `<li class="order-line" data-item="${id}"><div class="line-info"><strong>${name}</strong><small>${format(item.cents)} / un. · ${format(item.cents * quantity)}</small></div>
        <div class="line-actions"><div class="quantity">
          <button type="button" data-edit="minus" aria-label="Diminuir quantidade de ${name}" ${quantity <= 1 ? 'disabled' : ''}>${icon('minus')}</button>
          <span><span class="sr-only">Quantidade: </span>${quantity}</span>
          <button type="button" data-edit="plus" aria-label="Aumentar quantidade de ${name}" ${quantity >= unitLimit ? 'disabled' : ''}>${icon('add')}</button>
        </div><button class="subtle-button line-remove" type="button" data-edit="remove" aria-label="Remover ${name}">Remover</button></div></li>`;
    }).join('');
    $('#order-total').textContent = format(subtotal());
    refreshSummary();
  }
  function updateState() {
    if (consent) consent.checked = false;
    setLocal(orderKey, basket.size ? JSON.stringify([...basket]) : null);
    updateBadge();
    if (dialog.open) renderOrder();
  }
  function addItem(button) {
    const id = button.dataset.add;
    const item = catalog.get(id);
    if (!item) return;
    const quantity = basket.get(id) || 0;
    if (quantity === unitLimit) {
      announce('A lista atingiu o limite de 99 unidades deste artigo.');
      return;
    }
    basket.set(id, quantity + 1);
    updateState();
    button.classList.add('is-added');
    $('use', button).setAttribute('href', '#i-check');
    clearTimeout(button.feedbackTimer);
    button.feedbackTimer = setTimeout(() => {
      button.classList.remove('is-added');
      $('use', button).setAttribute('href', '#i-add');
    }, 900);
    announce(`${item.name} — adicionado ao pedido.`);
  }
  function showOrder(trigger) {
    if (dialog.open) return;
    returnFocus = trigger;
    renderOrder();
    dialog.showModal();
    $('.order-scroll').scrollTop = 0;
    $('#cart-close').focus();
  }
  function resetOrder() {
    basket.clear();
    note.value = '';
    method = 'pickup';
    $('input[value="pickup"]', dialog).checked = true;
    if (consent) consent.checked = false;
    orderPreview.open = false;
    updateState();
  }

  document.addEventListener('click', event => {
    const add = event.target.closest('[data-add]');
    if (add) addItem(add);
    const open = event.target.closest('#cart-toggle,[data-open-order]');
    if (open) showOrder(open);
  });
  $('#cart-close').addEventListener('click', () => dialog.close());
  $('#empty-menu').addEventListener('click', () => {
    returnFocus = null;
    dialog.close();
    $('.menu-tabs [aria-selected="true"]')?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  });
  orderLines.addEventListener('click', event => {
    const button = event.target.closest('button[data-edit]');
    if (!button || button.disabled) return;
    const row = button.closest('[data-item]');
    const { item: id } = row.dataset;
    const qty = basket.get(id);
    const edit = button.dataset.edit;
    const index = [...orderLines.children].indexOf(row);
    if (edit === 'remove') basket.delete(id);
    else basket.set(id, qty + (edit === 'plus' ? 1 : -1));
    if (!basket.size) {
      resetOrder();
      $('#empty-menu').focus();
      return;
    }
    updateState();
    const next = edit === 'remove' ? orderLines.children[Math.min(index, orderLines.children.length - 1)] : $(`[data-item="${id}"]`, orderLines);
    const nextButton = $(`[data-edit="${edit}"]:not(:disabled)`, next) || $('button:not(:disabled)', next);
    nextButton?.focus({ preventScroll: true });
  });
  $('#order-clear').addEventListener('click', () => { resetOrder(); $('#empty-menu').focus(); });
  $$('input[name="method"]').forEach(field => field.addEventListener('change', () => {
    method = field.value;
    if (consent) consent.checked = false;
    refreshSummary();
  }));
  note.addEventListener('input', () => {
    if (consent) consent.checked = false;
    refreshSummary();
  });
  consent?.addEventListener('change', refreshSummary);
  channel.addEventListener('click', event => {
    if (business.whatsapp && method === 'pickup' && !consent.checked) {
      event.preventDefault();
      consent.focus();
      consent.reportValidity();
    }
  });

  copyButton.addEventListener('click', async () => {
    const value = summaryText();
    let copied = false;
    try { await navigator.clipboard.writeText(value); copied = true; } catch { /* Use selection fallback when browser policy disallows the clipboard. */ }
    clearFeedback();
    if (!copied) {
      orderPreview.open = true;
      summary.setAttribute('tabindex', '-1');
      summary.focus();
      const range = document.createRange();
      range.selectNodeContents(summary);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      try { copied = document.execCommand('copy'); } catch { /* The selected text remains available for manual copy. */ }
      if (copied) copyButton.focus({ preventScroll: true });
    }
    $('#copy-feedback').textContent = copied ? 'Resumo copiado. Ainda não foi enviado.' : 'O resumo está selecionado. Pode copiá-lo manualmente.';
    if (copied) feedbackTimer = setTimeout(clearFeedback, 4300);
  });

  // Use real tabs, with arrow keys, Home and End; never delete selections when browsing.
  const tabs = $$('#menu-tabs [role="tab"]');
  function selectTab(tab, moveFocus) {
    if (tab.getAttribute('aria-selected') === 'true') { if (moveFocus) tab.focus(); return; }
    for (const candidate of tabs) {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', selected);
      candidate.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(candidate.getAttribute('aria-controls'));
      panel.hidden = !selected;
      panel.classList.toggle('just-opened', selected);
    }
    if (moveFocus) tab.focus();
  }
  tabs.forEach((tab, position) => {
    tab.addEventListener('click', () => selectTab(tab, false));
    tab.addEventListener('keydown', event => {
      const n = tabs.length;
      const index = { ArrowRight: (position + 1) % n, ArrowLeft: (position - 1 + n) % n, Home: 0, End: n - 1 }[event.key];
      if (typeof index === 'number') { event.preventDefault(); selectTab(tabs[index], true); }
    });
  });
  tabs.forEach(tab => { document.getElementById(tab.getAttribute('aria-controls')).hidden = tab.getAttribute('aria-selected') !== 'true'; });
  $('#menu-tabs').hidden = false;
  $$('[data-add],[data-open-order]').forEach(button => { button.hidden = false; });
  cartToggle.hidden = false;
  updateBadge();

  const menuButton = $('#nav-toggle');
  const nav = $('#navigation');
  const navLinks = $$('a', nav);
  const mobile = matchMedia('(max-width:760px)');
  function closeNav(focus = false) {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir navegação');
    $('use', menuButton).setAttribute('href', '#i-menu');
    nav.classList.remove('is-open');
    if (focus && mobile.matches) menuButton.focus();
  }
  menuButton.addEventListener('click', event => {
    if (nav.classList.contains('is-open')) { closeNav(); return; }
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Fechar navegação');
    $('use', menuButton).setAttribute('href', '#i-close');
    nav.classList.add('is-open');
    if (event.detail === 0) navLinks[0]?.focus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) closeNav(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('#nav-toggle,#navigation') || event.target.closest('#navigation a')) closeNav();
  });
  function syncNav() { menuButton.hidden = !mobile.matches; if (!mobile.matches) closeNav(); }
  mobile.addEventListener('change', syncNav);
  syncNav();
  document.documentElement.classList.add('js-ready');
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      const link = navLinks.find(element => element.hash === `#${entry.target.id}`);
      if (!link) return;
      if (entry.isIntersecting) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }), { rootMargin: '-25% 0px -60% 0px' });
    navLinks.forEach(link => navObserver.observe(document.querySelector(link.hash)));
  }

  function openLegal(id) {
    const details = document.getElementById(id);
    if (details?.matches('details')) details.open = true;
  }
  $$('[data-legal]').forEach(link => link.addEventListener('click', () => {
    if (dialog.open) { returnFocus = null; dialog.close(); }
    openLegal(link.hash.slice(1));
    requestAnimationFrame(() => $('summary', document.getElementById(link.hash.slice(1)))?.focus({ preventScroll: true }));
  }));
  addEventListener('hashchange', () => openLegal(location.hash.slice(1)));
  openLegal(location.hash.slice(1));

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = $('#motion-toggle');
  let manualPause = getLocal(motionKey) === 'paused';
  const videoSlots = $$('.video-slot');
  const visibleSlots = new Set();
  const activeVideos = new Map();
  function syncVideos() {
    const allowed = !manualPause && !reduced.matches && !mobile.matches && !navigator.connection?.saveData;
    for (const template of videoSlots) {
      const shouldPlay = allowed && visibleSlots.has(template);
      let video = activeVideos.get(template);
      if (shouldPlay && !video) {
        video = template.content.firstElementChild.cloneNode(true);
        video.muted = true;
        video.addEventListener('playing', () => {
          if (!video.paused) video.classList.add('is-playing');
        });
        template.after(video);
        activeVideos.set(template, video);
      }
      if (video && shouldPlay) video.play().catch(() => video.classList.remove('is-playing'));
      else if (video) { video.pause(); video.classList.remove('is-playing'); }
    }
  }
  if (videoSlots.length && 'IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const template = $('.video-slot', entry.target);
        if (entry.isIntersecting) visibleSlots.add(template); else visibleSlots.delete(template);
      });
      syncVideos();
    }, { threshold: 0.24 });
    videoSlots.forEach(template => videoObserver.observe(template.parentElement));
  }
  function updateMotion() {
    const paused = reduced.matches || manualPause;
    document.documentElement.classList.toggle('motion-paused', manualPause);
    motionButton.hidden = reduced.matches;
    motionButton.setAttribute('aria-pressed', paused);
    const label = paused ? 'Retomar animações' : 'Pausar animações';
    motionButton.setAttribute('aria-label', label);
    $('span', motionButton).textContent = label;
    $('use', motionButton).setAttribute('href', paused ? '#i-play' : '#i-pause');
    syncVideos();
    window.dispatchEvent(new Event('brutta:motion'));
  }
  motionButton.addEventListener('click', () => {
    manualPause = !manualPause;
    setLocal(motionKey, manualPause ? 'paused' : null);
    updateMotion();
  });
  reduced.addEventListener('change', updateMotion);
  mobile.addEventListener('change', syncVideos);
  updateMotion();
})();
