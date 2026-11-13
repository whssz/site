# GUIA DE ESTILO — padrão de todos os novos sites

> **Este documento é a fonte da verdade visual e estrutural do estúdio.**
> Derivado do portfólio (`portfolio/index.html`), que é a peça de referência.
> Última atualização: 07/11/2026

---

## 0. Regra de ouro

O portfólio define **como** um site é construído — estrutura, movimento, ritmo, acabamento.
Ele **não** define **com que cara** cada site nasce: cor, tipografia e clima vêm sempre da
identidade do cliente.

Isso não é preferência estética, é consequência de duas regras que você já fixou:

- *"a identidade visual fornecida é referência principal, não criar identidade nova"*
- *"não inventar nada"*

Se todo site nascer preto-e-dourado, a Migaica vira lilás-no-preto, a doceria vira barbearia,
e o cliente recebe o seu estilo em vez do estilo dele. O que se repete é o **rigor**, não a paleta.

| Reaproveitar sempre | Reaproveitar nunca (nasce do cliente) |
|---|---|
| Arquitetura das seções (ENTRAR → ENTENDER → EXPLORAR → CONFIAR → AGIR) | Cores |
| Vocabulário de animação e as curvas de easing | Família tipográfica |
| Escala de espaçamento e respiro | Tom de voz e vocabulário |
| Padrões de componente (card, marquee, stats, steps, quotes) | Fotos e mídia |
| Nível de polimento: grão, blur, hover, microinterações | Nível de formalidade |

---

## 1. Fundação técnica (não negociável)

| Item | Padrão |
|---|---|
| Entrega | **HTML único autossuficiente** — CSS e JS inline, imagens/vídeos/fontes em base64 |
| Peso | até ~3 MB (Migaica: 2,4 MB); preview instantâneo, sem requisição externa |
| Grid | `.wrap` = máx. `1200px`, padding lateral `24px` |
| Breakpoints | `980` · `900` · `880` · `860` · `700` · `620` · `600` · `560` · `520` |
| Mobile | mobile-first na prática: todo layout em coluna única abaixo de 620px |
| Overflow | `body{overflow-x:hidden}` + nenhuma largura fixa em px que estoure |
| Acessibilidade | contraste AA, foco visível, `prefers-reduced-motion` respeitado |
| Motion | só `transform` e `opacity` (60fps); nada de animar `width`/`top`/`filter` em loop |

---

## 2. Tokens base (`:root`) — a trocar por cliente

Estes são os tokens do portfólio. Em cada site novo, **reescreve-se apenas este bloco**;
todo o resto do CSS herda dele — **inclusive a camada de animação**, que desde a v2 é
tokenizada (`tools/anim-kit.css`).

**Ordem de resolução do acento na camada animada:**
`--accent` → `--magenta` → `--gold` → `#C9A46A`
Ou seja: defina **um** desses e fundo, partículas, pontes, fio e microinterações seguem a
identidade automaticamente. Nunca há cor fixa no kit.

```css
:root{
  /* cor */
  --ink:#0B0A08;        /* fundo escuro principal */
  --ink-2:#12100C;      /* fundo de seção alternada */
  --ink-3:#191612;      /* fundo de card / hover */
  --cream:#F4ECDE;      /* texto claro */
  --gold:#C9A46A;       /* acento / destaque */
  --gold-2:#E7CB96;     /* acento hover / texto sobre escuro */
  --line:rgba(244,236,222,.13);
  --muted:rgba(244,236,222,.56);
  /* tipo */
  --sans:"Helvetica Neue",Helvetica,Arial,sans-serif;
  --serif:Georgia,"Times New Roman",serif;   /* papel de "voz autoral" */
  /* movimento */
  --ease:cubic-bezier(.16,.72,.28,1);
}
```

**Composição que funciona (2 + 1):** um escuro profundo, um neutro claro de texto e **um único
acento**. Nunca três acentos competindo. Se o cliente traz 5 cores, elege-se uma para acento e as
outras viram variações de estado.

**Sobre as fontes:** por padrão uso stacks de sistema, porque carregam instantâneo e nunca quebram.
Quando a identidade pede letra própria, embutir o `.woff2` em base64 (licença livre — foi o caso da
Dancing Script na Migaica, OFL).

---

## 3. Escala tipográfica

| Papel | Tamanho | Detalhe |
|---|---|---|
| `h1` hero | `clamp(44px, 8.6vw, 108px)` | `line-height:.92`, `letter-spacing:-.045em`, `font-weight:800`, uppercase |
| `h2` seção | `clamp(30px, 5.2vw, 56px)` | `line-height:1.02`, `-.04em`, uppercase, `max-width:20ch` |
| `h3` card | `~19px` | `weight:700`, `-.02em` |
| corpo | `16px` / `1.6` | ⚠️ 15,5–16,5px; nunca 14px em parágrafo longo |
| corpo secundário | `13,5–14,5px` | cor `--muted` |
| kicker / label | `10,5px` | `letter-spacing:.26em`, uppercase — o "sussurro" que dá sofisticação |
| nota | `11px` | rodapés, legendas |

