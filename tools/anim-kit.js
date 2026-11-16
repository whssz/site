/* ============================================================
   ANIM-KIT v2 — motor de movimento
   Header · barra de progresso · reveal variado · parallax
   Tudo em transform/opacity. Respeita prefers-reduced-motion.
   Injetado por: node tools/inject-anim.mjs
   ============================================================ */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var isMobile = matchMedia('(max-width:760px)').matches;

  /* ---- header com blur ao rolar + progresso de leitura ---- */
  var hdr = document.getElementById('hdr');
  var bar = document.getElementById('bar');
  var lastY = -1;

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (y === lastY) return;
    lastY = y;
    if (hdr) hdr.classList.toggle('stuck', y > 40);
    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- variedade de entrada por família de elemento ----
     Cada seletor recebe uma pose diferente. Só é aplicado se o
     elemento existir: funciona em qualquer arquitetura.        */
  var VARIANTS = [
    ['.sec-head h2', 'rv-clip'],
    ['.sec-head .sec-label', 'rv-fade'],
    ['.sec-note', 'rv-fade'],
    ['.stats .stat', 'rv-fade', 90],
    ['.grid-serv .serv', 'rv-fade', 80],
    ['.steps .step', 'rv-left', 90],
    ['.quotes .quote', 'rv-scale', 110],
    ['.about-photo', 'rv-left'],
    ['.about-body', 'rv-right'],
    ['.live-row', 'rv-fade', 70]
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
  document.querySelectorAll('.grid-proj .card').forEach(function (c, i) {
    c.style.transitionDelay = (i % 3) * 90 + 'ms';
  });

  /* ---- parallax ---- */
  if (!reduce) {
    var items = [];
    function add(sel, speed) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.dataset.par = speed; items.push(el);
      });
    }
    add('.about-photo', -0.06);
    add('.live-row img', 0.04);
    add('.cta h2', 0.05);
    add('.services .serv', 0.02);

    var stack = document.querySelector('.stack');
    var ticking = false;

    function frame() {
      var vh = innerHeight;
      if (stack) {
        var y = Math.min(window.pageYOffset || 0, 800);
        stack.style.transform = 'translate3d(0,' + (y * 0.06) + 'px,0)';
      }
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var center = r.top + r.height / 2;
        var delta = (center - vh / 2) / vh;
        var s = parseFloat(el.dataset.par) * 100 * delta;
        el.style.transform = 'translate3d(0,' + s.toFixed(2) + 'px,0)';
      });
      ticking = false;
    }
    addEventListener('scroll', function () {
      if (!ticking && !isMobile) { ticking = true; requestAnimationFrame(frame); }
    }, { passive: true });
    if (!isMobile) frame();
  }
})();
