# ⚠ LEGADO — NÃO USE ESTE ARQUIVO EM PROJETO NOVO.
#
# A camada que ele aplica tem DOIS defeitos que impediam a animação de
# aparecer em projeto novo:
#   1. cores fixas (rgba(201,164,106,...) dourado, rgba(11,10,8,...) fundo):
#      em site de outra marca o fundo animado saía na cor errada;
#   2. glows ancorados em #projetos / #processo / #sobre / .live-row /
#      .grid-serv / .serv — seletores que NÃO existem no esqueleto, ou seja:
#      CSS presente, animação morta.
#
# Use o injetor oficial, que é tokenizado e marca as seções sozinho:
#     node tools/inject-anim.mjs <arquivo.html>
# Fonte da camada: tools/anim-kit.css + tools/anim-kit.js
#
# ---------------------------------------------------------------------------
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ANIM LAYER v1 — injeta a camada completa de animação no portfólio.
Idempotente: se já existir, não duplica (use --force para substituir).

Aplica em: portfolio/index.html e portfolio/template.html
Uso: python3 anim_layer.py [arquivo...]
"""
import re, sys, pathlib

MARK = "ANIM-LAYER v1"

CSS = r"""
/* ============================================================
   """ + MARK + r""" — camada de animação
   Contínua (loop infinito) · fundo contextual · scroll variado ·
   microinterações · continuidade entre seções.
   Padrão do estúdio: ver GUIA-DE-ESTILO.md
   ============================================================ */


/* ---------- 0. REDE DE SEGURANÇA DE LAYOUT ----------
   Palavra longa de cliente e grid com min-width:auto são as duas
   causas clássicas de scroll horizontal. Ficam neutralizadas aqui.  */
h1,h2,h3,.card h3,.quote p{overflow-wrap:break-word}
.hero-grid>*,.about>*,.grid-proj>*,.steps>*,.quotes>*,.stats>*{min-width:0}

/* empilhamento: fundo atrás, conteúdo na frente */
body>*:not(.bg):not(.thread):not(.bar){position:relative;z-index:1}
section>.wrap{position:relative;z-index:1}

/* ---------- 1. FUNDO CONTEXTUAL ANIMADO ----------
   Abstrato + elegante: luz, geometria e grão em movimento lento.
   Nada de objeto literal — a referência é o universo do design
   (grade, luz de tela, matéria orgânica).                          */
.bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}

.bg-aurora{
  position:absolute;inset:-40%;
  background:
    radial-gradient(38% 42% at 22% 18%,rgba(201,164,106,.14),transparent 70%),
    radial-gradient(34% 40% at 82% 30%,rgba(231,203,150,.10),transparent 70%),
    radial-gradient(46% 50% at 60% 95%,rgba(201,164,106,.08),transparent 72%);
  animation:aurora 26s ease-in-out infinite alternate;
  will-change:transform,opacity;
}
@keyframes aurora{
  0%{transform:translate3d(0,0,0) scale(1);opacity:.8}
  50%{transform:translate3d(-3%,2.5%,0) scale(1.09);opacity:1}
  100%{transform:translate3d(2%,-2%,0) scale(1.03);opacity:.88}
}

.bg-blob{
  position:absolute;
  background:radial-gradient(circle at 35% 30%,rgba(201,164,106,.17),rgba(201,164,106,0) 68%);
  will-change:transform,border-radius;
}
.bg-blob.b1{width:46vw;height:46vw;left:-12vw;top:4vh;animation:morph1 23s ease-in-out infinite}
.bg-blob.b2{width:38vw;height:38vw;right:-10vw;top:36vh;animation:morph2 29s ease-in-out infinite}
.bg-blob.b3{width:52vw;height:52vw;left:32vw;bottom:-20vh;opacity:.65;animation:morph1 37s ease-in-out infinite reverse}
@keyframes morph1{
  0%,100%{transform:translate3d(0,0,0) rotate(0deg) scale(1);border-radius:58% 42% 46% 54%/52% 46% 54% 48%}
  33%{transform:translate3d(4%,-3%,0) rotate(9deg) scale(1.07);border-radius:44% 56% 62% 38%/46% 58% 42% 54%}
  66%{transform:translate3d(-3%,4%,0) rotate(-7deg) scale(.96);border-radius:62% 38% 40% 60%/56% 42% 58% 44%}
}
@keyframes morph2{
  0%,100%{transform:translate3d(0,0,0) rotate(0deg) scale(1);border-radius:46% 54% 60% 40%/58% 42% 58% 42%}
  40%{transform:translate3d(-5%,3%,0) rotate(-10deg) scale(1.1);border-radius:60% 40% 44% 56%/42% 56% 44% 58%}
  75%{transform:translate3d(3%,-4%,0) rotate(6deg) scale(.94);border-radius:40% 60% 52% 48%/52% 48% 52% 48%}
}

