/* ============================================================
   NELLO'S — interacción
   Carta (búsqueda y filtros) · pedido editable · resumen con
   consentimiento · horario en vivo (hora de Cádiz) · galería ·
   documentos legales · menú móvil · pausa de animaciones.
   Sin dependencias, sin rastreadores, sin peticiones externas.
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  var DATA = JSON.parse($('#carta-data').textContent);
  var SITE = DATA.site;
  var ITEMS = {};
  DATA.items.forEach(function (it) { ITEMS[it.id] = it; });

  var EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  var money = function (n) { return EUR.format(n); };
  var norm = function (s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  };
  var reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  var motionOff = function () { return reduceMQ.matches || root.classList.contains('motion-paused'); };

  var KEY_ORDER = 'nellos-pedido-v1';
  var KEY_MOTION = 'nellos-movimiento-v1';
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* modo privado */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* noop */ } }
  };

  var srLive = $('#sr-live');
  var announceTimer;
  function announce(msg) {
    clearTimeout(announceTimer);
    srLive.textContent = '';
    announceTimer = setTimeout(function () { srLive.textContent = msg; }, 60);
  }
  function svg(name) {
    return '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
  }

  /* ==========================================================
     1. DIÁLOGOS (pedido, galería, privacidad, aviso legal)
     ========================================================== */
  var drawer = $('#pedido-drawer');
  var lightbox = $('#lightbox');
  var legalDocs = { privacy: $('#privacy'), terms: $('#terms') };

  // Sin JS los textos legales se leen en la página; con JS pasan a ser modales.
  Object.keys(legalDocs).forEach(function (k) {
    var d = legalDocs[k];
    if (d && d.open) d.close ? d.close() : d.removeAttribute('open');
  });

  function anyDialogOpen() { return $$('dialog').some(function (d) { return d.open; }); }

  function openDialog(dlg, opener) {
    if (!dlg) return;
    if (opener) dlg._opener = opener;
    else if (!dlg.open) dlg._opener = doc.activeElement;
    if (dlg.open) return;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    root.classList.add('has-modal');
    if (dlg === drawer) { var t = $('#toast'); if (t) t.classList.remove('show'); }
  }
  function closeDialog(dlg) {
    if (!dlg || !dlg.open) return;
    if (typeof dlg.close === 'function') dlg.close();
    else { dlg.removeAttribute('open'); dlg.dispatchEvent(new Event('close')); }
  }

  $$('dialog').forEach(function (dlg) {
    dlg.addEventListener('close', function () {
      if (!anyDialogOpen()) root.classList.remove('has-modal');
      var target = dlg._opener;
      dlg._opener = null;
      if (dlg._noRestore) { dlg._noRestore = false; return; }
      if (target && target.isConnected && typeof target.focus === 'function') target.focus({ preventScroll: true });
      if ((dlg === legalDocs.privacy || dlg === legalDocs.terms) && /^#(privacy|terms)$/.test(location.hash)) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    });
    // clic en el fondo (::backdrop) cierra
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDialog(dlg); });
  });

  doc.addEventListener('click', function (e) {
    var closer = e.target.closest('[data-close-dialog]');
    if (closer) {
      var dlg = closer.closest('dialog');
      if (closer.tagName === 'A' && closer.getAttribute('href') === '#carta') {
        dlg._noRestore = true;
        closeDialog(dlg);
        setTimeout(function () { var s = $('#menu-search'); if (s) s.focus({ preventScroll: true }); }, 400);
        return; // deja que el enlace navegue hasta la carta
      }
      e.preventDefault();
      closeDialog(dlg);
      return;
    }
    var legal = e.target.closest('a[href="#privacy"], a[href="#terms"]');
    if (legal) {
      e.preventDefault();
      openDialog(legalDocs[legal.getAttribute('href').slice(1)], legal);
      return;
    }
    var opener = e.target.closest('[data-open-order]');
    if (opener) {
      e.preventDefault();
      setNav(false);
      openDialog(drawer, opener.closest('.toast') ? $('.cart-btn') : opener);
    }
  });

  function openFromHash() {
    var k = location.hash.slice(1);
    if (legalDocs[k]) openDialog(legalDocs[k], null);
  }
  addEventListener('hashchange', openFromHash);

  /* ==========================================================
     2. CARTA — botones de añadir (mejora progresiva)
     ========================================================== */
  $$('[data-buy]').forEach(function (chip) {
    var dish = chip.closest('.dish');
    var it = ITEMS[dish.dataset.id];
    var label = chip.dataset.label || '';
    var price = parseFloat(chip.dataset.price);
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'buy';
    btn.dataset.label = label;
    btn.dataset.price = String(price);
    btn.innerHTML = chip.innerHTML + '<span class="plus" aria-hidden="true">' + svg('plus') + '</span>';
    // WCAG 2.5.3: el nombre accesible contiene el texto visible del botón
    var visible = chip.textContent.replace(/\s+/g, ' ').trim();
    var what = it.builder ? 'pasta con la salsa elegida' : it.name + (label && visible.indexOf(label) < 0 ? ' ' + label.toLowerCase() : '');
    btn.setAttribute('aria-label', 'Añadir ' + what + ': ' + visible);
    chip.parentNode.replaceChild(btn, chip);
  });

  var menu = $('#menu');
  menu.addEventListener('click', function (e) {
    var btn = e.target.closest('button.buy');
    if (!btn) return;
    var dish = btn.closest('.dish');
    var opts = { size: btn.dataset.label || '' };
    if (ITEMS[dish.dataset.id].builder) {
      opts.pasta = $('[data-builder="pasta"]', dish).value;
      opts.salsa = $('[data-builder="salsa"]', dish).value;
    }
    addToCart(dish.dataset.id, opts);
    btn.classList.add('added');
    var plus = $('.plus', btn);
    plus.innerHTML = svg('check');
    clearTimeout(btn._t);
    btn._t = setTimeout(function () { btn.classList.remove('added'); plus.innerHTML = svg('plus'); }, 1400);
  });

  /* ==========================================================
     3. CARTA — búsqueda, categorías y filtros
     ========================================================== */
  var search = $('#menu-search');
  var countEl = $('#menu-count');
  var emptyEl = $('#menu-empty');
  var dishes = $$('.dish');
  var groups = $$('.menu-group');
  var notes = $$('.menu-note');
  notes.forEach(function (n) { n.dataset.search = norm(n.textContent); });
  var filter = { cat: 'all', tags: [] };
  var TOTAL = dishes.length;
  var plural = function (n) { return n + (n === 1 ? ' plato' : ' platos'); };

  function applyFilters() {
    var q = norm(search.value);
    var words = q ? q.split(' ') : [];
    var match = function (text) { return words.every(function (w) { return text.indexOf(w) > -1; }); };
    var shown = 0;
    dishes.forEach(function (d) {
      var tags = d.dataset.tags.split(' ');
      var ok = (filter.cat === 'all' || d.dataset.cat === filter.cat) &&
        filter.tags.every(function (t) { return tags.indexOf(t) > -1; }) &&
        (!words.length || match(d.dataset.search));
      d.classList.toggle('is-hidden', !ok);
      if (ok) shown++;
    });
    var noteHits = 0;
    notes.forEach(function (n) {
      var g = n.closest('.menu-group');
      var catOk = filter.cat === 'all' || g.dataset.group === filter.cat;
      var ok = catOk && !filter.tags.length && (!words.length || match(n.dataset.search));
      n.classList.toggle('is-hidden', !ok);
      if (ok && words.length) noteHits++;
    });
    groups.forEach(function (g) {
      var n = $$('.dish:not(.is-hidden)', g).length;
      var hasNote = $$('.menu-note:not(.is-hidden)', g).length > 0;
      var catOk = filter.cat === 'all' || g.dataset.group === filter.cat;
      g.classList.toggle('is-hidden', !catOk || (n === 0 && !(hasNote && (words.length || !filter.tags.length))));
      $('[data-group-count]', g).textContent = String(n);
    });
    var filtered = words.length || filter.tags.length || filter.cat !== 'all';
    var text = filtered ? 'Mostrando ' + shown + ' de ' + plural(TOTAL) : plural(TOTAL);
    var changed = countEl.textContent !== text;
    countEl.textContent = text;
    emptyEl.hidden = shown > 0 || noteHits > 0;
    $('.tools-dot').hidden = !(words.length || filter.tags.length);
    if (changed && applyFilters.ready) announce(shown ? text + '.' : 'No hay platos que coincidan.');
    applyFilters.ready = true;
  }

  var toolsMore = $('#tools-more');
  var tools = $('.menu-tools');
  toolsMore.addEventListener('click', function () {
    var open = !tools.classList.contains('is-open');
    tools.classList.toggle('is-open', open);
    toolsMore.setAttribute('aria-expanded', String(open));
    if (open) search.focus({ preventScroll: true });
  });

  var searchTimer;
  search.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 120);
  });
  search.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && search.value) { search.value = ''; applyFilters(); }
  });

  function scrollToMenu() {
    var tools = $('.menu-tools');
    var top = menu.getBoundingClientRect().top;
    var limit = tools.getBoundingClientRect().bottom + 10;
    if (top < limit) {
      window.scrollTo({ top: window.pageYOffset + top - limit, behavior: motionOff() ? 'auto' : 'smooth' });
    }
  }

  $$('[data-cat-filter]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      filter.cat = chip.dataset.catFilter;
      $$('[data-cat-filter]').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      applyFilters();
      scrollToMenu();
    });
  });
  $$('[data-tag-filter]').forEach(function (t) {
    t.addEventListener('click', function () {
      var tag = t.dataset.tagFilter;
      var on = t.getAttribute('aria-pressed') !== 'true';
      t.setAttribute('aria-pressed', String(on));
      filter.tags = filter.tags.filter(function (x) { return x !== tag; });
      if (on) filter.tags.push(tag);
      applyFilters();
    });
  });
  $$('[data-clear-filters]').forEach(function (b) {
    b.addEventListener('click', function () {
      search.value = '';
      filter.cat = 'all';
      filter.tags = [];
      $$('[data-cat-filter]').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.catFilter === 'all')); });
      $$('[data-tag-filter]').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      applyFilters();
      search.focus();
    });
  });

  /* ==========================================================
     4. PEDIDO — estado, borrador local y render
     ========================================================== */
  var cart = [];
  var MODE_LABEL = { recoger: 'Recoger en el local', domicilio: 'A domicilio', sala: 'En sala o terraza' };
  var MODE_HINT = {
    recoger: 'Recoges en C. San Federico, 52. El local te confirma la hora al llamar.',
    domicilio: 'La zona de reparto y los posibles gastos de envío te los confirma el local. También puedes pedir en Just Eat, Uber Eats o Glovo.',
    sala: 'Para comer en sala o terraza: indica personas y hora, y confirma la reserva por teléfono.'
  };
  var form = $('#order-form');
  var linesEl = $('#cart-lines');
  var sendPanel = $('#send-panel');
  var orderText = $('#order-text');
  var consent = $('#order-consent');

  function keyOf(l) { return [l.id, l.size, l.pasta, l.salsa].join('|'); }
  function unitPrice(l) {
    var it = ITEMS[l.id];
    if (!it) return 0;
    var p = it.prices.filter(function (x) { return x.label === l.size; })[0] || it.prices[0];
    return p.price;
  }
  function subtotal() { return cart.reduce(function (s, l) { return s + unitPrice(l) * l.qty; }, 0); }
  function count() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }
  function title(l) { return ITEMS[l.id].builder ? l.pasta : ITEMS[l.id].name; }
  function detail(l) {
    var it = ITEMS[l.id];
    if (it.builder) return 'Salsa ' + l.salsa.toLowerCase();
    return l.size;
  }
  function summaryName(l) {
    var it = ITEMS[l.id];
    if (it.builder) return l.pasta + ' con salsa ' + l.salsa.toLowerCase();
    return it.name + (l.size ? ' (' + l.size.toLowerCase() + ')' : '') + (it.adult ? ' (+18)' : '');
  }
  function mode() { var r = $('input[name="mode"]:checked', form); return r ? r.value : 'recoger'; }

  function valid(l) {
    var it = ITEMS[l && l.id];
    if (!it) return false;
    if (it.builder) return it.builder.pasta.indexOf(l.pasta) > -1 && it.builder.salsas.indexOf(l.salsa) > -1;
    return it.prices.some(function (p) { return p.label === (l.size || ''); });
  }

  function persist() {
    // Solo platos, cantidades y modalidad: nunca nombre, dirección, notas o alergias.
    if (!cart.length) { store.set(KEY_ORDER, { v: 1, items: [], mode: mode() }); return; }
    store.set(KEY_ORDER, {
      v: 1,
      mode: mode(),
      items: cart.map(function (l) { return { id: l.id, size: l.size, pasta: l.pasta, salsa: l.salsa, qty: l.qty }; })
    });
  }

  function restore() {
    var saved = store.get(KEY_ORDER);
    if (!saved || saved.v !== 1 || !Array.isArray(saved.items)) return;
    saved.items.forEach(function (raw) {
      var l = {
        id: String(raw.id || ''), size: String(raw.size || ''), pasta: String(raw.pasta || ''),
        salsa: String(raw.salsa || ''), qty: Math.min(99, Math.max(1, parseInt(raw.qty, 10) || 1))
      };
      if (!valid(l)) return;
      l.key = keyOf(l);
      var dup = cart.filter(function (x) { return x.key === l.key; })[0];
      if (dup) dup.qty = Math.min(99, dup.qty + l.qty); else cart.push(l);
    });
    if (MODE_LABEL[saved.mode]) {
      var r = $('input[name="mode"][value="' + saved.mode + '"]', form);
      if (r) r.checked = true;
    }
  }

  function addToCart(id, opts) {
    var l = { id: id, size: opts.size || '', pasta: opts.pasta || '', salsa: opts.salsa || '', qty: 1 };
    if (!valid(l)) return;
    l.key = keyOf(l);
    var found = cart.filter(function (x) { return x.key === l.key; })[0];
    if (found) found.qty = Math.min(99, found.qty + 1); else cart.push(l);
    var q = found ? found.qty : 1;
    persist();
    renderCart();
    $$('[data-cart-count]').forEach(function (b) {
      b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    });
    var msg = 'Añadido: ' + summaryName(l) + (q > 1 ? ' · ' + q + ' uds.' : '');
    toast(msg);
    announce(msg + '. Total del pedido: ' + money(subtotal()) + '.');
  }

  function setQty(key, qty) {
    var l = cart.filter(function (x) { return x.key === key; })[0];
    if (!l) return;
    l.qty = Math.min(99, Math.max(1, qty));
    persist();
    renderCart();
  }
  function removeLine(key) {
    var idx = -1;
    cart.forEach(function (x, i) { if (x.key === key) idx = i; });
    if (idx < 0) return;
    var gone = cart.splice(idx, 1)[0];
    persist();
    renderCart();
    announce('Eliminado: ' + summaryName(gone) + '.');
    var next = linesEl.children[Math.min(idx, linesEl.children.length - 1)];
    if (next) $('.line-remove', next).focus();
    else $('#cart-empty .btn').focus();
  }

  function lineEl(l) {
    var li = doc.createElement('li');
    li.className = 'line';
    li.dataset.key = l.key;
    li.innerHTML =
      '<div class="line-info"><b></b><span></span></div>' +
      '<strong class="line-total"></strong>' +
      '<div class="line-ctrl">' +
        '<div class="qty" role="group">' +
          '<button type="button" class="q-minus">' + svg('minus') + '</button>' +
          '<input class="q-input" type="number" inputmode="numeric" min="1" max="99" step="1">' +
          '<button type="button" class="q-plus">' + svg('plus') + '</button>' +
        '</div>' +
        '<button type="button" class="line-remove">' + svg('trash') + 'Eliminar</button>' +
      '</div>';
    var name = summaryName(l);
    $('b', li).textContent = title(l);
    $('.qty', li).setAttribute('aria-label', 'Cantidad de ' + name);
    $('.q-minus', li).setAttribute('aria-label', 'Quitar una unidad de ' + name);
    $('.q-plus', li).setAttribute('aria-label', 'Añadir una unidad de ' + name);
    $('.q-input', li).setAttribute('aria-label', 'Unidades de ' + name);
    $('.line-remove', li).setAttribute('aria-label', 'Eliminar ' + name + ' del pedido');
    if (ITEMS[l.id].adult) {
      var tag = doc.createElement('span');
      tag.className = 'tag tag-adult';
      tag.textContent = '+18';
      $('.line-info', li).appendChild(tag);
    }
    return li;
  }

  function renderCart() {
    var existing = {};
    $$('.line', linesEl).forEach(function (li) { existing[li.dataset.key] = li; });
    cart.forEach(function (l) {
      var li = existing[l.key];
      if (!li) { li = lineEl(l); linesEl.appendChild(li); }
      delete existing[l.key];
      var unit = unitPrice(l);
      $('.line-info span', li).textContent = [detail(l), money(unit) + ' / ud.'].filter(Boolean).join(' · ');
      $('.line-total', li).textContent = money(unit * l.qty);
      var input = $('.q-input', li);
      if (doc.activeElement !== input) input.value = String(l.qty);
      $('.q-minus', li).disabled = l.qty <= 1;
      $('.q-plus', li).disabled = l.qty >= 99;
    });
    Object.keys(existing).forEach(function (k) { existing[k].remove(); });

    var n = count();
    var total = money(subtotal());
    $$('[data-cart-count]').forEach(function (el) { el.textContent = String(n); });
    $$('[data-cart-total]').forEach(function (el) { el.textContent = total; });
    $('#cart-subtotal').textContent = total;
    $('[data-cart-sr]').textContent = n ? ': ' + plural(n) + ', ' + total : ': vacío';
    $('#cart-empty').hidden = cart.length > 0;
    $('#cart-tools').hidden = cart.length === 0;
    $('#cart-fab').hidden = cart.length === 0;
    if (!cart.length) { $('#clear-confirm').hidden = true; $('#cart-clear').hidden = false; }
    refreshSummary();
  }

  linesEl.addEventListener('click', function (e) {
    var li = e.target.closest('.line');
    if (!li) return;
    var key = li.dataset.key;
    var l = cart.filter(function (x) { return x.key === key; })[0];
    if (!l) return;
    if (e.target.closest('.q-minus')) setQty(key, l.qty - 1);
    else if (e.target.closest('.q-plus')) setQty(key, l.qty + 1);
    else if (e.target.closest('.line-remove')) removeLine(key);
  });
  linesEl.addEventListener('change', function (e) {
    if (!e.target.classList.contains('q-input')) return;
    var li = e.target.closest('.line');
    var v = parseInt(e.target.value, 10);
    var l = cart.filter(function (x) { return x.key === li.dataset.key; })[0];
    var q = isNaN(v) ? (l ? l.qty : 1) : v;
    e.target.value = String(Math.min(99, Math.max(1, q)));
    setQty(li.dataset.key, q);
  });
  linesEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.classList.contains('q-input')) { e.preventDefault(); e.target.blur(); e.target.focus(); }
  });

  $('#cart-clear').addEventListener('click', function () {
    $('#cart-clear').hidden = true;
    $('#clear-confirm').hidden = false;
    $('#clear-yes').focus();
  });
  $('#clear-no').addEventListener('click', function () {
    $('#clear-confirm').hidden = true;
    $('#cart-clear').hidden = false;
    $('#cart-clear').focus();
  });
  $('#clear-yes').addEventListener('click', function () {
    cart = [];
    persist();
    renderCart();
    hideSend();
    announce('Pedido vaciado.');
    $('#cart-empty .btn').focus();
  });

  /* ==========================================================
     5. PEDIDO — modalidad, resumen, consentimiento y envío
     ========================================================== */
  function fields() {
    var v = function (n) { var el = form.elements[n]; return el ? String(el.value || '').trim() : ''; };
    return { nombre: v('nombre'), hora: v('hora'), direccion: v('direccion'), personas: v('personas'), notas: v('notas'), alergias: v('alergias') };
  }

  function buildSummary() {
    var f = fields();
    var m = mode();
    var out = ["PEDIDO PARA NELLO'S · Trattoria Pizzeria (San Fernando)", 'Modalidad: ' + MODE_LABEL[m]];
    if (f.nombre) out.push('Nombre: ' + f.nombre);
    if (m === 'domicilio' && f.direccion) out.push('Dirección de entrega: ' + f.direccion);
    if (m === 'sala' && f.personas) out.push('Personas: ' + f.personas);
    if (f.hora) out.push('Hora deseada: ' + f.hora);
    out.push('');
    cart.forEach(function (l) { out.push(l.qty + ' x ' + summaryName(l) + ' — ' + money(unitPrice(l) * l.qty)); });
    out.push('');
    out.push('Subtotal orientativo: ' + money(subtotal()) + ' (precios de la carta del local)');
    if (f.notas) out.push('Observaciones: ' + f.notas);
    if (f.alergias) out.push('Alergias o intolerancias: ' + f.alergias);
    if (cart.some(function (l) { return ITEMS[l.id].adult; })) out.push('Incluye bebidas alcohólicas: solo para mayores de 18 años.');
    out.push('');
    out.push('Pendiente de confirmación por el restaurante: disponibilidad, importe final y tiempo.');
    return out.join('\n');
  }

  function refreshSummary() {
    $('#summary-preview').textContent = cart.length ? buildSummary() : 'Añade platos para ver el resumen.';
    if (!sendPanel.hidden) {
      if (!cart.length || !consent.checked) hideSend();
      else setSendText(buildSummary());
    }
  }

  function syncMode() {
    var m = mode();
    $('#mode-hint').textContent = MODE_HINT[m];
    $$('[data-only]', form).forEach(function (el) { el.hidden = el.dataset.only !== m; });
    var addr = form.elements.direccion;
    addr.setAttribute('aria-required', String(m === 'domicilio'));
    if (m !== 'domicilio') { addr.removeAttribute('aria-invalid'); $('#address-error').hidden = true; }
  }
  form.addEventListener('change', function (e) {
    if (e.target.name === 'mode') { syncMode(); persist(); }
    if (e.target === consent) {
      if (consent.checked) { $('#consent-error').hidden = true; consent.closest('.consent').classList.remove('has-error'); }
      else hideSend();
    }
    refreshSummary();
  });
  form.addEventListener('input', function (e) {
    if (e.target.name === 'direccion' && e.target.value.trim()) { e.target.removeAttribute('aria-invalid'); $('#address-error').hidden = true; }
    refreshSummary();
  });

  var waNumber = String(SITE.whatsapp || '').replace(/\D/g, '');
  function setSendText(text) {
    orderText.value = text;
    $('#mail-order').href = 'mailto:' + SITE.email + '?subject=' + encodeURIComponent("Pedido web · Nello's") + '&body=' + encodeURIComponent(text);
    var wa = $('#wa-order');
    if (waNumber.length >= 8) { wa.href = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(text); wa.hidden = false; }
    $('#share-order').hidden = !(navigator.share);
  }
  function hideSend() {
    sendPanel.hidden = true;
    orderText.value = '';
    $('#copy-status').textContent = '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    ['#consent-error', '#cart-error', '#address-error'].forEach(function (s) { $(s).hidden = true; });
    consent.closest('.consent').classList.remove('has-error');
    var msgs = [];
    if (!cart.length) { $('#cart-error').hidden = false; msgs.push($('#cart-error').textContent); }
    var addr = form.elements.direccion;
    if (mode() === 'domicilio' && !addr.value.trim()) {
      $('#address-error').hidden = false;
      addr.setAttribute('aria-invalid', 'true');
      addr.setAttribute('aria-describedby', 'address-error');
      firstBad = addr;
      msgs.push($('#address-error').textContent);
    }
    if (!consent.checked) {
      $('#consent-error').hidden = false;
      consent.closest('.consent').classList.add('has-error');
      firstBad = firstBad || consent;
      msgs.push($('#consent-error').textContent);
    }
    if (msgs.length) {
      hideSend();
      announce(msgs.join(' '));
      if (firstBad) firstBad.focus();
      else $('#cart-empty .btn').focus();
      return;
    }
    setSendText(buildSummary());
    sendPanel.hidden = false;
    sendPanel.focus({ preventScroll: true });
    // rola só o corpo da gaveta (nunca o diálogo nem a página)
    var body = $('.drawer-body', drawer);
    var top = body.scrollTop + sendPanel.getBoundingClientRect().top - body.getBoundingClientRect().top - 12;
    body.scrollTo({ top: Math.max(0, top), behavior: motionOff() ? 'auto' : 'smooth' });
    announce('Resumen listo. Cópialo o compártelo y llama a Nello\'s para confirmar.');
  });

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      orderText.focus();
      orderText.select();
      try { if (doc.execCommand('copy')) resolve(); else reject(new Error('copy')); } catch (err) { reject(err); }
    });
  }
  $('#copy-order').addEventListener('click', function () {
    var status = $('#copy-status');
    copyText(orderText.value).then(function () {
      status.textContent = 'Resumen copiado. Ahora llama a Nello\'s o pégalo donde prefieras.';
    }).catch(function () {
      orderText.focus();
      orderText.select();
      status.textContent = 'No se pudo copiar automáticamente: el texto está seleccionado, cópialo con Ctrl+C o mantén pulsado.';
    });
  });
  $('#share-order').addEventListener('click', function () {
    if (!navigator.share) return;
    navigator.share({ title: "Pedido para Nello's", text: orderText.value }).catch(function () { /* cancelado */ });
  });
  $('#edit-order').addEventListener('click', function () {
    hideSend();
    form.elements.nombre.focus();
  });

  /* ==========================================================
     6. AVISO (toast) Y BOTÓN FLOTANTE
     ========================================================== */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    $('#toast-msg').textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
  }
  toastEl.addEventListener('mouseenter', function () { clearTimeout(toastTimer); });
  toastEl.addEventListener('mouseleave', function () { toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1200); });

  /* ==========================================================
     7. HORARIO EN VIVO (Europe/Madrid)
     ========================================================== */
  var DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  var byDay = {};
  SITE.hours.forEach(function (h) { byDay[h.day] = h; });
  var toMin = function (t) { var a = t.split(':'); return parseInt(a[0], 10) * 60 + parseInt(a[1], 10); };

  function madridNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      var m = {};
      parts.forEach(function (p) { m[p.type] = p.value; });
      return { day: DAYS[m.weekday], min: (parseInt(m.hour, 10) % 24) * 60 + parseInt(m.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function openState() {
    var now = madridNow();
    var today = byDay[now.day];
    for (var i = 0; i < today.ranges.length; i++) {
      var r = today.ranges[i];
      if (now.min >= toMin(r[0]) && now.min < toMin(r[1])) {
        return { open: true, day: now.day, text: 'Abierto ahora · hasta las ' + r[1] };
      }
    }
    for (var k = 0; k < 8; k++) {
      var d = (now.day + k) % 7;
      var h = byDay[d];
      for (var j = 0; j < h.ranges.length; j++) {
        if (k === 0 && toMin(h.ranges[j][0]) <= now.min) continue;
        var when = k === 0 ? 'hoy' : k === 1 ? 'mañana' : 'el ' + h.label.toLowerCase();
        return { open: false, day: now.day, text: 'Cerrado ahora · abre ' + when + ' a las ' + h.ranges[j][0] };
      }
    }
    return { open: false, day: now.day, text: 'Consulta el horario' };
  }

  function paintStatus() {
    var s = openState();
    $$('[data-status]').forEach(function (el) {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      var t = $('[data-status-text]', el);
      if (t) t.textContent = s.text;
    });
    $$('.hours tr').forEach(function (tr) {
      var isToday = parseInt(tr.dataset.day, 10) === s.day;
      tr.classList.toggle('today', isToday);
      if (isToday) tr.setAttribute('aria-current', 'date'); else tr.removeAttribute('aria-current');
    });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ==========================================================
     8. GALERÍA — lightbox accesible con teclado
     ========================================================== */
  var figs = $$('.g-fig');
  var lbIndex = 0;
  var lbFig = $('#lb-fig');
  var lbCap = $('#lb-cap');
  var lbImg = null;

  function showPhoto(i) {
    lbIndex = (i + figs.length) % figs.length;
    var src = $('img', figs[lbIndex]);
    if (!lbImg) {
      lbImg = doc.createElement('img');
      lbImg.decoding = 'async';
      lbFig.insertBefore(lbImg, lbCap);
    }
    lbImg.src = src.currentSrc || src.src;
    lbImg.alt = src.alt;
    // tamanho nativo: as fotos de 320 px nunca são esticadas
    lbImg.width = src.naturalWidth || src.width;
    lbImg.height = src.naturalHeight || src.height;
    var cap = $('.g-cap', figs[lbIndex]);
    lbCap.innerHTML = '';
    var b = doc.createElement('span');
    b.textContent = $('b', cap).textContent;
    var s = doc.createElement('small');
    s.textContent = $('small', cap).textContent;
    lbCap.appendChild(b);
    lbCap.appendChild(s);
    $('#lb-count').textContent = (lbIndex + 1) + ' / ' + figs.length;
  }

  figs.forEach(function (fig, i) {
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'g-btn';
    btn.setAttribute('aria-label', 'Ampliar foto: ' + $('.g-cap b', fig).textContent);
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.addEventListener('click', function () { showPhoto(i); openDialog(lightbox, btn); });
    fig.appendChild(btn);
  });
  $('#lb-prev').addEventListener('click', function () { showPhoto(lbIndex - 1); });
  $('#lb-next').addEventListener('click', function () { showPhoto(lbIndex + 1); });
  lightbox.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); showPhoto(lbIndex - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); showPhoto(lbIndex + 1); }
  });
  lightbox.addEventListener('close', function () {
    var btn = $('.g-btn', figs[lbIndex]);
    if (btn) btn.focus({ preventScroll: true });
  });

  /* ==========================================================
     9. MENÚ MÓVIL
     ========================================================== */
  var navToggle = $('#nav-toggle');
  var mnav = $('#mobile-nav');
  function setNav(open) {
    if (!mnav || mnav.hidden === !open) return;
    mnav.hidden = !open;
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    $('use', navToggle).setAttribute('href', open ? '#i-x' : '#i-menu');
    root.classList.toggle('nav-open', open);
    $$('main, footer').forEach(function (el) { el.inert = open; });
    if (open) $('a', mnav).focus();
  }
  navToggle.addEventListener('click', function () { setNav(mnav.hidden); });
  mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !mnav.hidden) { setNav(false); navToggle.focus(); }
  });
  matchMedia('(min-width: 1061px)').addEventListener('change', function (e) { if (e.matches) setNav(false); });

  /* ==========================================================
     10. PAUSA DE ANIMACIONES (WCAG 2.2.2) — preferencia local
     ========================================================== */
  function setPaused(paused, save) {
    root.classList.toggle('motion-paused', paused);
    $$('[data-motion-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(paused));
      if (b.title) b.title = paused ? 'Reanudar animaciones' : 'Pausar animaciones';
    });
    if (save) store.set(KEY_MOTION, paused);
    window.dispatchEvent(new Event('motionchange'));
  }
  $$('[data-motion-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = !root.classList.contains('motion-paused');
      setPaused(next, true);
      announce(next ? 'Animaciones en pausa.' : 'Animaciones reanudadas.');
    });
  });
  if (store.get(KEY_MOTION) === true) setPaused(true, false);

  /* ==========================================================
     11. CIFRAS · CABECERA · NAVEGACIÓN ACTIVA
     ========================================================== */
  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.dec || '0', 10);
    var fmt = function (v) { return v.toFixed(dec).replace('.', ','); };
    if (motionOff()) { el.textContent = fmt(target); return; }
    var t0 = performance.now();
    var dur = 1400;
    (function frame(t) {
      var p = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame); else el.textContent = fmt(target);
    })(t0);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { cio.unobserve(e.target); countUp(e.target); } });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });

    var navLinks = $$('.nav-links a, #mobile-nav nav a');
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach(function (s) { sio.observe(s); });
  }

  var hdr = $('#hdr');
  function setHdrVar() { root.style.setProperty('--hdr-h', hdr.offsetHeight + 'px'); }
  setHdrVar();
  if ('ResizeObserver' in window) new ResizeObserver(setHdrVar).observe(hdr);
  else addEventListener('resize', setHdrVar);

  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ==========================================================
     12. INICIO
     ========================================================== */
  restore();
  syncMode();
  renderCart();
  applyFilters();
  openFromHash();
})();