**O truque da casa:** títulos em sans pesada e uppercase, com **uma palavra (ou expressão) em
serifada itálica no acento** — `h1 em`, `h2 em`. É isso que separa "site bonito" de "site com
assinatura". Ver `<em>design</em>`, `<em>sob medida</em>`.

**Ritmo de seção:** `padding: 88px 0 44px` no cabeçalho de seção; seções nunca encostam.

---

## 4. Arquitetura padrão (ordem que funciona)

```
HEADER fixo (blur ao rolar)
  ↓
HERO — headline curta e enorme + foto/asset forte + 2 CTAs
  ↓
MARQUEE — faixa em loop infinito com os nichos/palavras-chave
  ↓
STATS — 3 a 4 números reais (nunca inventados)
  ↓
O QUE FAÇO / CATÁLOGO — grid de cards com tag e hover
  ↓
PROVA — "no ar agora", avaliações reais, selos
  ↓
PROCESSO — 3 a 4 passos numerados
  ↓
SOBRE — foto/retrato + texto em primeira pessoa
  ↓
DEPOIMENTOS — 3 quotes reais com nome
  ↓
CTA FINAL — repetição do convite, centralizada, com glow
  ↓
FOOTER — contato, links, copyright
```

Em site de cliente, a mesma espinha vira **ENTRAR → ENTENDER → EXPLORAR → CONFIRMAR → AGIR**.
Nunca menos de 4 grandes seções. Nunca uma seção que exista só para preencher.

---

## 5. Vocabulário de movimento (obrigatório em todo site)

**12 keyframes, 29 animações em loop rodando ao mesmo tempo** (medido no QA). Todo site novo
precisa de pelo menos duas em loop perpétuo durante toda a navegação.

### 5.1 Catálogo por tipo de movimento

Os dez tipos que o padrão exige, cada um com sua técnica e onde vive:

| Tipo | Keyframe / técnica | Onde aparece | Duração |
|---|---|---|---|
| **Floating** | `float1`/`float2`/`float3` — `translateY` + rotação fixa | hero: mídia empilhada | 9s / 11s / 13s |
| **Iluminação** | `glow` — `scale` + `opacity` em `radial-gradient` | hero, CTA e as 3 seções-ponte | 15s / 17s / 19s / 22s / 26s |
| **Gradiente** | `aurora` — camada `inset:-40%` com 3 radiais + `translate3d`/`scale` | fundo fixo do site inteiro | 26s alternate |
| **Textura** | `gridDrift` — grade de 72px em `translate3d`, com `mask-image` radial | fundo fixo | 32s (perfeito loop) |
| **Partículas** | `mote` — 12 pontos de luz subindo e sumindo | fundo fixo | 16–28s, delays negativos |
| **Parallax** | JS `rAF` + `data-par` → `translate3d` por velocidade | sobre, provas, CTA, hero | scroll |
| **Escala suave** | `rv-scale` — `scale(.945) → 1` | depoimentos | 1s |
| **Deslocamento lento** | `threadFlow` (luz escorrendo), `slide` (marquee) | fio vertical, faixa de nichos | 9s / 34s |
| **Formas orgânicas** | `morph1`/`morph2` — `border-radius` morfando + rotação | 3 blobs do fundo | 23s / 29s / 37s |
| **Movimento de imagem** | `scale(1.055)` no hover + parallax da própria imagem | cards e linhas "no ar" | .95s / scroll |

Extras que o padrão também entrega: `pulse` (indicador ao vivo), `rv-clip` (título revelado por
`clip-path`), `rv-fade`, `rv-left`, `rv-right`, varredura de luz no botão, brilho varrendo o card
e barra de progresso de leitura.

### 5.2 Fundo contextual animado (item 6 do script)

Camada fixa `.bg` atrás de todo o conteúdo, `pointer-events:none`, montada com quatro estratos:
aurora (luz), três blobs orgânicos (matéria), grade em deriva (o universo do design) e partículas.
Tudo **abstrato** — nada de objeto literal gigante. É o que faz a página nunca ficar parada,
mesmo quando o usuário está lendo um parágrafo.

### 5.3 Continuidade (item 7 do script)

- `.thread`: fio vertical fixo com uma luz escorrendo, à esquerda (≥1340px).
- `#projetos::before`, `#processo::before`, `#sobre::before`: glows ancorados **na fronteira**
  das seções, atravessando o limite com `top`/`bottom` negativos.
