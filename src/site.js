/* ============================================================
   Pizzeria Napolitana — interações
   Sem dependências. Tudo funciona sem rede.
   ============================================================ */
(function () {
  'use strict';

  var MENU = {
    salchipizza: {
      name: 'Salchipizza',
      detail: 'queijo fundido, bacon, salsicha e especiarias',
      art: 'art-salchi'
    },
    '4quesos': {
      name: 'Pizza 4 quesos',
      detail: 'combinação de queijos na massa artesanal',
      art: 'art-4q'
    },
    kebab: {
      name: 'Pizza kebab',
      detail: 'versão inspirada no kebab, preparo da casa',
      art: 'art-kebab'
    },
    carbonara: {
      name: 'Pizza carbonara',
      detail: 'interpretação da carbonara em pizza',
      art: 'art-carb'
    }
  };

  var KEY = 'napolitana:order:v1';
  var state = { items: {}, notes: '', mode: 'Retirada no Mercado Municipal' };

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- persistência ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        if (data.items && typeof data.items === 'object') {
          Object.keys(data.items).forEach(function (id) {
            if (MENU[id]) {
              var n = parseInt(data.items[id], 10);
              if (n > 0) state.items[id] = Math.min(n, 30);
            }
          });
        }
        if ( typeof data.notes === 'string') state.notes = data.notes.slice(0, 400);
        if ( typeof data.mode === 'string' && data.mode) state.mode = data.mode;
      }
    } catch (e) { /* armazenamento bloqueado: segue sem persistir */ }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------- utilidades ---------- */
  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3400);
  }

  function countItems() {
    return Object.keys(state.items).reduce(function (t, k) { return t + state.items[k]; }, 0);
  }

  function summaryText() {
    var lines = ['PIZZERIA NAPOLITANA · Torralba de Calatrava', 'Resumo do pedido (rascunho — não confirmado)', ''];
    Object.keys(state.items).forEach(function (id) {
      lines.push('• ' + state.items[id] + '× ' + MENU[id].name);
    });
    lines.push('');
    lines.push('Modalidade: ' + state.mode);
    if (state.notes.trim()) lines.push('Observações: ' + state.notes.trim());
    lines.push('Total: a confirmar pela pizzeria');
    lines.push('Contato: +34 627 66 10 61');
    lines.push('');
    lines.push('Enviado por mim a partir do site. Nenhum pedido foi confirmado automaticamente.');
    return lines.join('\n');
  }

  /* ---------- header, progresso, menu mobile ---------- */
  function initChrome() {
    var hdr = $('#hdr');
    var bar = $('#bar');
    var toggle = $('#navToggle');
    var menu = $('#mobileMenu');
    var links = $$('.nav-links a');
    var sections = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
    var currentId = null;

    function spy() {
      if (!sections.length) return;
      var y = (window.pageYOffset || 0) + 140;
      var current = null;
      sections.forEach(function (s) { if (s.offsetTop <= y) current = s; });
      var id = current ? current.id : null;
      if (id === currentId) return;
      currentId = id;
      links.forEach(function (a) {
        if (id && a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }

    function onScroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (hdr) hdr.classList.toggle('stuck', y > 8);
      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight) || 1;
      if (bar) bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, y / max)).toFixed(4) + ')';

      var mbar = $('#mobileBar');
      if (mbar) {
        var drawerOpen = $('#drawer') && $('#drawer').classList.contains('open');
        mbar.classList.toggle('show', y > 620 && !drawerOpen);
      }
      spy();
    }

    var raf = false;
    window.addEventListener('scroll', function () {
      if (raf) return;
      raf = true;
      requestAnimationFrame(function () { raf = false; onScroll(); });
    }, { passive: true });
    onScroll();

    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        var open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        toggle.setAttribute('aria-label', open ? 'Abrir menu de navegação' : 'Fechar menu de navegação');
        toggle.textContent = open ? '☰' : '✕';
        menu.setAttribute('data-open', String(!open));
      });
      $$('a', menu).forEach(function (a) {
        a.addEventListener('click', function () {
          menu.setAttribute('data-open', 'false');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Abrir menu de navegação');
          toggle.textContent = '☰';
        });
      });
    }

  }

  /* ---------- reveal no scroll (com rede de segurança) ---------- */
  function initReveal() {
    var els = $$('[data-rv]');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

    els.forEach(function (el) { io.observe(el); });

    /* Se algo impedir o observer (aba em segundo plano, navegador antigo,
       altura zero), o conteúdo nunca pode ficar invisível. */
    function rescue() {
      var vh = window.innerHeight || 800;
      els.forEach(function (el) {
        if (el.classList.contains('in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.96 && r.bottom > -40) el.classList.add('in');
      });
    }
    window.addEventListener('load', function () { setTimeout(rescue, 400); });
    window.addEventListener('scroll', rescue, { passive: true });
    setTimeout(function () {
      if (!els.some(function (el) { return el.classList.contains('in'); })) {
        els.forEach(function (el) { el.classList.add('in'); });
      }
    }, 2600);
  }

  /* ---------- imagens remotas com fallback ---------- */
  function initImages() {
    $$('img[data-photo], #heroPhoto').forEach(function (img) {
      var box = img.closest('.disc, figure') || img.parentElement;
      function ok() { if (box) box.classList.add(box.classList.contains('disc') ? 'has-img' : 'has-img'); img.classList.add('loaded'); }
      function fail() { if (box) box.classList.add('no-img'); img.style.display = 'none'; }
      if (img.complete && img.naturalWidth > 0) ok();
      img.addEventListener('load', ok);
      img.addEventListener('error', fail);
    });
  }

  /* ---------- ticker ---------- */
  function initTicker() {
    var track = $('#tickerTrack');
    if (!track) return;
    var base = track.innerHTML;
    track.innerHTML = base + base + base + base; /* 4 cópias: -50% fecha o loop */
  }

  /* ---------- horários ---------- */
  function initHours() {
    var table = $('#hoursTable');
    if (!table) return;
    var d = new Date().getDay(); /* 0 = domingo */
    var row = d === 1 ? table.querySelector('[data-day="1"]')
      : (d >= 2 && d <= 5) ? table.querySelector('[data-day="2"]')
        : table.querySelector('[data-day="0"]');
    if (row) row.classList.add('is-today');
  }

  /* ---------- cardápio: filtro ---------- */
  function initFilters() {
    var chips = $$('.chip');
    var cards = $$('.dish');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        cards.forEach(function (card) {
          var show = f === 'todos' || card.getAttribute('data-cat') === f;
          card.hidden = !show;
          if (show) {
            card.style.animation = 'none';
            /* força reinício da animação de entrada */
            void card.offsetWidth;
            card.style.animation = '';
            card.classList.add('in');
          }
        });
      });
    });
  }

  /* ---------- carrinho ---------- */
  function renderCart() {
    var list = $('#cartItems');
    var empty = $('#cartEmpty');
    var form = $('#cartForm');
    var copy = $('#copyOrder');
    var ids = Object.keys(state.items).filter(function (k) { return state.items[k] > 0; });

    if (list) list.innerHTML = '';
    ids.forEach(function (id) {
      var item = MENU[id];
      var row = document.createElement('div');
      row.className = 'ci';

      var art = document.createElement('div');
      art.className = 'ci-art pie ' + item.art;
      art.setAttribute('aria-hidden', 'true');

      var main = document.createElement('div');
      main.className = 'ci-main';

      var name = document.createElement('strong');
      name.textContent = item.name;

      var detail = document.createElement('small');
      detail.textContent = item.detail;

      var qty = document.createElement('div');
      qty.className = 'qty';

      var minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.setAttribute('aria-label', 'Diminuir ' + item.name);
      minus.addEventListener('click', function () {
        state.items[id] -= 1;
        if (state.items[id] <= 0) delete state.items[id];
        save(); renderCart();
      });

      var num = document.createElement('span');
      num.textContent = String(state.items[id]);
      num.setAttribute('aria-label', 'Quantidade de ' + item.name);

      var plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.setAttribute('aria-label', 'Aumentar ' + item.name);
      plus.addEventListener('click', function () {
        state.items[id] = Math.min(30, (state.items[id] || 0) + 1);
        save(); renderCart();
      });

      qty.appendChild(minus); qty.appendChild(num); qty.appendChild(plus);

      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'ci-rm';
      rm.textContent = 'remover';
      rm.setAttribute('aria-label', 'Remover ' + item.name + ' do pedido');
      rm.addEventListener('click', function () {
        delete state.items[id];
        save(); renderCart(); toast(item.name + ' removido do pedido.');
      });

      main.appendChild(name);
      main.appendChild(detail);
      main.appendChild(qty);
      main.appendChild(rm);
      row.appendChild(art);
      row.appendChild(main);
      list.appendChild(row);
    });

    var total = countItems();
    if (empty) empty.hidden = total > 0;
    if (form) form.hidden = total === 0;
    if (copy) copy.disabled = total === 0 || !consentOk();

    var c1 = $('#cartCount');
    if (c1) c1.textContent = String(total);
    var label = $('#cartCountLabel');
    if (label) label.textContent = total === 0 ? 'Nenhum item no pedido' : total + (total === 1 ? ' item no pedido' : ' itens no pedido');
    var s1 = $('#summaryItems');
    if (s1) s1.textContent = total === 0 ? '0 itens' : total + (total === 1 ? ' item' : ' itens');
    var mb = $('#mbCount');
    if (mb) mb.textContent = total === 0 ? 'Pedido vazio' : total + (total === 1 ? ' item no pedido' : ' itens no pedido');
  }

  function addItem(id) {
    if (!MENU[id]) return;
    state.items[id] = Math.min(30, (state.items[id] || 0) + 1);
    save(); renderCart();
    openDrawer();
    toast(MENU[id].name + ' adicionado ao pedido.');
  }

  /* ---------- drawer acessível ---------- */
  var lastFocus = null;

  function focusables() {
    var d = $('#drawer');
    if (!d) return [];
    return $$('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])', d)
      .filter(function (el) { return el.offsetParent !== null; });
  }

  function openDrawer() {
    var d = $('#drawer'), o = $('#overlay');
    if (!d) return;
    lastFocus = document.activeElement;
    d.classList.add('open');
    d.setAttribute('aria-hidden', 'false');
    try { d.inert = false; } catch (e) {}
    if (o) { o.hidden = false; requestAnimationFrame(function () { o.classList.add('open'); }); }
    document.body.style.overflow = 'hidden';
    var mbar = $('#mobileBar');
    if (mbar) mbar.classList.remove('show');
    setTimeout(function () {
      var close = $('#closeCart');
      if (close) close.focus();
    }, 60);
  }

  function closeDrawer() {
    var d = $('#drawer'), o = $('#overlay');
    if (!d) return;
    d.classList.remove('open');
    d.setAttribute('aria-hidden', 'true');
    try { d.inert = true; } catch (e) {}
    if (o) {
      o.classList.remove('open');
      setTimeout(function () { o.hidden = true; }, 350);
    }
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initDrawer() {
    $$('[data-open-cart]').forEach(function (b) { b.addEventListener('click', openDrawer); });
    var close = $('#closeCart');
    if (close) close.addEventListener('click', closeDrawer);
    var ov = $('#overlay');
    if (ov) ov.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) {
      var d = $('#drawer');
      if (!d || !d.classList.contains('open')) return;
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key === 'Tab') {
        var f = focusables();
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    var drawerEl = $('#drawer');
    if (drawerEl) { try { drawerEl.inert = true; } catch (e) {} }

    var notes = $('#notes');
    if (notes) {
      notes.value = state.notes;
      notes.addEventListener('input', function () {
        state.notes = notes.value.slice(0, 400);
        save();
      });
    }

    function syncMode() {
      $$('input[name="mode"]').forEach(function (r) {
        var label = r.closest('label');
        if (label) label.classList.toggle('sel', r.checked);
      });
    }
    $$('input[name="mode"]').forEach(function (r) {
      r.checked = r.value === state.mode;
      r.addEventListener('change', function () {
        if (r.checked) { state.mode = r.value; save(); }
        syncMode();
      });
    });
    syncMode();

    var consent = $('#cartConsent');
    if (consent) consent.addEventListener('change', renderCart);
  }

  function consentOk() {
    var c = $('#cartConsent');
    return !!(c && c.checked);
  }

  /* ---------- copiar resumo ---------- */
  function copyText(text) {
    function legacy() {
      return new Promise(function (resolve, reject) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        var ok = false;
        try {
          ta.focus();
          ta.select();
          ok = typeof document.execCommand === 'function' && document.execCommand('copy');
        } catch (err) { ok = false; }
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('cópia bloqueada'));
      });
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        return navigator.clipboard.writeText(text).catch(legacy);
      } catch (err) { return legacy(); }
    }
    return legacy();
  }

  function initCopy() {
    var btn = $('#copyOrder');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (countItems() === 0) { toast('Adicione um sabor antes de copiar.'); return; }
      if (!consentOk()) { toast('Marque o consentimento para copiar o resumo.'); $('#cartConsent') && $('#cartConsent').focus(); return; }
      var text = summaryText();
      copyText(text).then(function () {
        toast('Resumo copiado. Cole no canal que você usa com a pizzeria.');
        btn.textContent = 'Resumo copiado ✓';
        setTimeout(function () { btn.textContent = 'Copiar resumo do pedido'; }, 2600);
      }).catch(function () {
        toast('Não foi possível copiar automaticamente. Selecione o texto do pedido e copie.');
      });
    });
  }

  /* ---------- inicialização ---------- */
  /* Um módulo com problema não pode derrubar os outros: cada passo é isolado. */
  function safe(label, fn) {
    try { fn(); } catch (err) { if (window.console && console.warn) console.warn('[napolitana] ' + label, err); }
  }

  function init() {
    load();
    safe('ano', function () {
      var y = $('#year');
      if (y) y.textContent = String(new Date().getFullYear());
    });
    safe('cabeçalho', initChrome);
    safe('reveal', initReveal);
    safe('imagens', initImages);
    safe('ticker', initTicker);
    safe('horários', initHours);
    safe('filtros', initFilters);
    safe('carrinho', initDrawer);
    safe('cópia', initCopy);
    safe('botões de adicionar', function () {
      $$('[data-add]').forEach(function (b) {
        b.addEventListener('click', function () { addItem(b.getAttribute('data-add')); });
      });
    });
    safe('render inicial', renderCart);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
