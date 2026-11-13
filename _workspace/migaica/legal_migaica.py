#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MÓDULO LEGAL — MIGAICA
Aplica o CONFORMIDADE-E-LEGAL.md no site da Migaica:

  1. Termos de Uso e Política de Privacidade (conteúdo real do que o site faz)
  2. Consentimento no formulário, bloqueando o envio do pedido
  3. Identificação do fornecedor (razão social e endereço reais; CNPJ PENDENTE)
  4. Correção de contraste WCAG AA nos acentos usados como texto
  5. Foco visível garantido
  6. Estrelas de avaliação marcadas como decorativas (o número está em texto)

NÃO cria banner de cookies: o site não instala rastreador nenhum.
Aplicar em template.html, depois: python3 build.py
"""
import re, pathlib, sys

MARK = "MIGA-LEGAL v1"

CSS = r"""
/* ============================================================
   """ + MARK + r""" — conformidade, privacidade e acessibilidade
   Base: CONFORMIDADE-E-LEGAL.md
   ============================================================ */

/* ---------- 1. CONTRASTE WCAG AA nos acentos usados como TEXTO ----------
   Os tokens originais (--lilac-deep #A96FCE = 3.46:1 e --magenta #E000A5 = 4.46:1
   sobre branco) servem para FORMA, não para texto pequeno. Aqui entram versões
   mais escuras, só onde o acento é palavra. A identidade não muda de cor:
   muda de tom onde é preciso ler.                                       */