/* grade em deslocamento perpétuo — o "grid" do mundo do design */
.bg-grid{
  position:absolute;width:200%;height:200%;left:-50%;top:-50%;
  background-image:
    linear-gradient(to right,rgba(244,236,222,.05) 1px,transparent 1px),
    linear-gradient(to bottom,rgba(244,236,222,.05) 1px,transparent 1px);
  background-size:72px 72px;
  animation:gridDrift 32s linear infinite;
  opacity:.55;
  -webkit-mask-image:radial-gradient(62% 58% at 50% 42%,#000 18%,transparent 76%);
  mask-image:radial-gradient(62% 58% at 50% 42%,#000 18%,transparent 76%);
}
@keyframes gridDrift{to{transform:translate3d(-72px,-72px,0)}}

/* partículas de luz (motes) subindo devagar */
.motes i{
  position:absolute;width:3px;height:3px;border-radius:50%;
  background:var(--gold-2);opacity:0;
  animation:mote 17s linear infinite;
  will-change:transform,opacity;
}
@keyframes mote{
  0%{transform:translate3d(0,24px,0) scale(.6);opacity:0}
  12%{opacity:.6}
  70%{opacity:.35}
  100%{transform:translate3d(16px,-150px,0) scale(1);opacity:0}
}
.motes i:nth-child(1){left:6%;top:72%;animation-duration:19s;animation-delay:0s}
.motes i:nth-child(2){left:15%;top:44%;animation-duration:23s;animation-delay:-3s}
.motes i:nth-child(3){left:24%;top:86%;animation-duration:16s;animation-delay:-7s}
.motes i:nth-child(4){left:33%;top:30%;animation-duration:26s;animation-delay:-11s}
.motes i:nth-child(5){left:42%;top:64%;animation-duration:21s;animation-delay:-2s}
.motes i:nth-child(6){left:51%;top:18%;animation-duration:18s;animation-delay:-9s}
.motes i:nth-child(7){left:60%;top:78%;animation-duration:24s;animation-delay:-5s}
.motes i:nth-child(8){left:69%;top:40%;animation-duration:20s;animation-delay:-13s}
.motes i:nth-child(9){left:78%;top:92%;animation-duration:28s;animation-delay:-4s}
.motes i:nth-child(10){left:86%;top:26%;animation-duration:22s;animation-delay:-8s}
.motes i:nth-child(11){left:93%;top:58%;animation-duration:17s;animation-delay:-15s}
.motes i:nth-child(12){left:47%;top:94%;animation-duration:25s;animation-delay:-6s}

/* fio condutor vertical + luz que escorre (continuidade visual) */
.thread{
  position:fixed;left:30px;top:0;bottom:0;width:1px;z-index:1;pointer-events:none;
  background:linear-gradient(to bottom,transparent,rgba(201,164,106,.26) 18%,rgba(201,164,106,.26) 82%,transparent);
  opacity:0;transition:opacity .8s var(--ease);
}
.thread::after{
  content:"";position:absolute;left:-1px;width:3px;height:130px;border-radius:2px;
  background:linear-gradient(to bottom,transparent,var(--gold),transparent);
  animation:threadFlow 9s linear infinite;
}
@keyframes threadFlow{0%{top:-150px}100%{top:100%}}
@media(min-width:1340px){.thread{opacity:1}}

/* barra de progresso de leitura */
.bar{
  position:fixed;top:0;left:0;height:2px;width:100%;z-index:9999;pointer-events:none;
  background:linear-gradient(90deg,var(--gold),var(--gold-2));
  transform:scaleX(0);transform-origin:0 50%;opacity:.9;
}

/* ---------- 2. ANIMAÇÃO CONTÍNUA NOS GLOWS EXISTENTES ---------- */
.hero::before{animation:glow 15s ease-in-out infinite}
.hero::after{animation:glow 19s ease-in-out infinite reverse}
@keyframes glow{
  0%,100%{transform:scale(1);opacity:.85}
  50%{transform:scale(1.12);opacity:1}
}
.cta::before{animation:glow 17s ease-in-out infinite}

/* ---------- 3. CONTINUIDADE ENTRE SEÇÕES ----------
   Formas que atravessam a fronteira das seções, para a página
   ler como um ambiente único e não como blocos empilhados.      */
#projetos::before,#processo::before,#sobre::before{
  content:"";position:absolute;pointer-events:none;z-index:0;border-radius:50%;
  background:radial-gradient(circle,rgba(201,164,106,.11),transparent 68%);
}
#projetos::before{width:440px;height:440px;right:-150px;top:-190px;animation:glow 18s ease-in-out infinite}
#processo::before{width:340px;height:340px;left:-170px;bottom:-150px;animation:glow 22s ease-in-out infinite reverse}
#sobre::before{width:400px;height:400px;left:46%;top:-210px;animation:glow 26s ease-in-out infinite}
/* overflow-x:clip contém o glow na horizontal e ainda deixa ele
   atravessar a fronteira na vertical (overflow-y continua visível) */
#projetos,#processo,#sobre{overflow-x:clip;overflow-y:visible}

/* ---------- 4. SCROLL VARIADO ----------
   Cada família de elemento entra de um jeito diferente.         */
.rv-fade{opacity:0;transition:opacity 1.1s var(--ease)}
.rv-scale{opacity:0;transform:scale(.945);transition:opacity 1s var(--ease),transform 1s var(--ease)}
.rv-left{opacity:0;transform:translateX(-36px);transition:opacity .95s var(--ease),transform .95s var(--ease)}
.rv-right{opacity:0;transform:translateX(36px);transition:opacity .95s var(--ease),transform .95s var(--ease)}
/* no mobile o elemento ocupa a largura toda: deslocar no eixo X geraria
   scroll horizontal antes do reveal. Ali a entrada é vertical.            */
@media(max-width:760px){
  .rv-left,.rv-right{transform:translateY(22px)}
}
.rv-clip{clip-path:inset(0 100% 0 0);transition:clip-path 1.15s var(--ease)}
.rv-fade.in,.rv-scale.in,.rv-left.in,.rv-right.in{opacity:1;transform:none}
.rv-clip.in{clip-path:inset(0 0 0 0)}

/* ---------- 5. MICROINTERAÇÕES ---------- */
/* brilho que varre o botão no hover */
.btn{position:relative;overflow:hidden}
.btn::before{
  content:"";position:absolute;top:0;bottom:0;left:-60%;width:45%;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.45),transparent);
  transform:translateX(-160%) skewX(-18deg);transition:transform .85s var(--ease);
  pointer-events:none;
}
.btn:hover::before{transform:translateX(420%) skewX(-18deg)}

