# Pizzeria Santa Chiara — site

Site institucional e de pedidos da **Pizzeria Santa Chiara** (Avenida 5 de Outubro 265, Entrecampos, Lisboa).
Construído segundo o padrão do estúdio: `SCRIPT-UNIVERSAL.md`, `GUIA-DE-ESTILO.md`, `CONFORMIDADE-E-LEGAL.md` e `DEPLOY.md`.

---

## Como está organizado

```
index.html              site completo (HTML + CSS + JS inline)
assets/img/*.webp       média real da pizzeria (otimizada, WebP)
assets/fonts/*.woff2    Marcellus, Cormorant Garamond, Jost (locais, sem CDN)
tools/qa.mjs            portão de qualidade: auditoria estática + teste funcional do pedido
package.json            dependência única de QA (jsdom)
```

Servidor local:

```bash
python3 -m http.server 8000 --bind 0.0.0.0   # http://localhost:8000
```

QA (precisa de `npm i`):

```bash
npm install
node tools/qa.mjs index.html     # PASS obrigatório antes de publicar
```

---

## O que o site faz

- **Menu real** transcrito do menu da casa e do menu digital da pizzeria (62 itens com preço), com filtros por categoria.
- **Pedido montado no site**: adicionar, alterar quantidades, remover, escrever observações por linha, calcular subtotal/total, escolher modalidade (levantar / consumo no local / entrega), validar nome, telefone, morada (só quando é entrega) e consentimento.
- **Resumo automático** do pedido, copiado para a área de transferência, enviado por WhatsApp (número publicado pela pizzeria) ou por telefone.
- **Nunca** é apresentado "pedido confirmado": quem confirma é a equipa da pizzeria.

---

## Mídia usada (origem e aplicação)

Toda a mídia é real e foi obtida de fontes públicas da própria pizzeria. Nenhuma imagem de banco, gerada por IA ou ilustração a fazer-se de fotografia.

| Ficheiro | Origem | Onde é usada |
|---|---|---|
| `assets/img/logo-placa.webp` | Google Maps / fachada da pizzeria (fotografia da placa de azulejo com a gravura da lagosta) | cabeçalho, rodapé, selo do hero |
| `assets/img/margherita-heart-1000.webp` | Time Out Lisboa (Rita Chantre) / ficha da pizzeria | hero |
| `assets/img/margherita-heart-700.webp` | idem | destaque "Margherita" |
| `assets/img/margherita-1000.webp` | ficha de imprensa da pizzeria | cardápio — Margherita |
| `assets/img/diavola-1000.webp` / `-700.webp` | ficha de imprensa da pizzeria | cardápio — Diavola / destaque Diavola |
| `assets/img/crudo-scaglie-480.webp` | ficha de imprensa da pizzeria | cardápio e destaque — Crudo e Scaglie |
| `assets/img/posillipo-660.webp` | ficha de imprensa da pizzeria (recorte da foto com duas pizzas) | cardápio e destaque — Posillipo |
| `assets/img/mortadella-pistacchio-500.webp` | ficha de imprensa da pizzeria | cardápio e destaque — Mortadella e Pistacchio |
| `assets/img/balcao-mural-700.webp` | Time Out Lisboa (Rita Chantre) | história, galeria |
| `assets/img/salao-500.webp` | Time Out Lisboa (Rita Chantre) | galeria |
| `assets/img/forno-equipa-500.webp` | Time Out Lisboa (Rita Chantre) | galeria |
| `assets/img/mural-maradona-500.webp` | Time Out Lisboa (Rita Chantre) | galeria |
| `assets/img/fachada-700.webp` / `-1000.webp` | ficha de imprensa da pizzeria | galeria, "Visite" |
| `assets/img/equipa-maradona-1000.webp` | ficha de imprensa da pizzeria | galeria |
| `assets/img/mesa-cotto-funghi-700.webp` | ficha de imprensa da pizzeria | galeria |
| `assets/img/menu-casa.webp` | menu da casa publicado pela pizzeria (com a marca e a lagosta) | coluna lateral do cardápio |

**Autorização:** as fotografias da Time Out Lisboa são de uma parceria da pizzeria e foram partilhadas pela própria empresa no Instagram; as restantes são de ficha de imprensa e do perfil público da pizzeria. **Antes da publicação pública, confirmar autorização de uso com a pizzeria** (em especial as imagens de imprensa e o menu da casa).

---

## Dados publicados (com origem)

| Dado | Valor | Origem |
|---|---|---|
| Morada | Avenida 5 de Outubro 265, 1600-034 Lisboa | Google Maps |
| Telefone | +351 21 152 2801 | Google Maps |
| Horários | Seg–Qui 12h20–15h00 e 19h20–23h00 · Sex–Sáb 12h20–23h00 · Dom 19h20–23h00 | Instagram oficial da pizzeria |
| Menu e preços | 62 itens | menu da casa + menu digital da pizzeria |
| 55 lugares, sem reservas, mural de Diego, chef Alfonso Cantarelli | factos | Time Out Lisboa (04/11/2026) |
| Happy hour sex/sáb 15h–19h | facto | Instagram oficial |

**Pendências para a pizzeria** (não publicadas por não existirem):
razão social e NIPC; confirmação se o telefone publicado atende WhatsApp; eventual segundo telefone (a plataforma de menus indica +351 218 262 666); confirmação dos horários de domingo (o perfil do Google Maps ainda mostra "fechado" ao domingo, o Instagram anuncia abertura); autorização das fotografias de imprensa.

---

## Conformidade

- Política de Privacidade e Termos de Uso reais, linkados no rodapé (`#privacidade`, `#termos`).
- Recolha mínima: nome, telefone e morada apenas quando é entrega.
- Consentimento explícito, não pré-marcado, a bloquear o envio.
- Sem analytics, píxeis ou trackers: sem banner de cookies (não é necessário).
- Sem reembolso: o site não vende nem cobra — há regras de atendimento (sem reservas, confirmação humana da equipa).
- `lang="pt-PT"`, alt descritivo em 100% das imagens, foco visível, `Esc` fecha o carrinho, alvos de toque ≥ 44 px.

---

## Publicação (Vercel)

- Projeto Vercel: `pizzeria-santa-chiara-v2` (equipe `team_z6tahC0dowvMZFiASHvvIgBP`).
- Build: `bash build.sh` → saída estática em `dist/` (output directory `dist`).
- A integração GitHub do Vercel constrói a branch `arena/df6311cd-site` automaticamente.
