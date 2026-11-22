# Lisboncello — Pizza & Gourmet · Cascais

Site institucional e de conversão para a **Lisboncello Pizza & Gourmet**
(Tv. Navegantes 11, 2750-282 Cascais, Portugal). Arquivo único, autocontido,
sem rastreadores e sem dependências de rede.

**No ar (link partilhável, verificado):**
<https://raw.githack.com/whssz/site/site-v1/public/index.html>
— serve o arquivo único com `Content-Type: text/html`, 2 323 205 bytes,
título e imagens confirmados por pedido HTTP real. A tag `site-v1` fixa a
versão publicada; para publicar alterações: actualizar a tag
(`git tag -f site-v1 <commit> && git push -f origin refs/tags/site-v1`).

**Vercel:** o projeto Vercel
`lisboncello-cascais` (`prj_phLWzardVQsjA2J93rtcElEILdUr`) já está criado,
ligado a este repositório e configurado (`installCommand: "true"`,
`buildCommand: "true"`, `outputDirectory: "public"`). O primeiro deploy ficou
bloqueado pelo limite diário da conta Vercel Hobby
(`api-deployments-free-per-day`, 100/dia) — ver *Deploy* abaixo.

---

## O que o site faz

| Jornada | Seção | Conteúdo |
|---|---|---|
| **Entrar** | Hero | Massa napolitana, DOP, cozinha aberta, estado *aberto/fechado* calculado em `Europe/Lisbon` |
| **Entender** | `#historia` | De Nápoles (Vomero) para Cascais, limoncello artesanal, ingredientes DOP |
| **Explorar** | `#carta` | **70 itens reais em 11 categorias**, procura instantânea, filtros Chef/Vegetariano, opções reais (Calzone, Peroni, Coca-Cola, água, vinho a copo) |
| **Confiar** | `#diferenciais`, `#galeria`, `#novidades` | Diferenciais reais, 10 fotografias da casa, 3 avaliações Google verificadas, notas 4,7 / 9,6 / 4,92 e novidades publicadas no Instagram |
| **Agir** | Carrinho, `#reservas`, `#contacto`, CTA, footer | Pedido para retirada ou salão, reserva com validação por dia da semana, WhatsApp `+351 937 949 039` |

Nenhum botão é decorativo. Nada é inventado: preços, pratos, horários,
avaliações, morada e contactos vêm da carta digital oficial, do Google, do
TheFork, do Instagram e do Tripadvisor (fontes abaixo).

## Fluxo funcional

1. Carta → **Adicionar** (com opções reais) → contador no header e FAB.
2. Drawer: quantidade, remover, observações, subtotal e total em €.
3. Tipo de pedido: **retirada** ou **consumo no salão**.
4. Consentimento obrigatório (nunca pré-marcado) → **Finalizar pelo WhatsApp**
   com mensagem item a item, ou **Copiar resumo** como alternativa.
5. O site **não confirma** nada: a confirmação é humana, pela casa.
6. Reservas: dias fechados e horários inválidos são recusados antes do envio.

## Conformidade

- Política de Privacidade e Termos escritos para o que o site **realmente** faz
  (0 rastreadores → **sem banner de cookies**, só `localStorage` do carrinho).
- Consentimento explícito e não pré-marcado nos dois formulários.
- Sem NIF/razão social inventados: a pendência está declarada na política.
- WCAG AA: contraste medido, `alt` descritivo em 100% das imagens, foco visível,
  navegação por teclado (lightbox com setas e `Esc`), `prefers-reduced-motion`
  desliga todo o movimento.
- Alergénios, idade legal e retirada/no local tratados nos Termos.

## Arquitetura técnica

```
public/index.html      site completo (CSS + JS + imagens em base64)
public/assets/         originais WebP + og-lisboncello.jpg
assets/                cópia de trabalho das imagens
tools/anim-kit.css      ANIM-KIT v2 (fonte única da animação)
tools/anim-kit.js       motor de reveal, parallax e progresso
tools/inject-anim.mjs   injetor idempotente do kit
tools/inline-assets.mjs embute as imagens como data URI
tools/qa.mjs            QA de animação/layout (Playwright)
tools/qa-legal.mjs      QA legal/acessibilidade
tools/browser.mjs       Chromium headless (local ou @sparticuz)
tests/flow.mjs          teste funcional ponta a ponta
vercel.json             outputDirectory "public" + headers
```

### Comandos

```bash
npm install                  # playwright, @sparticuz/chromium, sharp
npm run dev                  # servidor local em :3000
node tools/inject-anim.mjs public/index.html --refresh   # re-injetar o kit
node tools/inline-assets.mjs public/index.html           # re-embutir imagens
npm run qa                   # animação + layout (390/768/1440)
npm run qa:legal             # conformidade e contraste
npm run test:flow            # fluxo funcional real
```

## Resultados de QA

```
QA · public/index.html
viewport   h-scroll  loop   keyframes  revela   erros
desktop    0px       35     12         34/34    0
tablet     0px       35     12         34/34    0
mobile     0px       28     11         34/34    0
reduced-motion: desliga tudo ✓                        → PASS

QA LEGAL (--strict)                                    → PASSOU
imagens 28 · sem alt 0 · contraste OK · teclado OK
consentimento obrigatório · 0 trackers · 0 banner extra

tests/flow.mjs                                         → PASSOU 35/35
```