:root{
  --lilac-text:#8A52BC;      /* 5.2:1 sobre branco */
  --magenta-text:#D1009A;    /* 4.9:1 sobre branco */
}
.eyebrow,.marquee-track span,.doce-tag,.passo-num,.stat b,
h2 em,.mobile-menu a span{color:var(--lilac-text)}
.sec-label,h1 em,.cart-empty a{color:var(--magenta-text)}
.btn-magenta{background:var(--magenta-text)}
.fc-dot{color:var(--magenta-text)}
/* estrelas: ícone decorativo — o número da nota está sempre em texto ao lado */
.stars{color:#C97F00}
/* textos brancos translúcidos no rodapé: eram 45%, viram 60% */
.copy span,.foot-grid p,.foot-col h5{opacity:1}
footer .copy span{color:rgba(255,255,255,.72)}

/* ---------- 2. FOCO VISÍVEL ---------- */
a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,
select:focus-visible,label:focus-within,[tabindex]:focus-visible{
  outline:3px solid var(--magenta-text)!important;outline-offset:3px;border-radius:8px;
}

/* ---------- 3. CONSENTIMENTO NO FORMULÁRIO ---------- */
.consent-row{
  display:flex;gap:10px;align-items:flex-start;margin-top:14px;
  font-size:13px;line-height:1.55;color:var(--ink-soft);
}
.consent-row input{
  width:18px;height:18px;flex:none;margin-top:2px;accent-color:var(--magenta-text);cursor:pointer;
}
.consent-row label{cursor:pointer}
.consent-row a{color:var(--magenta-text);text-decoration:underline;font-weight:600}
.consent-erro{display:none;color:#B00020;font-size:12.5px;font-weight:600;margin-top:6px}
.consent-erro.show{display:block}

/* ---------- 4. SEÇÕES LEGAIS ---------- */
.legal-sec{padding:64px 0 48px;border-top:1px solid var(--line);background:rgba(255,255,255,.55)}
.legal-sec h2{font-size:clamp(24px,3.4vw,36px);margin-bottom:18px}
.legal-sec h3{font-size:16px;margin:22px 0 6px;color:var(--ink)}
.legal-sec p,.legal-sec li{font-size:14.5px;line-height:1.7;color:var(--ink-soft);max-width:70ch}
.legal-sec ul{margin:6px 0 0 20px}
.legal-id{
  margin-top:12px;font-size:12.5px;line-height:1.7;color:var(--ink-soft);
}
.legal-wrap{display:grid;gap:28px}
@media(min-width:960px){.legal-wrap{grid-template-columns:1fr 1fr;gap:48px}}
"""

CONSENT = """
          <div class="form-row consent-row" id="rowConsent">
            <input type="checkbox" id="consent" name="consent">
            <label for="consent">Li e concordo com o tratamento dos meus dados conforme a
              <a href="#privacidade">Política de Privacidade</a>.</label>
          </div>
          <p class="consent-erro" id="consentErro">Marque o consentimento para enviar o pedido.</p>
"""

LEGAL = """
<!-- ============ PRIVACIDADE E TERMOS ============ -->
<section class="legal-sec" id="privacidade">
  <div class="wrap">
    <div class="sec-label">Privacidade</div>
    <h2>Política de <em>Privacidade</em></h2>
    <div class="legal-wrap">
      <div>
        <h3>1. Quais dados coletamos</h3>
        <p>Apenas o que você digita no formulário de pedido: <strong>nome</strong>,
        <strong>endereço de entrega</strong> e, se quiser, <strong>observações</strong>
        (personalização, ponto de referência). Não pedimos CPF, data de nascimento nem
        qualquer dado financeiro.</p>

        <h3>2. Como usamos seus dados</h3>
        <p>Exclusivamente para montar e enviar o seu pedido ao nosso atendimento pelo
        WhatsApp. O site <strong>não armazena</strong> esses dados em servidor: eles saem
        do seu navegador direto para a conversa no WhatsApp.</p>

        <h3>3. Compartilhamento</h3>
        <p>Não vendemos, alugamos nem cedemos seus dados. O pedido é transmitido ao nosso
        WhatsApp para ser atendido.</p>
      </div>
      <div>
        <h3>4. Cookies</h3>
        <p>Este site <strong>não utiliza cookies de rastreamento</strong> nem ferramentas de
        análise ou publicidade. Por isso não existe banner de cookies.</p>

        <h3>5. Seus direitos</h3>
        <p>Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento,
        conforme a LGPD (Lei 13.709/2018). Basta falar com a gente pelo WhatsApp
        <a href="https://wa.me/5521995592625" target="_blank" rel="noopener">(21) 99559-2625</a>.</p>

        <h3>6. Identificação</h3>
        <p class="legal-id">
          Migaica Doceria Artesanal LTDA<br>
          Av. Prefeito Milton Rodrigues da Rocha, 200 — Novo Horizonte, Itaboraí/RJ · 24800-001<br>
          Contato: WhatsApp (21) 99559-2625
        </p>
      </div>
    </div>
  </div>
</section>

<section class="legal-sec" id="termos">
  <div class="wrap">
    <div class="sec-label">Termos</div>
    <h2>Termos de <em>Uso</em></h2>
    <div class="legal-wrap">
      <div>
        <h3>1. O que este site oferece</h3>
        <p>Apresentamos nossos doces e permitimos montar o pedido escolhendo os itens.
        O site é uma vitrine com montagem de pedido; ele não processa pagamento.</p>

        <h3>2. Como o pedido é finalizado</h3>
        <p>Ao tocar em <strong>Finalizar pedido pelo WhatsApp</strong>, o resumo é enviado ao
        nosso atendimento. O pedido só é considerado confirmado depois que a nossa equipe
        responde no WhatsApp — o site não confirma pedido automaticamente.</p>

        <h3>3. Preços e disponibilidade</h3>
        <p>Os valores não são divulgados neste site. Preço, prazo e taxa de entrega são
        informados e confirmados no atendimento, conforme os itens e a personalização.</p>
      </div>
      <div>
        <h3>4. Entrega e retirada</h3>
        <p>Atendemos em Itaboraí e região. Horários, área de entrega e prazo são confirmados
        no atendimento pelo WhatsApp.</p>

        <h3>5. Devolução e arrependimento</h3>
        <p>Por se tratar de alimento perecível, qualquer problema de qualidade deve ser
        informado no momento do recebimento ou pelo WhatsApp, para análise e solução.
        Em compras feitas fora do estabelecimento, aplica-se o direito de arrependimento
        previsto no art. 49 do Código de Defesa do Consumidor.</p>

        <h3>6. Uso do site</h3>
        <p>As fotos e os textos são da Migaica Doceria Artesanal. É proibido reproduzir o
        conteúdo sem autorização.</p>
      </div>
    </div>
  </div>
</section>
"""

JS = r"""
/* ============================================================
   MIGA-LEGAL v1 — consentimento e acessibilidade
   ============================================================ */
(function(){
  /* consentimento: bloqueia o envio ANTES de qualquer outro handler */
  var btn = document.getElementById('btnEnviar');
  var box = document.getElementById('consent');
  var erro = document.getElementById('consentErro');

  if (btn && box){
    btn.addEventListener('click', function(e){
      if (box.checked) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (erro) erro.classList.add('show');
      box.focus();
    }, true);

    box.addEventListener('change', function(){
      if (box.checked && erro) erro.classList.remove('show');
    });
  }

  /* estrelas são decoração: a nota está sempre escrita em texto ao lado */
  document.querySelectorAll('.stars').forEach(function(s){
    s.setAttribute('aria-hidden', 'true');
  });
})();
"""

FOOT_LINKS_ANCHOR = '<a href="#local">Onde estamos</a>'
FOOT_LINKS_NEW = '''<a href="#local">Onde estamos</a>
        <a href="#privacidade">Política de Privacidade</a>
        <a href="#termos">Termos de Uso</a>'''

FORM_ANCHOR = '''          <div class="form-row">
            <label for="obs">Observações (opcional)</label>'''
FORM_NEW = '''          <div class="form-row">
            <label for="obs">Observações (opcional)</label>'''

LEGAL_ANCHOR = '<!-- barra mobile -->'


def patch(path):
    p = pathlib.Path(path)
    src = p.read_text(encoding='utf-8')
    if MARK in src:
        print(f"· {p.name}: já aplicado")
        return

    # 1. CSS
    i = src.rfind('</style>')
    assert i > 0
    src = src[:i] + CSS + src[i:]

    # 2. consentimento no formulário (depois do campo de observações)
    m = re.search(r'(<div class="form-row">\s*<label for="obs">Observações \(opcional\)</label>.*?</div>)', src, re.S)
    assert m, 'não achei o campo de observações'
    src = src[:m.end()] + CONSENT + src[m.end():]

    # 3. seções legais antes da barra mobile
    j = src.find(LEGAL_ANCHOR)
    assert j > 0, 'não achei a barra mobile'
    src = src[:j] + LEGAL + '\n' + src[j:]

    # 4. links no rodapé
    assert FOOT_LINKS_ANCHOR in src, 'não achei o link do rodapé'
    src = src.replace(FOOT_LINKS_ANCHOR, FOOT_LINKS_NEW, 1)

    # 5. JS antes de </body>
    k = src.rfind('</body>')
    assert k > 0
    src = src[:k] + '<script>' + JS + '</script>\n' + src[k:]

    p.write_text(src, encoding='utf-8')
    print(f"✓ {p.name}: {len(src.encode()):,} bytes")

if __name__ == '__main__':
    for f in (sys.argv[1:] or ['template.html']):
        patch(f)
