# ATALHOS — o que colar num chat novo

O workspace persiste, mas um chat novo **não sabe que ele existe**. Estas frases são o
gancho: elas fazem a IA abrir os arquivos certos em vez de improvisar.

---

## 1. Bloco de abertura (copie inteiro, cole no primeiro recado)

```
Antes de fazer qualquer coisa, leia estes arquivos do meu workspace:

COMECE-AQUI.md          → o padrão do estúdio, 7 regras
GUIA-DE-ESTILO.md       → tokens, tipografia, catálogo de animações
SCRIPT-UNIVERSAL.md     → o processo completo, 15 itens
CONFORMIDADE-E-LEGAL.md → LGPD/WCAG obrigatório, adaptado por nicho
DEPLOY.md               → publicação na Vercel

Animação entra por comando, nunca por memória:
  node tools/inject-anim.mjs <arquivo.html>

Teste antes de entregar:
  bash tools/setup.sh          (uma vez por sessão, instala o navegador)
  node tools/qa.mjs <arquivo>  (precisa dar PASS)

Não use portfolio/anim_layer.py — é legado, tem cor fixa e seletores mortos.
A camada boa é tools/anim-kit.css + tools/anim-kit.js.
```

Só isso já resolve 90% dos chats novos.

---

## 2. Palavras-chave por intenção

| O que eu quero | Frase para colar | O que acontece |
|---|---|---|
| Site novo | "Faz um site pra **[cliente]**, segue o COMECE-AQUI" | copia o esqueleto, adapta identidade, injeta animação, QA, publica |
| Padrão de movimento | "Faz um site pra **[cliente]** com aquele padrão de animações" | idem, foco no kit |
| Sem animação no site | "**Injeta as animações** no **[site]**" | roda `inject-anim.mjs` |
| Conferir | "Passa o **qa.mjs** no **[site]**" | mede e reporta números |
| Auditar | "**Roda a auditoria de animação** no **[site]**" | diz o que existe e o que falta |
| Só olhar | "Me mostra o **GUIA-DE-ESTILO**" | abre o padrão |
| Ver a peça | "Abre o **portfolio/index.html**" | a referência visual |
| Catálogo | "Qual o **catálogo de animações**?" | os 10 tipos e onde vivem |
| Legal | "Roda o **qa-legal** no **[site]**" | acessibilidade + LGPD |
| Publicar | "**Publica** o **[site]** na Vercel" | pede token se a sessão não tiver |
| Manutenção | "**Refaz o QA dos três**" | portfólio, esqueleto, Migaica |
| Continuar | "**Atualiza** o portfólio" | trabalha sobre o que já existe |

---

## 3. Os 8 nomes que abrem tudo

`COMECE-AQUI` · `GUIA-DE-ESTILO` · `SCRIPT-UNIVERSAL` · `CONFORMIDADE-E-LEGAL` ·
`DEPLOY` · `base/skeleton.html` · `tools/inject-anim.mjs` · `tools/qa.mjs`

Cite qualquer um deles e a IA sabe onde olhar.

---

## 4. Se a IA começar errado, corrija com estas frases

| Sintoma | Cobrança |
|---|---|
| Site nasceu sem movimento | "Rodou o `inject-anim`? O `qa.mjs` deu `loop: 0`." |
| Cor do fundo errada | "A camada é tokenizada: tem que ler `--accent` do `:root`." |
| Copiou o `anim_layer.py` | "Esse é legado, tem cor fixa. Use o `anim-kit`." |
| Disse que passou sem mostrar número | "Mostra a tabela do `qa.mjs`." |
| Inventou preço, CNPJ ou depoimento | "Não inventa: dado que não existe sai do site e vira pendência." |
| Entregou link sem testar | "O link abriu 200? Testa e me manda." |
| Esqueceu cookies/privacidade | "Faltou o módulo legal — `CONFORMIDADE-E-LEGAL.md`." |

---

## 5. Regras que não mudam, em nenhum chat

1. Animação é **obrigatória** — ao menos um loop contínuo durante toda a navegação.
2. **Não se inventa** dado: preço, depoimento, CNPJ, endereço, horário, URL.
3. **Conformidade** é obrigatória, mas adaptada ao nicho — nunca bloco copiado.
4. Referência visual é o `portfolio/index.html`; **cor e tipografia vêm do cliente**.
5. Site novo vai **publicado na Vercel, com link testado, na mesma resposta**.
6. Foto e vídeo **reais** (Google Maps / Instagram do cliente) — nada de banco de imagens.