/* varredura de luz nos cards */
.card::after{
  content:"";position:absolute;inset:0;z-index:3;pointer-events:none;
  background:linear-gradient(115deg,transparent 32%,rgba(244,236,222,.10) 48%,transparent 64%);
  transform:translateX(-120%);transition:transform .95s var(--ease);
}
.card:hover::after{transform:translateX(120%)}

/* seta das linhas "no ar" desliza */
.live-row .go svg{transition:transform .4s var(--ease)}
.live-row:hover .go svg{transform:translate(3px,-3px)}

/* foco visível (acessibilidade) */
a:focus-visible,button:focus-visible,.card:focus-visible{
  outline:2px solid var(--gold);outline-offset:3px;border-radius:8px;
}

/* ---------- 6. MOBILE: reduz densidade, mantém o movimento ---------- */
@media(max-width:760px){
  .bg-blob{opacity:.55}
  .bg-grid{opacity:.35}
  .motes i:nth-child(n+7){display:none}
  .thread{display:none}
}

/* ---------- 7. ACESSIBILIDADE ---------- */
@media(prefers-reduced-motion:reduce){
  .bg-aurora,.bg-blob,.bg-grid,.motes i,.thread::after,
  .hero::before,.hero::after,.cta::before,
  #projetos::before,#processo::before,#sobre::before{animation:none!important}
  .motes{display:none}
  .rv-fade,.rv-scale,.rv-left,.rv-right{opacity:1!important;transform:none!important}
  .rv-clip{clip-path:none!important}
  .card::after,.btn::before{display:none}
  /* regra universal: qualquer animação ou transição que tenha escapado
     dos seletores nominais é neutralizada aqui */
  *,*::before,*::after{
    animation-duration:.001ms!important;
    animation-iteration-count:1!important;
    transition-duration:.001ms!important;
  }
  .rev{opacity:1;transform:none}
  /* .stack .s1 (2 classes) vence .stack figure — por isso !important aqui */
  .marquee-track,.stack .s1,.stack .s2,.stack .s3,.pulse{animation:none!important}
  html{scroll-behavior:auto}
}
"""

MARKUP = """
<!-- ============ FUNDO CONTEXTUAL ANIMADO ============ -->
<div class="bg" aria-hidden="true">
  <div class="bg-aurora"></div>
  <div class="bg-blob b1"></div>
  <div class="bg-blob b2"></div>
  <div class="bg-blob b3"></div>
  <div class="bg-grid"></div>
  <div class="motes"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
