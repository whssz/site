/* ============================================================
   ANIM-KIT v2 — motor de movimento
   Header · barra de progresso · reveal variado · parallax
   Tudo em transform/opacity. Respeita prefers-reduced-motion.
   Injetado por: node tools/inject-anim.mjs
   ============================================================ */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion:reduce)');
  var isMobile = matchMedia('(max-width:760px)');
  var root = document.documentElement;

  /* ---- header com blur ao rolar + progresso de leitura ---- */
  var hdr = document.getElementById('hdr');
  var bar = document.getElementById('bar');

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (hdr) hdr.classList.toggle('stuck', y > 40);
    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    }
  }
  var scrolling = false;
  addEventListener('scroll', function () {
    if (!scrolling) { scrolling = true; requestAnimationFrame(function () { onScroll(); scrolling = false; }); }
  }, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();
  if (!('IntersectionObserver' in window)) return;
  root.classList.add('motion-ready');

  /* ---- variedade de entrada por família de elemento ----
     Cada seletor recebe uma pose diferente. Só é aplicado se o
     elemento existir: funciona em qualquer arquitetura.        */
  var VARIANTS = [
    ['.sec-head h2', 'rv-clip'],
    ['.sec-head .sec-label', 'rv-fade'],
    ['.sec-note', 'rv-fade'],
    ['.about-photo', 'rv-left'],
    ['.about-body', 'rv-right']
  ];
  VARIANTS.forEach(function (item) {
    var sel = item[0], cls = item[1], stagger = item[2];
    document.querySelectorAll(sel).forEach(function (el, i) {
      if (!el.classList.contains(cls)) el.classList.add(cls);
      if (stagger) el.style.transitionDelay = (i % 4) * stagger + 'ms';
    });
  });

  /* ---- reveal unificado ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e, i) {
      if (!e.isIntersecting) return;
      var el = e.target;
      io.unobserve(el);
      setTimeout(function () { el.classList.add('in'); }, Math.min(i * 70, 350));
    });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.rev,.rv-fade,.rv-scale,.rv-left,.rv-right')
    .forEach(function (el) { io.observe(el); });

  /* clip-path zera a área visual do elemento e o IntersectionObserver
     nunca o considera visível — então observamos o container, que não
     é recortado, e revelamos o filho junto.                        */
  var ioClip = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      ioClip.unobserve(e.target);
      setTimeout(function () {
        e.target.querySelectorAll('.rv-clip').forEach(function (k) { k.classList.add('in'); });
        if (e.target.classList && e.target.classList.contains('rv-clip')) e.target.classList.add('in');
      }, 120);
    });
  }, { threshold: .05, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('.rv-clip').forEach(function (el) {
    var host = el.parentElement || el;
    if (!host.dataset.clipHost) { host.dataset.clipHost = '1'; ioClip.observe(host); }
  });

  /* stagger por posição em grids de 3 colunas */
  document.querySelectorAll('.gallery-grid .card').forEach(function (c, i) {
    c.style.transitionDelay = (i % 3) * 90 + 'ms';
  });

  /* ---- parallax: o enquadramento fica fixo, o grafismo interior desliza ---- */
  var items = Array.from(document.querySelectorAll('[data-par]'));
  var ticking = false;
  function frame() {
    ticking = false;
    if (isMobile.matches || reduce.matches || root.classList.contains('motion-paused')) return;
    var vh = innerHeight;
    var values = items.map(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      return r.bottom < -160 || r.top > vh + 160 ? null : (r.top + r.height / 2 - vh / 2) / vh * 100 * Number(el.dataset.par);
    });
    items.forEach(function (el, i) { if (values[i] !== null) el.style.translate = '0 ' + values[i].toFixed(2) + 'px'; });
  }
  function schedule() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('brutta:motion', schedule);
  schedule();
})();
