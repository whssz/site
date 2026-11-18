(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const icon = (name) => {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    const use = document.createElementNS(ns, 'use');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  };
  const element = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };

  const nav = $('#menu-site');
  const menuToggle = $('#menu-toggle');
  const mobileNav = matchMedia('(max-width: 780px)');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    $('use', menuToggle).setAttribute('href', open ? '#i-close' : '#i-menu');
  };
  menuToggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('click', (event) => { if (!event.target.closest('#hdr')) setMenu(false); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  mobileNav.addEventListener('change', () => setMenu(false));

  if ('IntersectionObserver' in window) {
    const navigationLinks = $$('a[href^="#"]', nav);
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const link = navigationLinks.find(a => a.hash === `#${entry.target.id}`);
        if (entry.isIntersecting) {
          navigationLinks.forEach(a => a.removeAttribute('aria-current'));
          link?.setAttribute('aria-current', 'location');
        } else {
          link?.removeAttribute('aria-current');
        }
      }
    }, { rootMargin: '-23% 0px -65% 0px' });
    $$('main > section').forEach(section => observer.observe(section));
  }

  const cards = $$('[data-product]');
  const filters = $$('[data-filter]');
  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    let count = 0;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    cards.forEach(card => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
      if (!card.hidden) count++;
    });
    $('#catalog-count').textContent = `${count} ${count === 1 ? 'opção' : 'opções'}`;
  }));

  const openerByDialog = new WeakMap();
  function showDialog(dialog, opener) {
    if (dialog.open) return;
    openerByDialog.set(dialog, opener);
    setMenu(false);
    dialog.showModal();
  }
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target.closest('[data-dialog-close]')) dialog.close();
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      const opener = openerByDialog.get(dialog);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      openerByDialog.delete(dialog);
    });
  });
  $$('[data-legal]').forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    showDialog(document.getElementById(link.dataset.legal), link);
  }));

  const cart = $('#pedido');
  const form = $('#order-form');
  const items = $('#order-items');
  const empty = $('#pedido-vazio');
  const notes = $('#order-note');
  const consent = $('#order-consent');
  const error = $('#order-error');
  const message = $('#order-message');
  const copyStatus = $('#copy-status');
  const toast = $('#toast');
  const bagButton = $('[data-cart-open]');
  const quantityLimit = 9999; // Limite técnico do campo, não uma regra comercial.
  const catalog = new Map(orderData.products.map(product => [product.id, product]));
  const draftKey = 'sorvete-supremo:rascunho:v1';
  const lines = new Map();
  let mode = 'combinar';
  let toastTimer;
  let bumpTimer;
  const lineKey = (id, flavor) => JSON.stringify([id, flavor]);
  const validFlavor = (product, flavor) => product.options ? product.options.includes(flavor) : flavor === '';
  const itemCount = () => Array.from(lines.values()).reduce((sum, line) => sum + line.quantity, 0);
  const lineName = (p, flavor) => flavor ? `${p.orderName}, sabor ${flavor}` : p.orderName;

  try {
    const saved = JSON.parse(localStorage.getItem(draftKey) || 'null');
    if (saved && Array.isArray(saved.lines)) {
      mode = saved.mode === 'retirada' ? 'retirada' : 'combinar';
      saved.lines.forEach(({ id, flavor, quantity } = {}) => {
        const p = catalog.get(id);
        if (p && validFlavor(p, flavor) && Number.isInteger(quantity) && quantity > 0 && quantity <= quantityLimit) {
          lines.set(lineKey(id, flavor), { id, flavor, quantity });
        }
      });
    }
  } catch { /* Storage may be unavailable or tampered with; the current visit still works. */ }

  function persist() {
    try {
      if (lines.size) localStorage.setItem(draftKey, JSON.stringify({ lines: Array.from(lines.values()), mode }));
      else localStorage.removeItem(draftKey);
    } catch { /* No storage; retain in memory. */ }
  }
  function preparedMessage() {
    if (!lines.size) return '';
    const summary = Array.from(lines.values(), line => {
      const product = catalog.get(line.id);
      return `• ${line.quantity} × ${product.orderName}${line.flavor ? ` — sabor: ${line.flavor}` : ''}`;
    });
    const note = notes.value.trim();
    return ['Olá, Sorvete Supremo! Gostaria de consultar este pedido:', '', ...summary, '',
      `Atendimento: ${mode === 'retirada' ? 'Retirada na loja' : 'A combinar com a loja'}`,
      ...(note ? [`Observações: ${note}`] : []), '', 'Podem confirmar os valores e a disponibilidade?'].join('\n');
  }
  function clearValidation() {
    error.hidden = true;
    error.textContent = '';
    consent.removeAttribute('aria-invalid');
  }
  function updateMessage(resetConsent = false) {
    message.value = preparedMessage();
    copyStatus.textContent = '';
    if (resetConsent) {
      consent.checked = false;
      clearValidation();
    }
  }
  function announce(text) {
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.classList.remove('is-visible'); }, 2400);
  }

  function orderRow(key, line) {
    const product = catalog.get(line.id);
    const name = lineName(product, line.flavor);
    const row = element('li', 'order-line');
    row.dataset.lineKey = key;
    const heading = element('div', 'order-line-main');
    heading.append(element('span', `order-line-color tone-${product.tone}`), element('h4', '', product.orderName));
    row.append(heading);
    if (line.flavor) row.append(element('p', '', `Sabor da massa: ${line.flavor}`));
    const controls = element('div', 'order-line-controls');
    const quantity = element('div', 'quantity');
    function step(role, label, action, nameIcon) {
      const button = element('button');
      button.type = 'button';
      button.dataset.qtyRole = role;
      button.setAttribute('aria-label', `${label}: ${name}`);
      button.append(icon(nameIcon));
      button.addEventListener('click', () => updateQuantity(key, line.quantity + action, role));
      return button;
    }
    const less = step('minus', 'Diminuir quantidade', -1, 'minus');
    const more = step('plus', 'Aumentar quantidade', 1, 'plus');
    less.disabled = line.quantity <= 1;
    more.disabled = line.quantity >= quantityLimit;
    const input = element('input');
    input.type = 'number';
    input.inputMode = 'numeric';
    input.min = '1';
    input.max = String(quantityLimit);
    input.step = '1';
    input.value = String(line.quantity);
    input.dataset.qtyRole = 'input';
    input.setAttribute('aria-label', `Quantidade: ${name}`);
    input.addEventListener('change', () => {
      const value = input.valueAsNumber;
      if (!Number.isInteger(value) || value < 1 || value > quantityLimit) {
        input.value = String(line.quantity);
        const quantityError = element('p', '', `Digite uma quantidade inteira de 1 a ${quantityLimit}.`);
        quantityError.setAttribute('role', 'alert');
        row.querySelector('.quantity-feedback')?.remove();
        quantityError.className = 'quantity-feedback';
        row.append(quantityError);
        return;
      }
      if (line.quantity !== value) updateQuantity(key, value, document.activeElement === input ? 'input' : null);
    });
    input.addEventListener('input', () => row.querySelector('.quantity-feedback')?.remove());
    quantity.append(less, input, more);
    const remove = element('button', 'text-link', 'Remover');
    remove.type = 'button';
    remove.dataset.qtyRole = 'remove';
    remove.setAttribute('aria-label', `Remover ${name}`);
    remove.addEventListener('click', () => {
      const keys = Array.from(lines.keys());
      const rowIndex = keys.indexOf(key);
      lines.delete(key);
      commit();
      const remaining = $$('[data-line-key]', items);
      const next = remaining[Math.min(rowIndex, remaining.length - 1)];
      (next ? $('[data-qty-role="remove"]', next) : $('[data-order-browse]', cart)).focus({ preventScroll: true });
    });
    controls.append(quantity, remove);
    row.append(controls);
    return row;
  }

  function render() {
    const count = itemCount();
    const countText = `${count} ${count === 1 ? 'item' : 'itens'}`;
    $('[data-cart-count]', bagButton).textContent = String(count);
    bagButton.setAttribute('aria-label', `Meu pedido, ${count ? countText : 'vazio'}`);
    $('#order-count').textContent = countText;
    empty.hidden = count > 0;
    form.hidden = count === 0;
    if (!count) {
      mode = 'combinar';
      notes.value = '';
      $('#order-summary').open = false;
    }
    const modeRadio = $(`input[name="mode"][value="${mode}"]`, form);
    modeRadio.checked = true;
    items.replaceChildren(...Array.from(lines, ([key, line]) => orderRow(key, line)));
    const perProduct = new Map();
    lines.forEach(line => perProduct.set(line.id, (perProduct.get(line.id) || 0) + line.quantity));
    cards.forEach(card => {
      const added = perProduct.get(card.dataset.product) || 0;
      const label = $('[data-line-count]', card);
      label.textContent = `${added} no pedido`;
      label.hidden = !added;
    });
    updateMessage();
  }
  function commit() {
    persist();
    render();
    updateMessage(true);
  }
  function updateQuantity(key, value, focusRole) {
    const line = lines.get(key);
    if (!line || !Number.isInteger(value) || value < 1 || value > quantityLimit) return;
    line.quantity = value;
    commit();
    if (focusRole) {
      const row = Array.from(items.children).find(li => li.dataset.lineKey === key);
      const target = $(`[data-qty-role="${focusRole}"]`, row);
      (target.disabled ? $('[data-qty-role="input"]', row) : target).focus({ preventScroll: true });
    }
  }

  $('#produtos').addEventListener('click', event => {
    const button = event.target.closest('[data-add]');
    if (!button) return;
    const product = catalog.get(button.dataset.add);
    const card = button.closest('[data-product]');
    const select = $('select', card);
    const flavor = select?.value || '';
    if (!validFlavor(product, flavor)) {
      $('.option-error', card).hidden = false;
      select.setAttribute('aria-invalid', 'true');
      select.focus();
      return;
    }
    const key = lineKey(product.id, flavor);
    const line = lines.get(key) || { id: product.id, flavor, quantity: 0 };
    if (line.quantity === quantityLimit) {
      announce('A quantidade máxima do campo foi atingida.');
      return;
    }
    line.quantity++;
    lines.set(key, line);
    commit();
    button.dataset.added = 'true';
    $('use', button).setAttribute('href', '#i-check');
    setTimeout(() => { delete button.dataset.added; $('use', button).setAttribute('href', '#i-plus'); }, 650);
    if (!bagButton.classList.contains('is-bumped')) {
      bagButton.classList.add('is-bumped');
      clearTimeout(bumpTimer);
      bumpTimer = setTimeout(() => bagButton.classList.remove('is-bumped'), 410);
    }
    announce(`${product.orderName} adicionado ao pedido.`);
  });
  $$('select', $('#produtos')).forEach(select => select.addEventListener('change', () => {
    select.removeAttribute('aria-invalid');
    $('.option-error', select.closest('[data-product]')).hidden = true;
  }));
  bagButton.addEventListener('click', () => showDialog(cart, bagButton));
  $('[data-order-browse]', cart).addEventListener('click', () => {
    openerByDialog.delete(cart);
    cart.close();
    requestAnimationFrame(() => $('#catalog-title').focus({ preventScroll: true }));
  });
  $$('input[name="mode"]', form).forEach(input => input.addEventListener('change', () => {
    mode = input.value;
    persist();
    updateMessage(true);
  }));
  notes.addEventListener('input', () => updateMessage(true));
  consent.addEventListener('change', clearValidation);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!lines.size) return;
    if (!consent.checked) {
      error.textContent = 'Autorize a abertura do resumo para continuar pelo WhatsApp.';
      error.hidden = false;
      consent.setAttribute('aria-invalid', 'true');
      consent.focus();
      return;
    }
    clearValidation();
    const url = new URL(`https://wa.me/${orderData.whatsapp}`);
    url.searchParams.set('text', preparedMessage());
    const link = document.createElement('a');
    link.href = url.toString();
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  });
  $('#copy-order').addEventListener('click', async () => {
    const text = preparedMessage();
    if (!text) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      copyStatus.textContent = 'Resumo copiado.';
    } catch {
      $('#order-summary').open = true;
      message.focus();
      message.select();
      try {
        if (!document.execCommand('copy')) throw new Error('Copy unavailable');
        copyStatus.textContent = 'Resumo copiado.';
      } catch {
        copyStatus.textContent = 'Selecione e copie o texto da mensagem.';
      }
    }
  });
  render();

  const motion = $('#motion-toggle');
  const pageRoot = document.documentElement;
  const syncMotionButton = () => {
    const paused = pageRoot.classList.contains('motion-paused');
    motion.hidden = reduced.matches;
    $('span', motion).textContent = paused ? 'Retomar animações' : 'Pausar animações';
    $('use', motion).setAttribute('href', paused ? '#i-play' : '#i-pause');
  };
  motion.addEventListener('click', () => {
    pageRoot.classList.toggle('motion-paused');
    syncMotionButton();
    window.dispatchEvent(new Event('motionchange'));
  });
  reduced.addEventListener('change', syncMotionButton);
  syncMotionButton();

  // Only verified media added in the manifest reaches here. On small or reduced-motion
  // screens the poster stays in place; one visible muted clip can play at a time.
  const clips = $$('video[data-src]');
  if (clips.length && 'IntersectionObserver' in window) {
    const small = matchMedia('(max-width: 760px)');
    const visible = new Map();
    let playing = null;
    const choose = () => {
      const canPlay = !small.matches && !reduced.matches && !document.hidden && !pageRoot.classList.contains('motion-paused');
      const next = canPlay ? Array.from(visible).sort((a,b) => b[1] - a[1])[0]?.[0] : null;
      if (playing === next) return;
      if (playing) { playing.pause(); playing.hidden = true; }
      playing = next;
      if (!next) return;
      if (!next.src) next.src = next.dataset.src;
      next.muted = true;
      next.play().then(() => { if (playing === next) next.hidden = false; }).catch(() => { next.hidden = true; });
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const video = $('video', entry.target);
        if (entry.isIntersecting && entry.intersectionRatio >= .45) visible.set(video, entry.intersectionRatio);
        else visible.delete(video);
      }
      choose();
    }, { threshold: [.45, .65, .9] });
    clips.forEach(clip => observer.observe(clip.parentElement));
    small.addEventListener('change', choose);
    reduced.addEventListener('change', choose);
    window.addEventListener('motionchange', choose);
    document.addEventListener('visibilitychange', choose);
  }
})();