- `overflow-x:clip` nessas seções mantém o glow atravessando na vertical sem gerar
  scroll horizontal.
- Parallax em velocidades diferentes: cada bloco anda em ritmo próprio, então as seções
  nunca "descolam" em bloco.

**Regras de movimento:**
- Durações **ímpares e desencontradas** (9s / 11s / 13s) — nunca todas iguais, senão "pulsa em bloco".
- `--ease: cubic-bezier(.16,.72,.28,1)` em tudo — é a curva que dá o ar caro (entra rápido, assenta devagar).
- Stagger nos grids: `transition-delay = (i % colunas) * 90ms`.
- Hover de card: `translateY(-7px)` + borda acento + imagem `scale(1.055)` + seta girando `-45deg`.
- Link de nav: sublinhado que cresce da esquerda (`width:0 → 100%`).
- Grão: `body::after` com `feTurbulence` em `opacity:.035`, `pointer-events:none` — é o que tira o "plástico" do digital.
- **Nunca** animar `background-position`, `width`, `top` ou `filter` em loop — só `transform`/`opacity`.
- Durações sempre **desencontradas** (9/11/13/15/17/19/22/23/26/29/32/34/37s) para o conjunto
  respirar em vez de pulsar em bloco.
- **Sempre** o bloco final:

```css
@media(prefers-reduced-motion:reduce){
  .rev{opacity:1;transform:none}
  .marquee-track,.stack figure{animation:none}
  html{scroll-behavior:auto}
}
```

### O JS inteiro do portfólio — 12 linhas
```js
const hdr=document.getElementById('hdr');
addEventListener('scroll',()=>hdr.classList.toggle('stuck',scrollY>40),{passive:true});

const io=new IntersectionObserver(es=>{
  es.forEach((e,i)=>{ if(e.isIntersecting){ io.unobserve(e.target);
    setTimeout(()=>e.target.classList.add('in'), Math.min(i*70,350)); }});
},{threshold:.12,rootMargin:'0px 0px -8% 0px'});
document.querySelectorAll('.rev').forEach(el=>io.observe(el));

document.querySelectorAll('.grid-proj .card').forEach((c,i)=>c.style.transitionDelay=(i%3)*90+'ms');
```

---

## 6. Componentes canônicos

Todos já existem em `base/skeleton.html`, prontos para copiar:

- **`.btn`** — pílula `radius:100px`, `padding:13px 24px`, uppercase `11,5px`, `letter-spacing:.14em`, hover `translateY(-2px)`. Variantes `.btn-gold` (sólido) e `.btn-ghost` (borda).
- **`.kicker`** / **`.sec-label`** — traço curto + texto espaçado. Marca o início de cada seção.
- **`.card`** — raio `16px`, borda `--line`, `aspect-ratio:4/5` no `.shot`, `object-fit:cover`, tag em pílula com `backdrop-filter`, gradiente de base para o texto respirar, `.arrow` circular que gira no hover.
- **`.marquee`** — borda em cima e embaixo, fundo `--ink-2`, itens serifados em `opacity:.42` separados por `✦`.
- **`.stats`** — 4 colunas divididas por linhas de 1px (não por gaps), número grande com o sinal em acento.
- **`.steps`** — 4 passos com linha superior que **se desenha** no hover (`width:0 → 100%`).
- **`.quote`** — aspa serifada gigante em `opacity:.6`, autor com avatar-inicial.
- **`.live-row`** — lista de projetos no ar com thumb `96px`, hover tingido de acento.
- **`.rev`** — a classe que revela.

---

## 7. Copy — como se escreve

- Frase curta. Ponto final. Nada de "soluções inovadoras e personalizadas".
- Concreto vence abstrato: *"+1.000 fatias/mês"* > *"muito reconhecido"*.
- Números só se forem reais e verificáveis. Sem número? Use o fato, não invente a estatística.
- Segunda pessoa ("você") no site do cliente; primeira pessoa ("eu") no portfólio.
- Sem emoji na interface (vira tofu em renderizador headless — aprendido na Migaica).
- Voz ativa, verbo no presente.

---

## 8. Checklist de aceite (o mesmo do portfólio)

