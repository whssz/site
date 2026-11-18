/* ==========================================================================
   AMUNÌ A CAPARICA PIZZERIA — Aplicação Interativa de Cardápio, Pedido e Reserva
   100% dados reais verificados · Cálculo em cêntimos de EUR · RGPD/LGPD · WCAG AA
   ========================================================================== */
(function () {
  'use strict';

  var dataEl = document.getElementById('amuni-data');
  if (!dataEl) return;

  var DATA;
  try {
    DATA = JSON.parse(dataEl.textContent);
  } catch (err) {
    console.error('Falha ao ler dados do cardápio:', err);
    return;
  }

  var ASSETS = window.__AMUNI_ASSETS__ || {};
  document.querySelectorAll('img[data-asset-def]').forEach(function (img) {
    ASSETS[img.getAttribute('data-asset-def')] = img.getAttribute('src');
  });
  document.querySelectorAll('img[data-asset-src]').forEach(function (img) {
    var key = img.getAttribute('data-asset-src');
    if (ASSETS[key]) img.src = ASSETS[key];
  });
  var STORAGE_KEY = 'amuni_caparica_cart_v1';

  /* ---------- Utilitários ---------- */
  function toCents(eur) {
    return Math.round(Number(eur || 0) * 100);
  }

  function formatEUR(cents) {
    var val = (Math.round(cents) / 100).toFixed(2).replace('.', ',');
    return val + ' €';
  }

  function norm(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function svgUse(symbolId, width, height) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    if (width) svg.setAttribute('width', String(width));
    if (height) svg.setAttribute('height', String(height));
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#' + symbolId);
    svg.appendChild(use);
    return svg;
  }

  function assetSrc(filename) {
    return (filename && ASSETS[filename]) ? ASSETS[filename] : '';
  }

  var toastTimer = null;
  function showToast(msg) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2600);
  }

  /* ---------- Gestão acessível de <dialog> ---------- */
  var lastOpener = null;

  function openDialog(dialog, opener) {
    if (!dialog) return;
    lastOpener = opener || document.activeElement;
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    var closeBtn = dialog.querySelector('.dialog-close');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    if (lastOpener && typeof lastOpener.focus === 'function') {
      lastOpener.focus({ preventScroll: true });
      lastOpener = null;
    }
  }

  document.querySelectorAll('[data-close-dialog]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-close-dialog');
      closeDialog(document.getElementById(id));
    });
  });

  document.querySelectorAll('dialog').forEach(function (dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) closeDialog(dlg);
    });
  });

  /* ---------- Menu móvel ---------- */
  var navToggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menu de navegação');
      });
    });
  }

  /* ---------- Horário ao vivo (fuso de Lisboa / Costa da Caparica) ---------- */
  function getLisbonClock() {
    try {
      var now = new Date();
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Lisbon',
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(now);
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      var h = parseInt(map.hour, 10) % 24;
      var m = parseInt(map.minute, 10);
      return {
        dayIndex: dayMap[map.weekday] !== undefined ? dayMap[map.weekday] : now.getDay(),
        minutes: h * 60 + m,
        isoDate: map.year + '-' + map.month + '-' + map.day
      };
    } catch (_) {
      var d = new Date();
      return {
        dayIndex: d.getDay(),
        minutes: d.getHours() * 60 + d.getMinutes(),
        isoDate: d.toISOString().slice(0, 10)
      };
    }
  }

  function parseHM(hm) {
    if (!hm) return null;
    var sp = hm.split(':');
    return parseInt(sp[0], 10) * 60 + parseInt(sp[1], 10);
  }

  function renderScheduleAndStatus() {
    var clock = getLisbonClock();
    var schedule = DATA.brand.schedule || [];
    var todayEntry = null;

    var list = document.getElementById('hoursList');
    if (list) list.innerHTML = '';

    schedule.forEach(function (row) {
      var isToday = row.dayIndex === clock.dayIndex;
      if (isToday) todayEntry = row;
      if (!list) return;

      var li = el('li', isToday ? 'is-today' : '');
      var dayWrap = el('span', 'hours-day');
      dayWrap.appendChild(el('span', '', row.label + (isToday ? ' (hoje)' : '')));
      if (row.note) {
        dayWrap.appendChild(el('span', 'hours-tag', row.note));
      }
      var timeSpan = el('span', 'hours-time' + (!row.open ? ' closed' : ''), row.hours);
      li.appendChild(dayWrap);
      li.appendChild(timeSpan);
      list.appendChild(li);
    });

    var pill = document.getElementById('liveStatusPill');
    var txt = document.getElementById('liveStatusText');
    if (!pill || !txt || !todayEntry) return;

    if (!todayEntry.open) {
      pill.classList.add('is-closed');
      txt.textContent = 'Encerrado à segunda · Abre terça às 17:00 (Rodízio)';
      return;
    }

    var openM = parseHM(todayEntry.open);
    var closeM = parseHM(todayEntry.close);
    if (clock.minutes >= openM && clock.minutes < closeM) {
      pill.classList.remove('is-closed');
      var extra = todayEntry.note ? ' · Noite de Rodízio' : '';
      txt.textContent = 'Aberto agora na Caparica · até às ' + todayEntry.close + extra;
    } else if (clock.minutes < openM) {
      pill.classList.remove('is-closed');
      var noteTxt = todayEntry.note ? ' · ' + todayEntry.note : '';
      txt.textContent = 'Abre hoje às ' + todayEntry.open + ' (hora de Lisboa)' + noteTxt;
    } else {
      pill.classList.add('is-closed');
      txt.textContent = 'Cozinha encerrada hoje · Consulte horários e reserve';
    }
  }

  /* ---------- Estado do Carrinho ---------- */
  var cart = [];

  function loadCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cart = parsed.filter(function (entry) {
          return entry && typeof entry.itemId === 'string' && entry.qty > 0 && findItem(entry.itemId);
        });
      }
    } catch (_) {
      cart = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (_) {
      /* modo privado sem persistência: carrinho funciona na sessão */
    }
  }

  function findItem(id) {
    for (var i = 0; i < DATA.items.length; i++) {
      if (DATA.items[i].id === id) return DATA.items[i];
    }
    return null;
  }

  function findExtra(id) {
    for (var i = 0; i < DATA.extras.length; i++) {
      if (DATA.extras[i].id === id) return DATA.extras[i];
    }
    return null;
  }

  function normVariation(v, fallbackPrice) {
    if (typeof v === 'string') {
      return { id: v, label: v, price: fallbackPrice };
    }
    return {
      id: v.id || v.label,
      label: v.label || v.id,
      price: v.price !== undefined ? v.price : fallbackPrice
    };
  }

  function computeEntryUnitCents(entry) {
    var item = findItem(entry.itemId);
    if (!item) return 0;
    var base = toCents(item.price);
    if (entry.variationId && Array.isArray(item.variations)) {
      item.variations.forEach(function (raw) {
        var v = normVariation(raw, item.price);
        if (v.id === entry.variationId) base = toCents(v.price);
      });
    }
    var extraSum = 0;
    if (Array.isArray(entry.extraIds)) {
      entry.extraIds.forEach(function (eid) {
        var ex = findExtra(eid);
        if (ex) extraSum += toCents(ex.price);
      });
    }
    return base + extraSum;
  }

  function makeSignature(itemId, variationId, extraIds, note) {
    var sorted = (extraIds || []).slice().sort().join(',');
    return [itemId, variationId || '', sorted, (note || '').trim().toLowerCase()].join('|');
  }

  function addToCart(itemId, qty, variationId, extraIds, note) {
    var item = findItem(itemId);
    if (!item) return;
    var cleanNote = String(note || '').trim().slice(0, 160);
    var cleanExtras = (extraIds || []).slice().sort();
    var cleanQty = Math.max(1, Math.min(30, parseInt(qty, 10) || 1));
    var sig = makeSignature(itemId, variationId, cleanExtras, cleanNote);

    var found = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].sig === sig) { found = cart[i]; break; }
    }
    if (found) {
      found.qty = Math.min(30, found.qty + cleanQty);
    } else {
      cart.push({
        sig: sig,
        itemId: itemId,
        qty: cleanQty,
        variationId: variationId || null,
        extraIds: cleanExtras,
        note: cleanNote
      });
    }

    saveCart();
    updateCartUI(true);
    showToast(cleanQty + '× ' + item.name + ' adicionado ao pedido');
  }

  function getCartTotals() {
    var count = 0;
    var cents = 0;
    cart.forEach(function (entry) {
      count += entry.qty;
      cents += computeEntryUnitCents(entry) * entry.qty;
    });
    return { count: count, cents: cents };
  }

  function describeEntryMeta(item, entry) {
    var parts = [];
    if (entry.variationId && Array.isArray(item.variations)) {
      item.variations.forEach(function (raw) {
        var v = normVariation(raw, item.price);
        if (v.id === entry.variationId) parts.push('Opção: ' + v.label);
      });
    }
    if (entry.extraIds && entry.extraIds.length) {
      var names = entry.extraIds.map(function (eid) {
        var ex = findExtra(eid);
        return ex ? ex.name + ' (+' + formatEUR(toCents(ex.price)) + ')' : '';
      }).filter(Boolean);
      if (names.length) parts.push('Extras: ' + names.join(', '));
    }
    if (entry.note) {
      parts.push('Obs.: ' + entry.note);
    }
    return parts.join(' · ');
  }

  function updateCartUI(bump) {
    var totals = getCartTotals();
    var hdrCount = document.getElementById('hdrCartCount');
    var floatBtn = document.getElementById('floatingCartBtn');
    var floatCount = document.getElementById('floatCartCount');
    var floatTotal = document.getElementById('floatCartTotal');
    var trigger = document.getElementById('openCartBtn');

    if (hdrCount) hdrCount.textContent = String(totals.count);
    if (floatCount) floatCount.textContent = String(totals.count);
    if (floatTotal) floatTotal.textContent = formatEUR(totals.cents);
    if (floatBtn) floatBtn.hidden = totals.count === 0;

    if (bump && trigger) {
      trigger.classList.remove('bump');
      void trigger.offsetWidth;
      trigger.classList.add('bump');
    }

    var emptyEl = document.getElementById('cartEmpty');
    var filledEl = document.getElementById('cartFilled');
    var footEl = document.getElementById('cartFooter');
    var listEl = document.getElementById('cartList');
    var totalValEl = document.getElementById('cartTotalValue');

    if (!emptyEl || !filledEl || !footEl || !listEl) return;

    if (cart.length === 0) {
      emptyEl.hidden = false;
      filledEl.hidden = true;
      footEl.hidden = true;
      listEl.innerHTML = '';
      return;
    }

    emptyEl.hidden = true;
    filledEl.hidden = false;
    footEl.hidden = false;
    if (totalValEl) totalValEl.textContent = formatEUR(totals.cents);

    listEl.innerHTML = '';
    cart.forEach(function (entry, idx) {
      var item = findItem(entry.itemId);
      if (!item) return;
      var lineCents = computeEntryUnitCents(entry) * entry.qty;

      var li = el('li', 'cart-item');
      var top = el('div', 'cart-item-top');
      top.appendChild(el('h4', '', item.name));
      top.appendChild(el('span', 'cart-item-price', formatEUR(lineCents)));
      li.appendChild(top);

      var meta = describeEntryMeta(item, entry);
      if (meta) {
        li.appendChild(el('div', 'cart-item-meta', meta));
      } else {
        li.appendChild(el('div', 'cart-item-meta', formatEUR(computeEntryUnitCents(entry)) + ' cada'));
      }

      var ctrls = el('div', 'cart-item-controls');
      var qtyBox = el('div', 'qty-control');

      var minus = el('button', 'qty-btn', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Diminuir quantidade de ' + item.name);
      minus.addEventListener('click', function () {
        if (entry.qty > 1) {
          entry.qty -= 1;
        } else {
          cart.splice(idx, 1);
        }
        saveCart();
        updateCartUI(false);
      });

      var val = el('span', 'qty-val', String(entry.qty));

      var plus = el('button', 'qty-btn', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Aumentar quantidade de ' + item.name);
      plus.addEventListener('click', function () {
        entry.qty = Math.min(30, entry.qty + 1);
        saveCart();
        updateCartUI(false);
      });

      qtyBox.appendChild(minus);
      qtyBox.appendChild(val);
      qtyBox.appendChild(plus);

      var removeBtn = el('button', 'cart-remove', 'Remover');
      removeBtn.type = 'button';
      removeBtn.setAttribute('aria-label', 'Remover ' + item.name + ' do pedido');
      removeBtn.addEventListener('click', function () {
        cart.splice(idx, 1);
        saveCart();
        updateCartUI(false);
      });

      ctrls.appendChild(qtyBox);
      ctrls.appendChild(removeBtn);
      li.appendChild(ctrls);
      listEl.appendChild(li);
    });
  }

  /* ---------- Modal de Personalização ---------- */
  var itemModal = document.getElementById('itemModal');
  var activeModalItem = null;
  var modalQty = 1;

  function calcModalTotalCents() {
    if (!activeModalItem) return 0;
    var base = toCents(activeModalItem.price);
    var checkedVar = document.querySelector('#variationList input[name="itemVariation"]:checked');
    if (checkedVar && Array.isArray(activeModalItem.variations)) {
      activeModalItem.variations.forEach(function (raw) {
        var v = normVariation(raw, activeModalItem.price);
        if (v.id === checkedVar.value) base = toCents(v.price);
      });
    }
    var extraCents = 0;
    document.querySelectorAll('#extrasList input[type="checkbox"]:checked').forEach(function (cb) {
      var ex = findExtra(cb.value);
      if (ex) extraCents += toCents(ex.price);
    });
    return (base + extraCents) * modalQty;
  }

  function refreshModalPrice() {
    var qtyEl = document.getElementById('modalQtyVal');
    var totalEl = document.getElementById('modalTotalPrice');
    if (qtyEl) qtyEl.textContent = String(modalQty);
    if (totalEl) totalEl.textContent = formatEUR(calcModalTotalCents());
  }

  function openItemModal(item, opener) {
    activeModalItem = item;
    modalQty = 1;

    document.getElementById('itemModalTitle').textContent = item.name;
    document.getElementById('itemModalBasePrice').textContent = 'Valor base: ' + formatEUR(toCents(item.price));
    document.getElementById('itemModalIngredients').textContent = item.ingredients;
    document.getElementById('itemNoteInput').value = '';

    var varGroup = document.getElementById('variationGroup');
    var varTitle = document.getElementById('variationTitle');
    var varList = document.getElementById('variationList');
    varList.innerHTML = '';

    if (Array.isArray(item.variations) && item.variations.length) {
      varGroup.hidden = false;
      varTitle.textContent = item.variationLabel || 'Escolha a opção';
      item.variations.forEach(function (raw, idx) {
        var v = normVariation(raw, item.price);
        var row = el('label', 'opt-row');
        var left = el('span', 'opt-row-left');
        var radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'itemVariation';
        radio.value = v.id;
        if (idx === 0) radio.checked = true;
        radio.addEventListener('change', refreshModalPrice);
        left.appendChild(radio);
        left.appendChild(el('span', '', v.label));
        row.appendChild(left);
        row.appendChild(el('span', 'opt-price', formatEUR(toCents(v.price))));
        varList.appendChild(row);
      });
    } else {
      varGroup.hidden = true;
    }

    var extGroup = document.getElementById('extrasGroup');
    var extList = document.getElementById('extrasList');
    extList.innerHTML = '';

    if (item.allowExtras) {
      extGroup.hidden = false;
      DATA.extras.forEach(function (ex) {
        var row = el('label', 'opt-row');
        var left = el('span', 'opt-row-left');
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = ex.id;
        cb.addEventListener('change', refreshModalPrice);
        left.appendChild(cb);
        left.appendChild(el('span', '', ex.name));
        row.appendChild(left);
        row.appendChild(el('span', 'opt-price', '+' + formatEUR(toCents(ex.price))));
        extList.appendChild(row);
      });
    } else {
      extGroup.hidden = true;
    }

    refreshModalPrice();
    openDialog(itemModal, opener);
  }

  document.getElementById('modalQtyMinus').addEventListener('click', function () {
    if (modalQty > 1) { modalQty -= 1; refreshModalPrice(); }
  });
  document.getElementById('modalQtyPlus').addEventListener('click', function () {
    if (modalQty < 30) { modalQty += 1; refreshModalPrice(); }
  });
  document.getElementById('modalConfirmAdd').addEventListener('click', function () {
    if (!activeModalItem) return;
    var checkedVar = document.querySelector('#variationList input[name="itemVariation"]:checked');
    var varId = checkedVar ? checkedVar.value : null;
    var extraIds = [];
    document.querySelectorAll('#extrasList input[type="checkbox"]:checked').forEach(function (cb) {
      extraIds.push(cb.value);
    });
    var note = document.getElementById('itemNoteInput').value;
    var itemToAdd = activeModalItem;
    closeDialog(itemModal);
    addToCart(itemToAdd.id, modalQty, varId, extraIds, note);
  });

  /* ---------- Renderização: Pizzas Mais Pedidas ---------- */
  function renderPopular() {
    var grid = document.getElementById('popularGrid');
    if (!grid) return;
    var popular = DATA.items
      .filter(function (it) { return typeof it.popularRank === 'number'; })
      .sort(function (a, b) { return a.popularRank - b.popularRank; });

    grid.innerHTML = '';
    popular.forEach(function (item) {
      var card = el('article', 'card rev');
      var media = el('div', 'card-shot');

      if (item.badge) {
        media.appendChild(el('span', 'card-tag', item.badge));
      }

      var src = assetSrc(item.photo);
      if (src) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = item.photoAlt || ('Pizza ' + item.name + ' da Amunì a Caparica');
        if (item.width) img.width = item.width;
        if (item.height) img.height = item.height;
        img.loading = 'lazy';
        img.decoding = 'async';
        media.appendChild(img);
      } else {
        var emblem = el('div', 'card-emblem');
        emblem.setAttribute('aria-hidden', 'true');
        emblem.appendChild(svgUse('sym-pizza-slice', 52, 52));
        emblem.appendChild(el('span', '', item.category === 'pistachio' ? 'Base de Pistáchio · Amunì' : 'Receita Oficial · Amunì'));
        media.appendChild(emblem);
      }

      var body = el('div', 'card-body');
      var top = el('div', 'card-top');
      top.appendChild(el('h3', '', item.name));
      top.appendChild(el('span', 'price-tag', formatEUR(toCents(item.price))));
      body.appendChild(top);
      body.appendChild(el('p', 'card-desc', item.ingredients));

      var actions = el('div', 'card-actions');
      var addBtn = el('button', 'btn btn-primary btn-sm', 'Adicionar');
      addBtn.type = 'button';
      addBtn.setAttribute('aria-label', 'Adicionar ' + item.name + ' ao pedido');
      addBtn.addEventListener('click', function () {
        addToCart(item.id, 1, null, [], '');
      });

      var custBtn = el('button', 'btn btn-outline btn-sm', 'Personalizar');
      custBtn.type = 'button';
      custBtn.setAttribute('aria-label', 'Personalizar ' + item.name + ' com extras ou observações');
      custBtn.addEventListener('click', function () {
        openItemModal(item, custBtn);
      });

      actions.appendChild(addBtn);
      actions.appendChild(custBtn);
      body.appendChild(actions);

      card.appendChild(media);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  /* ---------- Renderização: Cardápio Completo com Filtros ---------- */
  var activeCategory = 'todas';
  var activeDiets = {};
  var searchQuery = '';

  function itemMatchesFilters(item) {
    if (activeCategory !== 'todas' && item.category !== activeCategory) return false;
    var tags = item.tags || [];
    var requiredDiets = Object.keys(activeDiets).filter(function (k) { return activeDiets[k]; });
    for (var i = 0; i < requiredDiets.length; i++) {
      var d = requiredDiets[i];
      if (d === 'vegetariana') {
        if (tags.indexOf('vegetariana') === -1 && tags.indexOf('vegana') === -1) return false;
      } else if (tags.indexOf(d) === -1) {
        return false;
      }
    }
    if (searchQuery) {
      var hay = norm(item.name + ' ' + item.ingredients + ' ' + (item.badge || ''));
      if (hay.indexOf(searchQuery) === -1) return false;
    }
    return true;
  }

  function renderCategoryTabs() {
    var wrap = document.getElementById('catTabs');
    if (!wrap) return;
    wrap.innerHTML = '';

    DATA.categories.forEach(function (cat) {
      var count = cat.id === 'todas'
        ? DATA.items.length
        : DATA.items.filter(function (it) { return it.category === cat.id; }).length;

      var btn = el('button', 'cat-tab', cat.label + ' (' + count + ')');
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', cat.id === activeCategory ? 'true' : 'false');
      btn.dataset.cat = cat.id;
      btn.addEventListener('click', function () {
        activeCategory = cat.id;
        renderCategoryTabs();
        renderMenu();
      });
      wrap.appendChild(btn);
    });
  }

  var TAG_LABELS = {
    vegana: { text: 'Vegana Bio', cls: 'tag-olive' },
    vegetariana: { text: 'Vegetariana', cls: 'tag-olive' },
    pistachio: { text: 'Pistáchio', cls: 'tag-olive' },
    picante: { text: 'Levemente picante', cls: 'tag-terra' }
  };

  function renderMenu() {
    var container = document.getElementById('menuContainer');
    if (!container) return;
    container.innerHTML = '';

    var totalShown = 0;
    var cats = DATA.categories.filter(function (c) {
      return c.id !== 'todas' && (activeCategory === 'todas' || c.id === activeCategory);
    });

    cats.forEach(function (cat) {
      var items = DATA.items.filter(function (it) {
        return it.category === cat.id && itemMatchesFilters(it);
      });
      if (!items.length) return;
      totalShown += items.length;

      var group = el('div', 'menu-group');
      var head = el('div', 'menu-group-head');
      head.dataset.cat = cat.id;
      head.appendChild(el('h3', '', cat.label));
      head.appendChild(el('p', '', cat.subtitle));
      group.appendChild(head);

      var grid = el('div', 'menu-grid');
      items.forEach(function (item) {
        var src = assetSrc(item.photo);
        var card = el('article', 'menu-item' + (src ? '' : ' no-thumb'));

        if (src) {
          var thumb = el('div', 'menu-thumb');
          var img = document.createElement('img');
          img.src = src;
          img.alt = item.photoAlt || (item.name + ' — Amunì a Caparica');
          if (item.photoFit === 'contain') img.className = 'fit-contain';
          if (item.width) img.width = item.width;
          if (item.height) img.height = item.height;
          img.loading = 'lazy';
          img.decoding = 'async';
          thumb.appendChild(img);
          card.appendChild(thumb);
        }

        var info = el('div', 'menu-info');
        var titleRow = el('div', 'menu-title-row');
        titleRow.appendChild(el('h4', '', item.name));

        var hasPriceSpread = Array.isArray(item.variations) && item.variations.some(function (raw) {
          return toCents(normVariation(raw, item.price).price) !== toCents(item.price);
        });
        var priceLabel = (hasPriceSpread ? 'desde ' : '') + formatEUR(toCents(item.price));
        titleRow.appendChild(el('span', 'menu-price', priceLabel));
        info.appendChild(titleRow);

        var badges = [];
        if (item.badge) badges.push({ text: item.badge, cls: 'tag-terra' });
        (item.tags || []).forEach(function (t) {
          if (t === 'vegetariana' && (item.tags || []).indexOf('vegana') !== -1) return;
          if (TAG_LABELS[t]) badges.push(TAG_LABELS[t]);
        });
        if (badges.length) {
          var badgeRow = el('div', 'menu-badges');
          badges.forEach(function (b) {
            badgeRow.appendChild(el('span', 'tag-pill ' + b.cls, b.text));
          });
          info.appendChild(badgeRow);
        }

        info.appendChild(el('p', 'menu-ing', item.ingredients));

        var foot = el('div', 'menu-foot');
        var hasVariations = Array.isArray(item.variations) && item.variations.length > 0;

        if (hasVariations) {
          var chooseBtn = el('button', 'btn-add-quick', 'Escolher opção');
          chooseBtn.type = 'button';
          chooseBtn.setAttribute('aria-label', 'Escolher opção de ' + item.name);
          chooseBtn.addEventListener('click', function () {
            openItemModal(item, chooseBtn);
          });
          foot.appendChild(chooseBtn);
        } else {
          var quickBtn = el('button', 'btn-add-quick', '+ Adicionar');
          quickBtn.type = 'button';
          quickBtn.setAttribute('aria-label', 'Adicionar ' + item.name + ' ao pedido');
          quickBtn.addEventListener('click', function () {
            addToCart(item.id, 1, null, [], '');
          });
          foot.appendChild(quickBtn);

          var optLabel = item.allowExtras ? 'Personalizar' : 'Observação';
          var optBtn = el('button', 'btn-customize', optLabel);
          optBtn.type = 'button';
          optBtn.setAttribute('aria-label', optLabel + ' para ' + item.name);
          optBtn.addEventListener('click', function () {
            openItemModal(item, optBtn);
          });
          foot.appendChild(optBtn);
        }

        info.appendChild(foot);
        card.appendChild(info);
        grid.appendChild(card);
      });

      group.appendChild(grid);
      container.appendChild(group);
    });

    if (totalShown === 0) {
      var empty = el('div', 'menu-empty');
      empty.appendChild(el('p', '', 'Nenhum item corresponde aos filtros selecionados.'));
      var resetBtn = el('button', 'btn btn-outline btn-sm', 'Limpar filtros');
      resetBtn.type = 'button';
      resetBtn.addEventListener('click', function () {
        activeCategory = 'todas';
        activeDiets = {};
        searchQuery = '';
        var s = document.getElementById('menuSearch');
        if (s) s.value = '';
        document.querySelectorAll('.diet-chip').forEach(function (c) {
          c.setAttribute('aria-pressed', 'false');
        });
        renderCategoryTabs();
        renderMenu();
      });
      empty.appendChild(resetBtn);
      container.appendChild(empty);
    }
  }

  function renderExtrasStrip() {
    var wrap = document.getElementById('extrasStrip');
    if (!wrap) return;
    wrap.innerHTML = '';
    DATA.extras.forEach(function (ex) {
      var pill = el('span', 'extra-pill', ex.name + ' ');
      pill.appendChild(el('strong', '', '+' + formatEUR(toCents(ex.price))));
      wrap.appendChild(pill);
    });
  }

  document.querySelectorAll('.diet-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var key = chip.dataset.diet;
      activeDiets[key] = !activeDiets[key];
      chip.setAttribute('aria-pressed', activeDiets[key] ? 'true' : 'false');
      renderMenu();
    });
  });

  var searchInput = document.getElementById('menuSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      searchQuery = norm(searchInput.value.trim());
      renderMenu();
    });
  }

  /* ---------- Finalização de Pedido (WhatsApp + Copiar) ---------- */
  var cartDrawer = document.getElementById('cartDrawer');
  ['openCartBtn', 'floatingCartBtn', 'ctaOpenCartBtn'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) {
      b.addEventListener('click', function () {
        document.getElementById('cartFeedback').textContent = '';
        document.getElementById('cartFeedback').className = 'form-feedback';
        openDialog(cartDrawer, b);
      });
    }
  });

  var browseBtn = document.getElementById('cartBrowseMenuBtn');
  if (browseBtn) {
    browseBtn.addEventListener('click', function () {
      closeDialog(cartDrawer);
      var sec = document.getElementById('cardapio');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function getFulfillment() {
    var checked = document.querySelector('input[name="fulfillment"]:checked');
    return checked ? checked.value : 'recolha';
  }

  document.querySelectorAll('input[name="fulfillment"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      var isDelivery = getFulfillment() === 'entrega';
      var addrWrap = document.getElementById('deliveryAddressWrap');
      var hint = document.getElementById('fulfillHint');
      if (addrWrap) addrWrap.hidden = !isDelivery;
      if (hint) {
        hint.textContent = isDelivery
          ? 'Informe a morada para confirmarmos cobertura e eventual taxa no WhatsApp.'
          : 'Recolha em Apoio 6, Praia Norte, Rua Muralha da Praia, Costa de Caparica.';
      }
    });
  });

  function setFeedback(elId, type, text, fallbackUrl) {
    var box = document.getElementById(elId);
    if (!box) return;
    box.className = 'form-feedback ' + (type === 'error' ? 'is-error' : 'is-ok');
    box.textContent = text;
    if (fallbackUrl) {
      box.appendChild(document.createTextNode(' '));
      var a = el('a', 'inline-link', 'Abrir WhatsApp diretamente');
      a.href = fallbackUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      box.appendChild(a);
    }
  }

  function buildOrderMessage() {
    var totals = getCartTotals();
    var mode = getFulfillment();
    var name = document.getElementById('cartCustomerName').value.trim();
    var addr = document.getElementById('cartAddress').value.trim();
    var note = document.getElementById('cartGeneralNote').value.trim();

    var lines = [
      'Olá, Amunì a Caparica! Gostaria de fazer um pedido:',
      '',
      'Cliente: ' + name,
      'Modalidade: ' + (mode === 'entrega' ? 'Consulta de entrega na morada' : 'Recolha no local (Apoio 6, Praia Norte)')
    ];
    if (mode === 'entrega' && addr) {
      lines.push('Morada: ' + addr);
    }
    lines.push('', 'ITENS SELECIONADOS:');

    cart.forEach(function (entry) {
      var item = findItem(entry.itemId);
      if (!item) return;
      var lineCents = computeEntryUnitCents(entry) * entry.qty;
      var title = '- ' + entry.qty + 'x ' + item.name;
      if (entry.variationId && Array.isArray(item.variations)) {
        item.variations.forEach(function (raw) {
          var v = normVariation(raw, item.price);
          if (v.id === entry.variationId) title += ' (' + v.label + ')';
        });
      }
      title += ' — ' + formatEUR(lineCents);
      lines.push(title);

      if (entry.extraIds && entry.extraIds.length) {
        var exNames = entry.extraIds.map(function (eid) {
          var ex = findExtra(eid);
          return ex ? ex.name + ' (+' + formatEUR(toCents(ex.price)) + ')' : '';
        }).filter(Boolean);
        if (exNames.length) lines.push('   Extras: ' + exNames.join(', '));
      }
      if (entry.note) {
        lines.push('   Obs.: ' + entry.note);
      }
    });

    lines.push('');
    lines.push('Total estimado (itens do menu): ' + formatEUR(totals.cents));
    if (mode === 'entrega') {
      lines.push('(Aguardando confirmação de disponibilidade e taxa de entrega)');
    }
    if (note) {
      lines.push('Observações gerais: ' + note);
    }
    lines.push('', 'Podem confirmar disponibilidade e tempo de preparação, por favor?');
    return lines.join('\n');
  }

  function validateCartCheckout(requireConsent) {
    if (!cart.length) {
      setFeedback('cartFeedback', 'error', 'Adicione pelo menos um item do cardápio antes de finalizar.');
      return false;
    }
    var mode = getFulfillment();
    var addr = document.getElementById('cartAddress');
    if (mode === 'entrega' && !addr.value.trim()) {
      setFeedback('cartFeedback', 'error', 'Por favor, indique a morada para consulta de entrega.');
      addr.focus();
      return false;
    }
    var nameInput = document.getElementById('cartCustomerName');
    if (!nameInput.value.trim()) {
      setFeedback('cartFeedback', 'error', 'Por favor, informe o seu nome para identificar o pedido.');
      nameInput.focus();
      return false;
    }
    var consent = document.getElementById('cartConsent');
    if (requireConsent && !consent.checked) {
      setFeedback('cartFeedback', 'error', 'Marque a concordância com a Política de Privacidade para encaminhar o pedido.');
      consent.focus();
      return false;
    }
    return true;
  }

  function copyText(text, onOk, onFail) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onOk).catch(onFail);
    } else {
      onFail();
    }
  }

  document.getElementById('sendWhatsAppOrderBtn').addEventListener('click', function () {
    if (!validateCartCheckout(true)) return;
    var msg = buildOrderMessage();
    var url = DATA.brand.whatsappBase + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank', 'noopener,noreferrer');
    setFeedback(
      'cartFeedback',
      'ok',
      'Mensagem do pedido preparada! Envie no WhatsApp e aguarde a resposta da equipa da Amunì para confirmação.',
      url
    );
  });

  document.getElementById('copyOrderBtn').addEventListener('click', function () {
    if (!validateCartCheckout(true)) return;
    var msg = buildOrderMessage();
    var url = DATA.brand.whatsappBase + '?text=' + encodeURIComponent(msg);
    copyText(msg, function () {
      setFeedback('cartFeedback', 'ok', 'Resumo copiado para a área de transferência! Cole no WhatsApp oficial (+351 913 225 786).', url);
    }, function () {
      setFeedback('cartFeedback', 'ok', 'Não foi possível copiar automaticamente — utilize o link direto:', url);
    });
  });

  /* ---------- Configurador de Reserva / Rodízio ---------- */
  var bookMode = 'rodizio';
  var bookDateInput = document.getElementById('bookDate');
  var bookTimeSelect = document.getElementById('bookTime');
  var bookGuestsInput = document.getElementById('bookGuests');
  var bookDateHint = document.getElementById('bookDateHint');
  var bookGuestsHint = document.getElementById('bookGuestsHint');
  var rodizioSummary = document.getElementById('rodizioSummary');

  function dateDayOfWeek(iso) {
    if (!iso) return -1;
    var p = iso.split('-');
    if (p.length !== 3) return -1;
    var d = new Date(Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 12, 0, 0));
    return d.getUTCDay();
  }

  function formatDatePT(iso) {
    var p = iso.split('-');
    return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : iso;
  }

  function nextMatchingDate(startIso, allowedDays) {
    var p = startIso.split('-').map(Number);
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2], 12, 0, 0));
    for (var i = 0; i < 14; i++) {
      if (allowedDays.indexOf(d.getUTCDay()) !== -1) {
        return d.toISOString().slice(0, 10);
      }
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return startIso;
  }

  function refreshTimeSlots() {
    if (!bookTimeSelect || !bookDateInput) return;
    var dow = dateDayOfWeek(bookDateInput.value);
    var prev = bookTimeSelect.value || '19:30';
    var slots = [];

    if (bookMode === 'mesa' && (dow === 0 || dow === 6)) {
      slots = ['13:00', '13:30', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
    } else if (bookMode === 'mesa' && (dow === 5 || dow === 6)) {
      slots = ['17:00', '18:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
    } else {
      slots = ['17:00', '18:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
    }

    bookTimeSelect.innerHTML = '';
    slots.forEach(function (t) {
      var opt = el('option', '', t);
      opt.value = t;
      if (t === prev) opt.selected = true;
      bookTimeSelect.appendChild(opt);
    });
    if (!bookTimeSelect.value && slots.indexOf('19:30') !== -1) {
      bookTimeSelect.value = '19:30';
    }
  }

  function updateBookingSummary() {
    var guests = Math.max(1, parseInt(bookGuestsInput.value, 10) || 1);
    if (bookMode === 'rodizio') {
      rodizioSummary.hidden = false;
      var eff = Math.max(4, guests);
      var total = formatEUR(eff * 1800);
      rodizioSummary.textContent = '';
      rodizioSummary.appendChild(document.createTextNode('Estimativa do Pizza Rodízio para '));
      rodizioSummary.appendChild(el('strong', '', eff + ' pessoas'));
      rodizioSummary.appendChild(document.createTextNode(': '));
      rodizioSummary.appendChild(el('strong', '', total));
      rodizioSummary.appendChild(document.createTextNode(' (18,00 €/pessoa · bebidas não incluídas).'));
    } else {
      rodizioSummary.hidden = true;
    }
  }

  function initBookingForm() {
    if (!bookDateInput) return;
    var clock = getLisbonClock();
    bookDateInput.min = clock.isoDate;
    bookDateInput.value = nextMatchingDate(clock.isoDate, [2, 4]);
    refreshTimeSlots();
    updateBookingSummary();

    document.querySelectorAll('[data-book-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        bookMode = btn.getAttribute('data-book-mode');
        document.querySelectorAll('[data-book-mode]').forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        if (bookMode === 'rodizio') {
          bookGuestsInput.min = '4';
          if ((parseInt(bookGuestsInput.value, 10) || 0) < 4) bookGuestsInput.value = '4';
          bookGuestsHint.textContent = 'Mínimo de 4 pessoas no Rodízio.';
          bookDateHint.textContent = 'Para Rodízio, escolha terça ou quinta-feira.';
          var dow = dateDayOfWeek(bookDateInput.value);
          if (dow !== 2 && dow !== 4) {
            bookDateInput.value = nextMatchingDate(clock.isoDate, [2, 4]);
          }
        } else {
          bookGuestsInput.min = '1';
          bookGuestsHint.textContent = 'De 1 a 30 pessoas (grupos maiores sob consulta).';
          bookDateHint.textContent = 'Aberto de terça a domingo (encerrado à segunda-feira).';
          if (dateDayOfWeek(bookDateInput.value) === 1) {
            bookDateInput.value = nextMatchingDate(clock.isoDate, [0, 2, 3, 4, 5, 6]);
          }
        }
        document.getElementById('bookingFeedback').textContent = '';
        document.getElementById('bookingFeedback').className = 'form-feedback';
        refreshTimeSlots();
        updateBookingSummary();
      });
    });

    bookDateInput.addEventListener('change', refreshTimeSlots);
    bookGuestsInput.addEventListener('input', updateBookingSummary);
  }

  function validateBooking() {
    var iso = bookDateInput.value;
    if (!iso) {
      setFeedback('bookingFeedback', 'error', 'Escolha a data pretendida para a reserva.');
      bookDateInput.focus();
      return false;
    }
    var dow = dateDayOfWeek(iso);
    if (dow === 1) {
      setFeedback('bookingFeedback', 'error', 'A Amunì a Caparica encerra às segundas-feiras. Escolha um dia entre terça e domingo.');
      bookDateInput.focus();
      return false;
    }
    if (bookMode === 'rodizio' && dow !== 2 && dow !== 4) {
      setFeedback('bookingFeedback', 'error', 'O Pizza Rodízio realiza-se às terças e quintas-feiras. Ajuste a data ou mude para «Mesa à la carte».');
      bookDateInput.focus();
      return false;
    }
    var guests = parseInt(bookGuestsInput.value, 10) || 0;
    if (bookMode === 'rodizio' && guests < 4) {
      setFeedback('bookingFeedback', 'error', 'O Pizza Rodízio requer um mínimo de 4 pessoas.');
      bookGuestsInput.focus();
      return false;
    }
    if (guests < 1) {
      setFeedback('bookingFeedback', 'error', 'Indique o número de pessoas.');
      bookGuestsInput.focus();
      return false;
    }
    var nameInput = document.getElementById('bookName');
    if (!nameInput.value.trim()) {
      setFeedback('bookingFeedback', 'error', 'Por favor, informe o seu nome para a reserva.');
      nameInput.focus();
      return false;
    }
    var consent = document.getElementById('bookConsent');
    if (!consent.checked) {
      setFeedback('bookingFeedback', 'error', 'Marque a concordância com a Política de Privacidade para enviar a solicitação.');
      consent.focus();
      return false;
    }
    return true;
  }

  function buildBookingMessage() {
    var iso = bookDateInput.value;
    var dowNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    var dow = dateDayOfWeek(iso);
    var guests = parseInt(bookGuestsInput.value, 10) || 1;
    var name = document.getElementById('bookName').value.trim();
    var notes = document.getElementById('bookNotes').value.trim();

    var lines = [
      'Olá, Amunì a Caparica! Gostaria de solicitar uma reserva:',
      '',
      'Modalidade: ' + (bookMode === 'rodizio' ? 'Pizza Rodízio (Terça/Quinta · 18,00 €/pessoa, bebidas à parte)' : 'Mesa à la carte'),
      'Nome: ' + name,
      'Data: ' + formatDatePT(iso) + (dow >= 0 ? ' (' + dowNames[dow] + ')' : ''),
      'Horário pretendido: ' + bookTimeSelect.value,
      'Pessoas: ' + guests
    ];
    if (bookMode === 'rodizio') {
      lines.push('Valor estimado do Rodízio: ' + formatEUR(guests * 1800) + ' (sem bebidas)');
    }
    if (notes) {
      lines.push('Observações: ' + notes);
    }
    lines.push('', 'Podem confirmar a disponibilidade de mesa, por favor?');
    return lines.join('\n');
  }

  var bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateBooking()) return;
      var msg = buildBookingMessage();
      var url = DATA.brand.whatsappBase + '?text=' + encodeURIComponent(msg);
      window.open(url, '_blank', 'noopener,noreferrer');
      setFeedback(
        'bookingFeedback',
        'ok',
        'Solicitação preparada! Conclua o envio no WhatsApp e aguarde a confirmação de disponibilidade pela equipa da Amunì.',
        url
      );
    });
  }

  var copyBookBtn = document.getElementById('copyBookingBtn');
  if (copyBookBtn) {
    copyBookBtn.addEventListener('click', function () {
      if (!validateBooking()) return;
      var msg = buildBookingMessage();
      var url = DATA.brand.whatsappBase + '?text=' + encodeURIComponent(msg);
      copyText(msg, function () {
        setFeedback('bookingFeedback', 'ok', 'Resumo da reserva copiado! Envie pelo WhatsApp oficial (+351 913 225 786).', url);
      }, function () {
        setFeedback('bookingFeedback', 'ok', 'Utilize o link direto para encaminhar a reserva:', url);
      });
    });
  }

  /* ---------- Galeria Real + Lightbox ---------- */
  function renderGallery() {
    var grid = document.getElementById('galleryGrid');
    var lb = document.getElementById('lightboxDialog');
    if (!grid) return;
    grid.innerHTML = '';

    (DATA.gallery || []).forEach(function (g) {
      var src = assetSrc(g.file);
      if (!src) return;

      var btn = el('button', 'gallery-card rev' + (g.wide ? ' wide' : ''));
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Ampliar fotografia: ' + g.title);

      var img = document.createElement('img');
      img.src = src;
      img.alt = g.alt;
      img.width = g.width;
      img.height = g.height;
      img.loading = 'lazy';
      img.decoding = 'async';

      var overlay = el('span', 'gallery-overlay');
      overlay.appendChild(el('strong', '', g.title));
      overlay.appendChild(el('span', '', g.source));

      btn.appendChild(img);
      btn.appendChild(overlay);

      btn.addEventListener('click', function () {
        document.getElementById('lightboxImg').src = src;
        document.getElementById('lightboxImg').alt = g.alt;
        document.getElementById('lightboxTitle').textContent = g.title;
        document.getElementById('lightboxCaption').textContent = g.caption;
        document.getElementById('lightboxSource').textContent = 'Origem: ' + g.source;
        openDialog(lb, btn);
      });

      grid.appendChild(btn);
    });
  }

  /* ---------- Avaliações Reais do Google Maps ---------- */
  function renderReviews() {
    var topicsWrap = document.getElementById('reviewTopics');
    if (topicsWrap) {
      topicsWrap.innerHTML = '';
      (DATA.reviewTopics || []).forEach(function (t) {
        topicsWrap.appendChild(el('span', 'topic-badge', t));
      });
    }

    var grid = document.getElementById('reviewsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    (DATA.reviews || []).forEach(function (r) {
      var bq = el('blockquote', 'quote');
      var mark = el('span', 'quote-mark', '“');
      mark.setAttribute('aria-hidden', 'true');
      bq.appendChild(mark);
      bq.appendChild(el('p', '', r.quote));

      var author = el('footer', 'quote-author');
      var av = el('span', 'quote-avatar', r.initial);
      av.setAttribute('aria-hidden', 'true');
      var metaBox = el('div', '');
      metaBox.appendChild(el('strong', '', r.author));
      metaBox.appendChild(el('span', '', r.meta + ' · ' + r.note));
      author.appendChild(av);
      author.appendChild(metaBox);
      bq.appendChild(author);

      grid.appendChild(bq);
    });
  }

  /* ---------- Política de Privacidade & Termos de Uso (RGPD / LGPD) ---------- */
  var LEGAL_DOCS = {
    privacidade: {
      title: 'Política de Privacidade (RGPD & LGPD)',
      sections: [
        {
          h: '1. Responsável pelo atendimento e identificação',
          p: 'Este website apresenta o cardápio, horários e canais oficiais da Amunì a Caparica Pizzeria, localizada em Apoio 6, Praia Norte, Rua Muralha da Praia, 2825-391 Costa de Caparica, Almada, Portugal. Contacto oficial de atendimento e privacidade: +351 913 225 786 (telefone e WhatsApp).'
        },
        {
          h: '2. Dados tratados e finalidade estrita',
          p: 'Recolhemos apenas os dados estritamente necessários que o utilizador decide preencher para montar um pedido ou solicitar reserva: nome, itens e observações escolhidos, data/horário/número de pessoas (em reservas) e morada (apenas quando solicita consulta de entrega). Esses dados não são armazenados em servidores próprios deste site: servem unicamente para compor a mensagem encaminhada, mediante o seu consentimento expresso, ao WhatsApp oficial da pizzaria.'
        },
        {
          h: '3. Armazenamento local e ausência de rastreadores',
          p: 'Este website não utiliza cookies publicitários, pixels de remarketing nem ferramentas de análise de terceiros, razão pela qual não exibe banner de cookies desnecessário. Utilizamos apenas o armazenamento local técnico do seu navegador (localStorage) para preservar temporariamente os itens do carrinho na sua visita, sem guardar nome, morada ou contactos.'
        },
        {
          h: '4. Serviços externos acionados por si',
          p: 'Ao clicar para enviar mensagem no WhatsApp (Meta Platforms), reservar em amuni.pizza/pt/booking, pedir via Uber Eats, abrir o Google Maps ou visitar Instagram/TikTok, o utilizador é direcionado para plataformas externas regidas pelas respetivas políticas de privacidade.'
        },
        {
          h: '5. Base legal e direitos do titular (RGPD e LGPD)',
          p: 'Nos termos do Regulamento Geral sobre a Proteção de Dados (UE 2016/679 e Lei portuguesa n.º 58/2019) e, quando aplicável a titulares no Brasil, da Lei Geral de Proteção de Dados (Lei n.º 13.709/2018), o tratamento baseia-se no consentimento do titular e em diligências pré-contratuais a pedido deste. Pode solicitar confirmação, acesso, retificação, apagamento, portabilidade ou retirada do consentimento diretamente pelo contacto +351 913 225 786, assistindo-lhe ainda o direito de reclamar junto da CNPD (Portugal) ou da ANPD (Brasil).'
        },
        {
          h: '6. Atualização',
          p: 'Última atualização desta Política de Privacidade: novembro de 2026.'
        }
      ]
    },
    termos: {
      title: 'Termos de Uso e Condições de Pedido',
      sections: [
        {
          h: '1. Objeto do website',
          p: 'Este site disponibiliza informação institucional, consulta do cardápio oficial da Amunì a Caparica Pizzeria, montagem assistida de pedidos para envio via WhatsApp e encaminhamento de solicitações de reserva.'
        },
        {
          h: '2. Cardápio, preços e alergénios',
          p: 'Os produtos, ingredientes, extras e valores em euros (€) seguem o menu oficial publicado pela Amunì a Caparica. A disponibilidade diária de ingredientes e bebidas está sujeita à confirmação no momento do pedido. Caso possua alergias ou intolerâncias alimentares (incluindo doença celíaca ao optar por massa sem glúten, preparada em cozinha que manipula farinha de trigo, frutos de casca rija como pistáchio e caju, leite, peixe e sésamo), informe obrigatoriamente a equipa antes da confirmação.'
        },
        {
          h: '3. Confirmação de pedidos e entregas',
          p: 'A abertura do WhatsApp com o resumo do pedido não constitui confirmação automática de compra nem pagamento online. O pedido considera-se aceite apenas após resposta expressa da equipa da Amunì, que informará o tempo estimado de preparação e, no caso de consulta de entrega, a cobertura geográfica e eventual taxa aplicável. Em alternativa, as entregas podem ser efetuadas diretamente na loja oficial da Amunì no Uber Eats.'
        },
        {
          h: '4. Condições do Pizza Rodízio e reservas',
          p: 'O Pizza Rodízio (All You Can Eat) realiza-se às terças e quintas-feiras no horário de jantar, pelo valor de 18,00 € por pessoa, com bebidas não incluídas e mínimo obrigatório de 4 pessoas, salvo alteração comunicada oficialmente pela casa. As solicitações de reserva ficam confirmadas após validação pela equipa ou pela plataforma oficial amuni.pizza/pt/booking.'
        },
        {
          h: '5. Propriedade intelectual e foro',
          p: 'A marca Amunì a Caparica, textos, identidade visual e fotografias reais apresentadas pertencem aos respetivos titulares, sendo vedada a reprodução comercial sem autorização. Aplica-se a legislação portuguesa, dispondo o consumidor de acesso ao Livro de Reclamações Eletrónico (livroreclamacoes.pt).'
        }
      ]
    }
  };

  var legalDialog = document.getElementById('legalDialog');
  document.querySelectorAll('[data-open-legal]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var key = link.getAttribute('data-open-legal');
      var doc = LEGAL_DOCS[key] || LEGAL_DOCS.privacidade;
      document.getElementById('legalDialogTitle').textContent = doc.title;
      var body = document.getElementById('legalDialogBody');
      body.innerHTML = '';
      doc.sections.forEach(function (s) {
        body.appendChild(el('h3', '', s.h));
        body.appendChild(el('p', '', s.p));
      });
      openDialog(legalDialog, link);
    });
  });

  /* ---------- Pausa voluntária de movimento (acessibilidade) ---------- */
  var motionBtn = document.getElementById('motionToggle');
  if (motionBtn) {
    motionBtn.addEventListener('click', function () {
      var paused = document.documentElement.classList.toggle('motion-paused');
      motionBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      motionBtn.textContent = paused ? 'Retomar movimento' : 'Pausar movimento';
      window.dispatchEvent(new Event('motionchange'));
    });
  }

  /* ---------- Inicialização síncrona (antes de anim-kit.js) ---------- */
  renderScheduleAndStatus();
  renderPopular();
  renderCategoryTabs();
  renderMenu();
  renderExtrasStrip();
  initBookingForm();
  renderGallery();
  renderReviews();
  loadCart();
  updateCartUI(false);
})();
