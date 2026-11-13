# tools/ — QA executável e injetor de animação

O padrão do estúdio não vive só em documento. Estes scripts são os **portões**.

## 1. Instalação (uma vez por sessão)

```bash
bash tools/setup.sh
```

`node_modules` **não persiste** entre sessões. Se você pular este passo, `tools/qa.mjs`
cai automaticamente em **modo estático** (analisa o HTML sem navegador): continua
barrando site sem animação, mas não mede scroll horizontal nem elemento invisível.

## 2. Injetar a camada de animação — passo obrigatório

```bash
node tools/inject-anim.mjs site/index.html               # qualquer HTML
node tools/inject-anim.mjs site/index.html --accent "#E000A5"
node tools/inject-anim.mjs --refresh                     # atualiza os sites do workspace
```

O que ele injeta: fundo contextual animado (aurora + 3 blobs orgânicos + grade em deriva +
12 partículas), fio vertical com luz escorrendo, barra de progresso, reveal variado
(fade/scale/left/right/clip), parallax, brilho em botão e card, e `prefers-reduced-motion`.

Também marca cada `<section>` com `data-bridge` — os glows que atravessam a fronteira
das seções. **Sem isso, a camada “existe mas não aparece”** (foi um dos bugs corrigidos).

**A cor segue o site.** O kit não tem cor fixa: ele lê `--accent` → `--magenta` → `--gold`
→ `#C9A46A`. Trocar o `:root` troca o fundo animado junto.

Prova medida, num site escrito do zero sem nenhuma animação:

```
antes:   0 keyframes · 0 animações em loop        → QA FAIL
depois:  7 keyframes · 21 animações em loop       → QA PASS
```

## 3. QA completo

```bash
node tools/qa.mjs portfolio/index.html
node tools/qa.mjs base/skeleton.html --min-loop 5
node tools/qa.mjs https://site.vercel.app
```

Exit **0 = PASS**, **1 = FAIL**.

| Verificação | Critério | Por que importa |
|---|---|---|
| Scroll horizontal | 0px em 1440 / 768 / 390 | um glow mal posicionado já criou 150px de rolagem lateral |
| Animações em loop perpétuo | ≥ `--min-loop` (padrão 2) | item 5 do script: sem animação contínua, o site está INCOMPLETO |
| Keyframes distintos | ≥ 5 | prova que o movimento é variado |
| Elementos que nunca revelam | 0 | `clip-path` zera a área visual e o observer nunca dispara |
| Erros de JS | 0 | uma exceção mata todos os reveals seguintes |
| `prefers-reduced-motion` | 0 animação, 0 oculto | acessibilidade e especificidade CSS |

## 4. QA de conformidade

```bash
node tools/qa-legal.mjs migaica/index.html
```

Bloqueia: imagem sem `alt`, `lang`/`title` ausente, dado fictício publicado, rastreador sem
consentimento, consentimento pré-marcado. Alerta: contraste, teclado, termos, cookies,
promessa sem prova. Ver `CONFORMIDADE-E-LEGAL.md`.

## Arquivos

| Arquivo | Papel |
|---|---|
| `anim-kit.css` / `anim-kit.js` | fonte única da camada de animação (tokenizada) |
| `inject-anim.mjs` | injeta o kit em qualquer HTML (idempotente, `--refresh` atualiza) |
| `qa.mjs` | portão de animação/layout, com fallback estático |
| `qa-legal.mjs` | portão de conformidade/LGPD/WCAG |
| `setup.sh` | instala navegador e dependências |
