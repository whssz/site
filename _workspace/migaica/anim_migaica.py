#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ANIM LAYER — MIGAICA
A Migaica já tem camada própria (blobs, anéis, partículas em canvas, floaty,
ping, marquee, parallax). Este script NÃO duplica nada: adiciona apenas o que
faltava para cumprir o item 5-9 do script universal:

  1. textura (grão)
  2. variedade de pose no reveal — cada família entra de um jeito
  3. microinterações premium (brilho varrendo botão e card)
  4. continuidade entre seções (glows na fronteira)
  5. barra de progresso de leitura
  6. prefers-reduced-motion cobrindo TODO o movimento (antes só blobs e anéis)

Idempotente. Aplicar em template.html, depois: python3 build.py
"""
import re, pathlib, sys

MARK = "MIGA-ANIM v1"

CSS = r"""
/* ============================================================
   """ + MARK + r""" — complemento de movimento
   Não substitui nada do que já existe: soma textura, variedade de
   reveal, microinterações e continuidade entre seções.
   ============================================================ */

/* ---------- 1. TEXTURA: grão sobre a página ---------- */
body::after{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:9998;opacity:.028;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ---------- 2. VARIEDADE NO REVEAL ----------
   O mecanismo continua o mesmo (.rev → .in, IntersectionObserver que já
   existe). Aqui só muda a POSE DE PARTIDA de cada família, para a página
   não entrar toda do mesmo jeito.                                     */
.sec-head.rev{transform:translateY(22px) scale(.985)}
.filters.rev{transform:translateY(14px)}
.doce-note.rev{transform:translateY(16px)}
.exp-media.rev{transform:scale(.955)}
.exp-copy.rev{transform:translateX(22px)}
.quotes.rev{transform:scale(.96)}
.gallery.rev{transform:scale(.975)}
.pedido-shell.rev{transform:translateY(34px)}
.map-card.rev{transform:translateX(20px)}
.doce.rev{transform:translateY(24px) scale(.98)}

/* no mobile, deslocar no eixo X estoura a largura: entrada vertical */
@media(max-width:760px){
  .exp-copy.rev{transform:translateY(20px)}
  .map-card.rev{transform:translateY(20px)}
}

/* ---------- 3. CONTINUIDADE ENTRE SEÇÕES ----------
   Glows ancorados na fronteira dos blocos, atravessando o limite.
   overflow-x:clip corta na horizontal sem matar o atravessamento vertical. */
.sec,#local{position:relative}
#doces::before,#experiencia::before,#pedido::before{
  content:"";position:absolute;pointer-events:none;z-index:0;border-radius:50%;
  background:radial-gradient(circle,rgba(224,0,165,.10),rgba(213,177,233,.06) 45%,transparent 70%);
}
#doces::before{width:520px;height:520px;right:-170px;top:-210px;animation:glowM 19s ease-in-out infinite}
#experiencia::before{width:420px;height:420px;left:-190px;bottom:-170px;animation:glowM 23s ease-in-out infinite reverse}
#pedido::before{width:480px;height:480px;left:44%;top:-230px;animation:glowM 27s ease-in-out infinite}
#doces,#experiencia,#pedido{overflow-x:clip;overflow-y:visible}
.sec>.wrap{position:relative;z-index:1}
@keyframes glowM{
  0%,100%{transform:scale(1);opacity:.75}
  50%{transform:scale(1.14);opacity:1}
}

/* ---------- 4. MICROINTERAÇÕES ---------- */
/* brilho que varre o botão */
.btn{position:relative;overflow:hidden;isolation:isolate}
.btn::before{
  content:"";position:absolute;top:0;bottom:0;left:-60%;width:45%;z-index:-1;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);
  transform:translateX(-160%) skewX(-18deg);
  transition:transform .85s var(--ease);
}
.btn:hover::before{transform:translateX(420%) skewX(-18deg)}

/* varredura de luz no card de doce */
.doce::after{
  content:"";position:absolute;inset:0;z-index:4;pointer-events:none;border-radius:inherit;
  background:linear-gradient(115deg,transparent 34%,rgba(255,255,255,.42) 50%,transparent 66%);
  transform:translateX(-125%);transition:transform .95s var(--ease);
}
.doce:hover::after{transform:translateX(125%)}

/* seta dos botões desliza junto com o brilho */
.btn svg{transition:transform .4s var(--ease)}
.btn:hover svg{transform:translateX(3px)}

/* foco visível consistente */
a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{
  outline:2px solid var(--magenta);outline-offset:3px;
}

/* ---------- 5. BARRA DE PROGRESSO ---------- */
.bar{
  position:fixed;top:0;left:0;height:3px;width:100%;z-index:9999;pointer-events:none;
  background:linear-gradient(90deg,var(--magenta),var(--lilac-deep) 55%,var(--lilac));
  transform:scaleX(0);transform-origin:0 50%;opacity:.95;
}

/* ---------- 6. ACESSIBILIDADE: parar TUDO ----------
   Antes, só .bg-blob e .ring-bg paravam; floaty, marquee, ping,
   pulseRing e o pino do mapa continuavam rodando.                      */
@media(prefers-reduced-motion:reduce){
  /* regra universal: qualquer animação ou transição que tenha escapado
     dos seletores nominais é neutralizada aqui */
  *,*::before,*::after{
    animation-duration:.001ms!important;
    animation-iteration-count:1!important;
    transition-duration:.001ms!important;
  }
  .btn::before,.doce::after{display:none!important}
  .rev{opacity:1!important;transform:none!important;transition:none!important}
  html{scroll-behavior:auto!important}
}
"""

MARKUP = '<div class="bar" id="bar" aria-hidden="true"></div>\n'

JS = r"""
/* ============================================================
   MIGA-ANIM v1 — barra de progresso de leitura
   (o resto do movimento em scroll já é tratado pelo script da página)
   ============================================================ */
(function(){
  var bar = document.getElementById('bar');
  if (!bar) return;
  var last = -1, raf = null;
  function update(){
    raf = null;
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (y === last) return;
    last = y;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
  }
  window.addEventListener('scroll', function(){
    if (raf === null) raf = requestAnimationFrame(update);
  }, {passive:true});
  window.addEventListener('resize', update, {passive:true});
  update();
})();
"""

def patch(path):
    p = pathlib.Path(path)
    src = p.read_text(encoding='utf-8')
    if MARK in src:
        print(f"· {p.name}: já aplicado")
        return
    # CSS
    i = src.rfind('</style>')
    assert i > 0, 'sem </style>'
    src = src[:i] + CSS + src[i:]
    # markup
    j = src.find('<body>')
    assert j > 0, 'sem <body>'
    j += len('<body>')
    src = src[:j] + '\n' + MARKUP + src[j:]
    # JS: bloco novo antes de </body>, sem tocar no script existente
    k = src.rfind('</body>')
    assert k > 0, 'sem </body>'
    src = src[:k] + '<script>' + JS + '</script>\n' + src[k:]
    p.write_text(src, encoding='utf-8')
    print(f"✓ {p.name}: {len(src.encode()):,} bytes")

if __name__ == '__main__':
    for f in (sys.argv[1:] or ['template.html']):
        patch(f)
