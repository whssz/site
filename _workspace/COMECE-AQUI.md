# COMECE AQUI — leia antes de criar qualquer site

> Se você é o agente e está lendo isto: **este é o padrão obrigatório do estúdio.**
> Leia os três arquivos abaixo antes de escrever a primeira linha de código.

---

## Ordem de leitura

| # | Arquivo | Para quê |
|---|---|---|
| 1 | `GUIA-DE-ESTILO.md` | Arquitetura, tokens, tipografia, vocabulário de animação, componentes, checklist de aceite |
| 2 | `base/skeleton.html` | Ponto de partida real: copiar e reskinar. Já vem com a camada completa (12 keyframes) |
| 2b | `tools/inject-anim.mjs` | **Injeta a camada em QUALQUER html** — inclusive site escrito do zero. É a garantia mecânica |
| 3 | `DEPLOY.md` | Publicar na Vercel e entregar o link público — automático, sem o usuário pedir |
| 4 | `tools/qa.mjs` | Portão de qualidade: animação, layout, reduced-motion. Sem PASS, não publica |
| 5 | `CONFORMIDADE-E-LEGAL.md` | Termos, privacidade, cookies, LGPD, contraste, alt — com matriz por nicho |
| 6 | `base/legal-snippets.html` | Blocos legais prontos: cookies, consentimento, privacidade, termos |
| 7 | `tools/qa-legal.mjs` | Portão de conformidade. Bloqueia dado fictício, imagem sem alt, consentimento pré-marcado |

**Referência visual pura:** `portfolio/index.html` — o padrão em estado aplicado.
**Primeiro site de cliente nesse padrão:** `migaica/index.html`.

---

## As 6 regras que não se negociam

1. **Identidade vem do cliente.** Cor, tipografia, tom, mídia — nunca a paleta do portfólio,
   a menos que o cliente seja o próprio estúdio. O que se repete é o rigor, não a cara.
2. **Nada inventado.** Preço, produto, sabor, número, avaliação, depoimento, endereço, horário,
   certificação. Se não foi verificado numa fonte, não entra. Sem dado? Usa o fato, não a estatística.
3. **Entrega em arquivo único.** HTML autossuficiente: CSS/JS inline, mídia e fonte em base64.
   Abre offline, sem requisição externa.
4. **Movimento perpétuo.** Fundo contextual animado + mínimo 2 animações em loop rodando o
   tempo todo, durações desencontradas, só `transform`/`opacity`. Reveal, parallax e
   microinterações variados — nada animado do mesmo jeito. `prefers-reduced-motion` desliga tudo.
5. **Nenhum botão decorativo.** Todo CTA leva a um destino real e funcional.
6. **Animação entra por comando, não por memória.** Depois de escrever o site (de qualquer jeito,
   do zero ou do esqueleto), rode `node tools/inject-anim.mjs <arquivo>`. Ele injeta fundo
   contextual, 12 keyframes, reveal variado, microinterações e reduced-motion. Se o QA acusar
   `loop: 0`, é porque esse passo foi pulado.
7. **Animação não se reescreve — se copia.** A camada de movimento vive em
   `base/skeleton.html` e em `portfolio/anim_layer.py`. É proibido reimplementar
   as animações "de memória": copie o arquivo, troque os tokens, pronto. Foi assim
   que o padrão virou 12 keyframes em vez de 3.
8. **Conformidade é obrigatória, mas adaptada ao nicho.** Termos, privacidade, cookies,
   consentimento, reembolso e contraste entram **conforme o que o site faz** — ver
   `CONFORMIDADE-E-LEGAL.md`. Bloco fora de contexto é erro, e dado legal inventado é
   proibição absoluta: sem CNPJ real, o bloco sai e a pendência é reportada.
9. **Só entregar com link verificado.** Publicar → `HTTP 200` público → tamanho confere →
   aí sim mandar a URL.

---

## O fluxo, do pedido à entrega

```
briefing + identidade real do cliente
  → copiar base/skeleton.html (já traz a camada de animação injetada)
  → reescrever SÓ o :root + as fontes
  → arquitetar as seções pelo nicho (≥ 4, ENTRAR → AGIR)
  → conteúdo 100% real
  → mídia real do cliente em /assets, comprimida, lazy fora do hero
  → bash tools/setup.sh                (instala o navegador do QA — 1x por sessão)
  → node tools/inject-anim.mjs <arq>   (injeta o kit de animação — obrigatório)
  → node tools/qa.mjs <arquivo>        (PASS: 0 scroll horizontal, ≥ 2 loops,
                                       0 elemento que nunca revela, 0 erro de JS)
  → node tools/qa-legal.mjs <arquivo>  (sem bloqueante: alt, lang, dado fictício,
                                       consentimento, cookies)
  → fluxo funcional testado no navegador
  → publicar na Vercel (DEPLOY.md)
  → validar HTTP 200
  → entregar o link
```

---

## Como invocar isto numa conversa nova

Anexe este arquivo, ou escreva apenas:

> **"Segue o COMECE-AQUI.md do meu workspace."**

É suficiente. A partir daí eu leio o guia, o esqueleto e o deploy antes de começar.

---

## Palavras-chave — como me invocar

> Cola pronta para chat novo: **`ATALHOS.md`**

### Para criar site novo (o mais usado)
> "Faz um site pra **[cliente]**, segue o COMECE-AQUI."
> "Faz um site pra **[cliente]**, usa o portfólio como base."
> "Faz um site pra **[cliente]** com aquele padrão de animações."
> "Faz um site pra **[cliente]**, padrão do estúdio."

Copia o esqueleto (12 keyframes já inclusos) → adapta identidade → QA → publica → entrega o link.

### Só o movimento, num site que já existe
> "Injeta as animações no **[site]**." → `node tools/inject-anim.mjs`
> "Passa o `qa.mjs` no **[site]**." → só mede e reporta
> "Roda a auditoria de animação no **[site]**." → audita: o que existe, o que falta

### Referência pura (sem construir nada)
> "Me mostra o `GUIA-DE-ESTILO`." → o padrão documentado
> "Abre o `portfolio/index.html`." → a peça de referência
> "Qual o catálogo de animações?" → os 10 tipos e onde vivem

### Deploy
> "Publica o **[site]** na Vercel." → vou pedir o token, se a sessão não tiver
> "Manda o `DEPLOY.md`." → a receita de publicação

### Manutenção
> "Atualiza o portfólio." · "Reaplica a camada." · "Refaz o QA dos três."

### Nomes próprios que você pode citar
`COMECE-AQUI` · `GUIA-DE-ESTILO` · `DEPLOY` · `skeleton` · `anim-kit` · `inject-anim` ·
`anim_migaica` · `qa.mjs` · `portfólio` · `Migaica` · `2.492.949 bytes`

### Se eu errar, o que cobrar
> "Passou no `qa.mjs`?"
> "Isso veio do `skeleton` ou você reescreveu?"
> "Cadê os números do QA?"
