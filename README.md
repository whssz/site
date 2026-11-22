# Trattoria Pizzeria Nello's — site

Site da **Trattoria Pizzeria Nello's** (C. San Federico, 52 · 11100 San Fernando, Cádiz · España), em espanhol.
Carta completa com preços, busca e filtros, montagem de pedido com resumo e confirmação por telefone,
horário ao vivo (hora de Cádiz), galeria de fotos reais, avaliações públicas e textos legais (RGPD/LOPDGDD/LSSI-CE).

A entrega é **um único `public/index.html` autossuficiente**: CSS e JS inline, fontes e fotos em base64,
zero requisição externa, zero cookie, zero rastreador.

## Comandos

```sh
npm ci              # instala só as ferramentas de QA (Playwright + Chromium + axe-core)
npm run build       # src/ → public/index.html (+ camada ANIM-KIT v2 injetada)
npm run dev         # build + pré-visualização em http://localhost:4173
npm test            # build + qa.mjs + qa-legal.mjs --strict + qa-nellos.mjs (E2E)
```

O build usa apenas Node (sem dependências). Na Vercel: `buildCommand: node tools/build.mjs`, saída `public/`.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/index.html` | Estrutura semântica de todas as seções, gaveta do pedido, galeria e textos legais |
| `src/styles.css` | Identidade (azul do letreiro + verde/branco/vermelho + preto), componentes e movimento próprio |
| `src/app.js` | Carta (busca/filtros), pedido, consentimento, resumo, horário ao vivo, galeria, menu móvel, pausa de animações |
| `src/carta.json` | **Fonte única** da carta (60 pratos com preço), notas do dia, contatos, links e horário |
| `src/media.json` | Fotos usadas: arquivo, dimensões, `alt`, legenda e origem |
| `src/assets/` | Fotos WebP (+ miniaturas 176 px) e fontes woff2 com licenças OFL |
| `tools/build.mjs` | Monta o HTML único (base64, carta, galeria, JSON-LD) e roda o injetor de animação |
| `tools/anim-kit.*`, `tools/inject-anim.mjs` | Camada ANIM-KIT v2 do estúdio (fundo, keyframes, reveal, parallax) |
| `tools/qa.mjs`, `tools/qa-legal.mjs` | Portões do estúdio (animação/layout e conformidade/WCAG) |
| `tools/qa-nellos.mjs` | E2E do fluxo real de pedido + axe-core WCAG 2.1 AA + modo sem JavaScript |
| `public/` | Saída publicada (`index.html`, `og-nellos.jpg`, `robots.txt`, `sitemap.xml`) |

## Como atualizar

- **Preços, pratos, horário, telefones:** editar `src/carta.json` e rodar `npm run build`.
- **WhatsApp oficial:** quando o restaurante confirmar um número, preencher `"whatsapp": "34XXXXXXXXX"` em
  `src/carta.json`. O botão "Enviar por WhatsApp" aparece sozinho com a mensagem do pedido preenchida.
  Enquanto estiver vazio, nenhum link `wa.me` é publicado.
- **Logotipo oficial:** colocar `src/assets/media/logo.svg` (ou `.webp`/`.png`). O build substitui
  automaticamente a recriação tipográfica do rótulo nos espaços `data-logo-slot`.
- **Fotos:** só fotos do próprio restaurante, em WebP. Declarar em `src/media.json` com `alt` descritivo.

## Publicação

**No ar:** https://trattoria-pizzeria-nellos.vercel.app

Projeto Vercel `trattoria-pizzeria-nellos` (equipe `whsszxx-9424`), ligado a `whssz/site`,
branch `arena/3a2438e4-site`. Detalhes de fontes, mídia, QA e pendências em [`REVISAO.md`](REVISAO.md).

- **Push não publica sozinho:** o projeto tem a produção apontada para `main` e os deploys automáticos
  desligados. Para publicar uma mudança: `npm test` → commit → push → novo deploy de produção do commit
  (painel da Vercel → *Deployments* → *Create Deployment*, ou `vercel --prod` com o CLI).
- **Plano Hobby:** limite de 100 deploys por dia; acima disso a Vercel responde 402 e libera em 24 h.
- **Deployment Protection:** o domínio de produção acima é público. As URLs específicas de cada deploy
  (`…-<hash>-whsszxx-9424.vercel.app`) podem pedir login da Vercel — divulgue sempre o domínio de produção.
