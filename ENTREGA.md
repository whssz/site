# Entrega — Pizzeria Napolitana (v2, projeto novo)

## O que mudou nesta versão

O site foi **reescrito do zero** em `src/` e reconstruído em `public/index.html`.
A versão anterior misturava conteúdo de um arquivo só com patches de animação injetados;
agora a fonte é separada (HTML, CSS, JS) e o build gera o arquivo único publicado.

**Bug real encontrado e corrigido:** na versão anterior, a função do menu de navegação
era chamada antes de suas variáveis existirem. O erro interrompia a inicialização e deixava
o restante dos módulos sem rodar (por isso a página podia parecer “morta”).
Agora cada módulo é inicializado isoladamente — se um falhar, os outros continuam.

## Mídia real utilizada

| Mídia | Origem | Aplicação | Situação |
|---|---|---|---|
| Foto 1 `…AABkmLfn…=w408-h306-k-no` | Galeria pública do Google Maps da pizzaria | Hero (disco) e galeria | URL remota; se o Google bloquear, aparece a ilustração de reserva |
| Foto 2 `…AABkmLd5…=w360-h480-k-no` | Galeria pública do Google Maps | Galeria | idem |
| Mapa `maps.google.com/…&output=embed` | Google Maps, endereço verificado | Seção Contato | apenas o mapa do endereço |
| Mascote (fatia de pizza com chapéu) | SVG autoral criado para este projeto | header, hero, estados vazios, rodapé | ilustração declarada como ilustração, não como foto |

Não foi usada nenhuma imagem de banco, IA generativa, repost ou cliente.
As imagens do Instagram não puderam ser baixadas (o sandbox não alcança os servidores do
Google/Instagram); por isso não há vídeo nem galeria do Instagram no site.

## Dados verificados publicados

Nome, endereço (`Calle Dr. Severo Ochoa, 1 · 13160 Torralba de Calatrava · Ciudad Real`),
telefone (`+34 627 66 10 61`), horários (seg. fechado; ter–sex 19:00–00:00; sáb–dom 19:30–00:00),
nota 4,8 com 85 avaliações, Instagram `@pzzerianapolitana8`, “para levar / retirada no Mercado
Municipal” e a Salchipizza com seus ingredientes.

## O que continua “a confirmar” (e por quê)

Preços, promoções, combos, cardápio completo, WhatsApp oficial e dados fiscais não aparecem
em nenhum canal oficial consultado — então não foram inventados. O resumo do pedido sai com
“Total: a confirmar pela pizzeria”.

## Fluxo funcional

Cardápio com filtros → adicionar ao pedido → drawer acessível (foco preso, Esc, `inert`) →
quantidade +/− e remover → modalidade → observações → consentimento obrigatório →
copiar resumo → ligar. Pedido persistido em `localStorage`. Nenhum botão decorativo,
nenhuma confirmação falsa, nenhum pagamento.

## QA

- `node tools/qa.mjs public/index.html` → **PASS (estático)**: 13 keyframes, 16 animações
  infinitas, fundo contextual animado (aurora, blobs, grid, partículas), reveal via
  `IntersectionObserver`, `prefers-reduced-motion` neutralizando movimento, barra de progresso.
- `node tools/qa-legal.mjs public/index.html` → **PASS (estático)**: `lang`, `title`,
  3/3 imagens com `alt`, sem dado fictício, Privacidade e Termos, consentimento não pré-marcado,
  nenhum rastreador.
- `node tools/test-flow.mjs public/index.html` → **38/38 PASS** em jsdom: estrutura, ids únicos,
  carrinho, quantidades, remoção, filtro, consentimento, texto copiado, persistência,
  fechar por botão/overlay/Esc, ausência de WhatsApp inventado e de “pedido confirmado”.
- **Limite honesto:** não há navegador real neste sandbox (faltam bibliotecas do sistema e a
  rede bloqueia o download do Chromium). Logo, medições de layout/scroll horizontal em pixel
  não foram feitas aqui — apenas QA de fonte e de DOM.

## Publicação

**De deploy verificado e público:**

- **https://pizzeria-napolitana-site.vercel.app** → HTTP 200, conteúdo servido anonimamente
  (validado por busca HTTP sem credenciais: título, hero, cardápio, galeria, contato e legal).
- Projeto Vercel `pizzeria-napolitana-site` (`prj_MQOeVurq4NfGaxYP5tnLB2fKBq2g`),
  root `public`, sem framework, build `echo`, output `public`.
- Deploy de produção `dpl_4ASa4xqMcx2Kg1Ayhous6zTosKH3`, commit `eaf5018`, estado **READY / PROMOTED**.

### O que estava errado antes

1. **Bug de inicialização no site antigo** (corrigido na reescrita): o script do cabeçalho chamava
   uma função antes das variáveis do menu existirem, lançava exceção e abortava o restante da
   inicialização — carrinho, filtros e revelações não ligavam.
2. **Link de deployment protegido**: as URLs `*.vercel.app` *específicas de deployment*
   (ex.: `…-otgw0cb6i-whsszxx-9424.vercel.app` e o alias de branch) respondem com a tela
   “Log in to Vercel”, porque a conta tem Deployment Protection
   (`ssoProtection: all_except_custom_domains`). O **domínio de produção**
   `pizzeria-napolitana-site.vercel.app` é o link correto para compartilhar.
   Para liberar também previews: Settings → Deployment Protection → Vercel Authentication → Disabled.

Projetos criados nos testes de deploy: `napolitana-torralba`, `napolitana-torralba-site`,
`napolitana-site` (vazios ou apenas experimentos; podem ser apagados).