</div>
<div class="thread" aria-hidden="true"></div>
<div class="bar" id="bar" aria-hidden="true"></div>
"""

JS = r"""
/* ============================================================
   MOTION — header · progresso · reveal variado · parallax
   Tudo em transform/opacity. Respeita prefers-reduced-motion.
   ============================================================ */
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const isMobile = matchMedia('(max-width:760px)').matches;

/* header com blur ao rolar + barra de progresso */
const hdr = document.getElementById('hdr');
const bar = document.getElementById('bar');
let lastY = -1;
function onScroll(){
  const y = window.scrollY;
  if (y === lastY) return;
  lastY = y;
  if (hdr) hdr.classList.toggle('stuck', y > 40);
  if (bar){
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
  }
}
addEventListener('scroll', onScroll, {passive:true});
onScroll();

/* ---- variedade de entrada por família de elemento ---- */
const VARIANTS = [
  ['.sec-head h2',        'rv-clip'],
  ['.sec-head .sec-label','rv-fade'],
  ['.sec-note',           'rv-fade'],
  ['.stats .stat',        'rv-fade', 90],
  ['.grid-serv .serv',    'rv-fade', 80],
  ['.steps .step',        'rv-left', 90],
  ['.quotes .quote',      'rv-scale', 110],
  ['.about-photo',        'rv-left'],
  ['.about-body',         'rv-right'],
  ['.live-row',           'rv-fade', 70]
];
VARIANTS.forEach(([sel, cls, stagger]) => {
  document.querySelectorAll(sel).forEach((el, i) => {
    if (!el.classList.contains(cls)) el.classList.add(cls);
    if (stagger) el.style.transitionDelay = (i % 4) * stagger + 'ms';
  });
});

/* ---- reveal unificado ---- */
const io = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    io.unobserve(el);
    setTimeout(() => el.classList.add('in'), Math.min(i * 70, 350));
  });
}, {threshold:.12, rootMargin:'0px 0px -8% 0px'});

document.querySelectorAll('.rev,.rv-fade,.rv-scale,.rv-left,.rv-right')
  .forEach(el => io.observe(el));

/* clip-path:inset(0 100% 0 0) zera a área visual do elemento e o
   IntersectionObserver nunca o considera visível — então observamos o
   container dele, que não é recortado, e revelamos o filho junto.        */