- [ ] 1 arquivo, zero dependência externa, abre offline
- [ ] ≥ 4 grandes seções na espinha ENTRAR→AGIR
- [ ] ≥ 2 animações em loop perpétuo rodando o tempo todo
- [ ] fundo contextual animado (gradiente/grão/blob — nunca objeto literal gigante)
- [ ] fundo contextual animado com ≥ 3 estratos (luz, forma, textura/partículas)
- [ ] reveal + parallax + scale + clip em pontos diferentes da página — não tudo igual
- [ ] elementos atravessando fronteiras de seção (continuidade)
- [ ] microinteração em **todo** botão, card e link
- [ ] 0 scroll horizontal em 390 / 768 / 1440
- [ ] `prefers-reduced-motion` desliga tudo
- [ ] contraste AA verificado nos textos sobre imagem
- [ ] nada inventado: preço, produto, número, depoimento, endereço, horário
- [ ] todo botão leva a algum lugar real
- [ ] `<title>`, `description`, `og:` preenchidos
- [ ] **`node tools/qa.mjs <arquivo>` retorna PASS** (obrigatório, não negociável)
- [ ] **`node tools/qa-legal.mjs <arquivo>` sem item bloqueante** (conformidade/LGPD/WCAG)
- [ ] Política de Privacidade, Termos e consentimento aplicados **conforme o nicho** (ver `CONFORMIDADE-E-LEGAL.md`)
- [ ] HTTP 200 público verificado antes de entregar o link

---

## 9. Mapa do estúdio

| Ativo | Papel |
|---|---|
| `portfolio/index.html` | **peça de referência** — o padrão em estado puro |
| `base/skeleton.html` | ponto de partida de todo site novo (tokens + componentes + motion) |
| `GUIA-DE-ESTILO.md` | este documento |
| `DEPLOY.md` | como publicar na Vercel e entregar o link |
| `tools/inject-anim.mjs` | **injetor oficial** — põe a camada em qualquer HTML, marca as seções-ponte, detecta o acento |
| `tools/anim-kit.css` · `tools/anim-kit.js` | fonte única da camada (tokenizada). Editar aqui, nunca dentro do site |
| `tools/setup.sh` | instala o navegador do QA (1× por sessão) |
| `portfolio/anim_layer.py` | versão v1, legada — mantida só como registro histórico |
| `tools/qa.mjs` | portão de qualidade: navegador real, 3 viewports, reduzido-motion, exit 1 em falha |
| `tools/qa-legal.mjs` | portão de conformidade: alt, contraste, teclado, consentimento, dado fictício, cookies |
| `CONFORMIDADE-E-LEGAL.md` | termos, privacidade, cookies, LGPD, CDC, WCAG — com matriz por nicho |
| `base/legal-snippets.html` | blocos legais prontos e funcionais (cookies, consentimento, privacidade) |
| `portfolio/qa-*.png` · `base/qa-*.png` | evidência visual do QA em 1440 / 768 / 390 |
| `migaica/` | primeiro site com identidade **de cliente** aplicada sobre este padrão |

**Fluxo de um site novo:**
1. Coletar a identidade real do cliente (logo, cores, fotos, dados verificáveis).
2. Copiar `base/skeleton.html` → `novo-site/index.html`.
3. Reescrever **só o `:root`** com a identidade dele + trocar fontes.
4. Arquitetar as seções pelo nicho (nem todo nicho tem "cardápio": barbearia tem agendamento).
5. Conteúdo real — o que não existe, não entra.
6. `node tools/inject-anim.mjs <arquivo>` → QA em 390/768/1440 → publicar na Vercel →
   validar 200 → entregar link.

---

## 10. QA medido — portfólio e esqueleto (10/11/2026)

Chromium headless, 1440 / 768 / 390, com e sem `prefers-reduced-motion`.

| Métrica | Portfólio | Esqueleto | Critério |
|---|---|---|---|
| Scroll horizontal | 1440 / 768 / 390 = exato | 1440 / 390 = exato | zero |
| Animações em loop perpétuo | 29 / 29 / 22 | 25 / 18 | ≥ 2 |
| Keyframes distintos | 12 | 12 | ≥ 5 |
| Elementos que nunca revelam | 0 | 0 | 0 |
| Erros de JS | 0 | 0 | 0 |
| `reduced-motion` | 0 animação, 0 elemento oculto | 0 / 0 | desliga tudo |

### Três bugs encontrados pelo QA (e a lição de cada um)

1. **`clip-path:inset(0 100% 0 0)` zera a área visual do elemento** → o IntersectionObserver
   nunca considera visível e o título fica invisível para sempre. Solução: observar o
   **container** do elemento, não o elemento recortado.
2. **`prefers-reduced-motion` com especificidade perdida**: `.stack .s1` (2 classes) vence
   `.stack figure` (1 classe + tag) — os floats continuavam rodando. Solução: alvos específicos
   (`.stack .s1,.s2,.s3`) + `!important`.
3. **Glow com `right:-150px` gerava 150px de scroll horizontal** (docW 1590 em tela de 1440).
   Solução: `overflow-x:clip; overflow-y:visible` — corta na horizontal e mantém o atravessamento
   vertical. Bônus: `min-width:0` nos filhos de grid e `overflow-wrap:break-word` em títulos,
   porque palavra longa de cliente estoura coluna de grid.