## Mídia — origem e aplicação

Todas as fotografias são da própria Lisboncello.

| Arquivo | Origem | Onde aparece |
|---|---|---|
| `pasta-puttanesca-salao.webp` | Galeria oficial TheFork (`07a6beaa…`) | Hero, carta (Pasta), galeria, novidades |
| `interior-salao.webp` | Galeria oficial TheFork | Hero, galeria |
| `fachada-vespa.webp` | Foto real da fachada (Tv. Navegantes 11) | Hero, galeria |
| `salao-cozinha-aberta.webp` | Foto real do salão/cozinha | Galeria (destaque) |
| `interior-detalhes-vesuvio.webp` | Foto real do interior | História, galeria, novidades |
| `antipasto-misto.webp` | Galeria oficial TheFork | Carta, galeria |
| `bruschettone-burrata.webp` | Galeria oficial TheFork | Carta, galeria, novidades |
| `bruschetta-pomodoro.webp` | Galeria oficial TheFork | Carta, galeria |
| `involtini-antipasti.webp` | Galeria oficial TheFork | Carta, galeria |
| `formaggi-verdure.webp` | Galeria oficial TheFork | Carta (Margherita, Ortolana) |
| `spaghetti-pomodoro.webp` | Galeria oficial TheFork | Carta, galeria |

`public/assets/og-lisboncello.jpg` — cartão social 1200×630 montado com uma
fotografia real da casa.

**Limitações declaradas:** o Instagram bloqueia o download dos binários
(apenas legendas e datas são públicas) e o Google Maps só expõe a galeria via
TheFork. Não há vídeo binário acessível — por isso não há vídeo no site. Nenhuma
imagem de banco, IA ou ilustração foi usada como se fosse da casa.

## Pendências que dependem do cliente

1. **Logotipo oficial** — não foi disponibilizado um arquivo de logo; o símbolo
   atual é tipográfico (monograma “L”).
2. **NIF / razão social** — não publicados por não terem sido fornecidos
   (bloco ausente de propósito, nunca preenchido com exemplo).
3. **Autoria das fotografias do espaço** (fachada, salão, interior) —
   confirmar se são do proprietário para uso comercial irrestrito.
4. **Alergénios** — os textos dos pratos são os da carta oficial; a informação
   legal de alergénios por prato deve ser validada pela casa.
5. **“MA CHE BUONO”** — a expressão citada no briefing não aparece em nenhuma
   fonte pública da Lisboncello; não foi inventada uma relação. Se for um
   projeto/segunda marca, é preciso confirmar.

## Deploy

O site é estático e não precisa de build. Três caminhos, todos já preparados:

0. **Link imediato (activo hoje)** — `raw.githack.com` sobre a tag `site-v1`
   (ver topo). É o endereço a partilhar enquanto a Vercel estiver bloqueada.
   É servido por CDN, a partir deste repositório público — nada a instalar.
1. **Painel Vercel** — projeto `lisboncello-cascais` → *Deployments* → **Redeploy**
   (ou *Trigger Deploy* escolhendo a branch `arena/153289a3-site`). Quando o
   limite diário da conta reiniciar, o deploy passa sem alterações.
2. **Push na branch de produção** — mesclar `arena/153289a3-site` na `main`
   dispara o deploy de produção automaticamente (o projeto está ligado ao repo
   `whssz/site`, `productionBranch: main`).
3. **CLI** — `npx vercel --prod` na raiz do projeto (usa o `vercel.json`).

O `vercel.json` já define `outputDirectory` implícito por `public`, `cleanUrls`,
`trailingSlash: false` e os cabeçalhos de segurança.

### Estado do deploy (18/11)

| Via | Estado | Nota |
|---|---|---|
| githack (tag `site-v1`) | ✅ **verificado** (HTTP 200, `text/html`, 2,32 MB) | link partilhável imediato |
| Vercel | ⛔ 402 `api-deployments-free-per-day` | conta Hobby passou das 100 implantações/24 h; resolve em ≤24 h |
| GitHub Pages | ⛔ 403 | a app GitHub desta sessão não tem permissão de *admin* para mudar a origem (Pages publica `main`/ raiz — hoje com um site antigo) |
| Preview desta sessão | ✅ `:3000` (só enquanto a sessão durar) | não é um URL público permanente |

Para o Pages servir este site: *Settings → Pages* → origem Branch **`arena/153289a3-site`**, pasta **`/public`**
(o ficheiro `.nojekyll` já está em `public/` para o Jekyll não interferir).

## Fontes verificadas

- Carta digital oficial: `leggimenu.it/menu/lisboncello` (11 categorias, preços)
- Google Maps: 4,7/5 · 326 avaliações · horários · morada · telefone
- TheFork: 9,6/10 · 115 avaliações · dono/chef Vittorio · fotos oficiais · €15 médio
- LeggiMenu: 4,92/5 · 154 avaliações
- Instagram `@lisboncello_portugal` e Facebook: bio, e-mail, pratos publicados
- Tripadvisor: e-mail, telefone, ~12 lugares, cozinha napolitana de Vomero
