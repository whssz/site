# Pizzeria Napolitana — site

Site de uma página para a **Pizzeria Napolitana** (Torralba de Calatrava, Ciudad Real).
Arquitetura de fonte separada, entregue como **um único `index.html` autossuficiente** em `public/`.

## Estrutura

```
src/index.tpl.html   marcação + conteúdo (placeholders /*__CSS__*/ e /*__JS__*/)
src/site.css         sistema visual, animações, responsivo, prefers-reduced-motion
src/site.js          carrinho, filtro, drawer acessível, reveal, cópia do resumo
tools/build.mjs      inlina CSS/JS → public/index.html
tools/qa.mjs         auditoria de animação (estático, cai para checagem de fonte sem navegador)
tools/qa-legal.mjs   auditoria legal/LGPD/WCAG
tools/test-flow.mjs  38 verificações funcionais em jsdom
public/index.html    artefato publicado (gerado — não editar à mão)
```

## Comandos

```bash
npm run build     # gera public/index.html
npm run qa        # build + QA de animação + QA legal + testes funcionais
```

## Publicação

Projeto Vercel `napolitana-torralba`, **Root Directory = `public`**, sem framework,
sem build e sem install: o arquivo é servido como está.

```bash
npx vercel link --yes --project napolitana-torralba
npx vercel deploy --prod --yes
```

## Regras de conteúdo

- Nada de preço, promoção, sabor, telefone ou endereço inventado.
- Sabores publicados: apenas os confirmados pela casa (Instagram) ou citados em avaliações públicas.
- Sem WhatsApp oficial confirmado → o site copia o resumo e oferece o telefone público.
- O site nunca afirma que um pedido foi confirmado.

## Estado do deploy

Projeto `pizzeria-napolitana-site` (root `public`, sem build, linkado ao GitHub).
O deploy de produção fica **READY**, mas os domínios `*.vercel.app` desta conta exigem login
porque a equipe tem Deployment Protection (SSO) ligada. Para tornar público:
Settings → Deployment Protection → Vercel Authentication → Disabled.