const ioClip = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    ioClip.unobserve(e.target);
    setTimeout(() => {
      e.target.querySelectorAll('.rv-clip').forEach(k => k.classList.add('in'));
      if (e.target.classList && e.target.classList.contains('rv-clip')) e.target.classList.add('in');
    }, 120);
  });
}, {threshold:.05, rootMargin:'0px 0px -6% 0px'});
document.querySelectorAll('.rv-clip').forEach(el => {
  const host = el.parentElement || el;
  if (!host.dataset.clipHost){ host.dataset.clipHost = '1'; ioClip.observe(host); }
});

/* stagger por posição no grid (3 colunas) */
document.querySelectorAll('.grid-proj .card').forEach((c,i)=>c.style.transitionDelay=(i%3)*90+'ms');

/* ---- parallax ---- */
if (!reduce){
  const items = [];
  const add = (sel, speed) => document.querySelectorAll(sel).forEach(el => {
    el.dataset.par = speed; items.push(el);
  });
  add('.about-photo', -0.06);
  add('.live-row img', 0.04);
  add('.cta h2', 0.05);
  add('.services .serv', 0.02);

  const stack = document.querySelector('.stack');
  let ticking = false;

  function frame(){
    const vh = innerHeight;
    /* hero */
    if (stack){
      const y = Math.min(window.scrollY, 800);
      stack.style.transform = 'translate3d(0,' + (y * 0.06) + 'px,0)';
    }
    /* elementos com data-par */
    items.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const center = r.top + r.height / 2;
      const delta = (center - vh / 2) / vh;
      const s = parseFloat(el.dataset.par) * 100 * delta;
      el.style.transform = 'translate3d(0,' + s.toFixed(2) + 'px,0)';
    });
    ticking = false;
  }
  addEventListener('scroll', () => {
    if (!ticking && !isMobile){ ticking = true; requestAnimationFrame(frame); }
  }, {passive:true});
  if (!isMobile) frame();
}
"""

def patch(path: pathlib.Path, force=False):
    src = path.read_text(encoding='utf-8')
    if MARK in src and not force:
        print(f"· {path.name}: já tem a camada, pulando")
        return False

    # limpa versão anterior
    if MARK in src and force:
        src = re.sub(r'\n?/\* =+\n\s*ANIM-LAYER v1.*?</style>', '\n</style>', src, flags=re.S)
        src = re.sub(r'\n?<!-- ============ FUNDO CONTEXTUAL ANIMADO ============ -->.*?<div class="bar" id="bar" aria-hidden="true"></div>\n', '\n', src, flags=re.S)
        src = re.sub(r'<script>.*?</script>', '<script>/* JS */</script>', src, flags=re.S)

    # 1. CSS antes do </style>
    i = src.rfind('</style>')
    assert i > 0, 'sem </style>'
    src = src[:i] + CSS + src[i:]

    # 2. markup logo após <body>
    j = src.find('<body>')
    assert j > 0, 'sem <body>'
    j += len('<body>')
    src = src[:j] + MARKUP + src[j:]

    # 3. JS
    n = len(re.findall(r'<script>.*?</script>', src, flags=re.S))
    assert n == 1, f'esperava 1 bloco <script>, achei {n}'
    src = re.sub(r'<script>.*?</script>', '<script>' + JS + '</script>', src, flags=re.S)

    path.write_text(src, encoding='utf-8')
    print(f"✓ {path.name}: {len(src.encode()):,} bytes")
    return True

if __name__ == '__main__':
    files = sys.argv[1:] or ['index.html', 'template.html']
    force = '--force' in files
    files = [f for f in files if not f.startswith('--')]
    base = pathlib.Path(__file__).parent
    for f in files:
        patch(base / f, force=force)

def refresh_css(files=None, base=None):
    """Reaplica só o bloco de CSS marcado, preservando markup e JS já injetados."""
    base = base or pathlib.Path(__file__).parent
    for f in (files or ['index.html', 'template.html']):
        p = base / f
        src = p.read_text(encoding='utf-8')
        if MARK not in src:
            print(f"· {f}: sem camada, use patch()")
            continue
        src = re.sub(r'/\* =+\n\s*ANIM-LAYER v1.*?(?=</style>)', CSS.lstrip('\n'), src, flags=re.S)
        p.write_text(src, encoding='utf-8')
        print(f"✓ {f}: CSS atualizado ({len(src.encode()):,} bytes)")
