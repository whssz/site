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
tools/browser-test.mjs  QA em navegador real (Chromium/Playwright): layout, pedido, acessibilidade
tools/deploy-vercel.mjs publicação na Vercel, com espera consciente da quota
tools/deploy-vercel.test.mjs  testes unitários da lógica de quota e de publicação
build.sh                build estático para a Vercel (saída em dist/)
package.json            scripts de QA e dependências de desenvolvimento
```

Servidor local:

```bash
python3 -m http.server 8000 --bind 0.0.0.0   # http://localhost:8000
```

QA (precisa de `npm i`):

```bash
npm install
node tools/qa.mjs index.html        # PASS obrigatório antes de publicar (59/59)
node --test tools/deploy-vercel.test.mjs   # lógica de quota e publicação
```

QA em **navegador real** (Chromium via Playwright, 43/43):

```bash
npm install
npx playwright install chromium
node tools/browser-test.mjs          # ou: node tools/browser-test.mjs https://url-publica
```

O teste arranca um servidor local, abre a página num Chromium real e verifica:
estrutura e metadados; ausência de scroll horizontal a 320/390/768/1440 px;
animações contínuas ativas; fluxo completo de pedido (adicionar, quantidades,
observações, remover, subtotal/total, modalidades, validação e consentimento);
link de WhatsApp com o número `351211522801` e mensagem com produtos e total;
cópia do resumo para a área de transferência; persistência em `localStorage`;
âncoras e cabeçalho fixo; `prefers-reduced-motion` sem animações contínuas;
zero erros de consola e zero recursos 404/500.

Se o Chromium não estiver instalado, defina `CHROMIUM_PATH` com o caminho do
binário ou instale-o com `npx playwright install chromium`.

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

- Projeto Vercel: `pizzeria-santa-chiara-site` — `prj_5EUI8RpUmLb5PW3OT9TnWVFzZBLy`
  (equipe `team_z6tahC0dowvMZFiASHvvIgBP`, repositório `whssz/site` id `1440125649`).
- Build: `bash build.sh` → saída estática em `dist/` (output directory `dist`).
- Raiz do projeto (`rootDirectory`): `dist` — a pasta é auto-contida, tem o
  próprio `build.sh` e o próprio `vercel.json`, por isso o build funciona
  qualquer que seja a pasta a partir da qual a Vercel o execute.
- **URL pública: <https://pizzeria-santachiara.vercel.app>**
  (também disponível em <https://pizzeria-santa-chiara-v2.vercel.app>).
  Os aliases automáticos da equipa
  (`pizzeria-santa-chiara-site-whsszxx-9424.vercel.app`) respondem com o ecrã
  de login da Vercel, porque o projeto tem `ssoProtection` ativo — os domínios
  ligados ao projeto são os endereços que servem o site sem autenticação.

### Publicação automática (GitHub Actions)

| Workflow | O que faz |
|---|---|
| `.github/workflows/qa-build.yml` | QA estático + funcional (59/59), testes da publicação, QA em navegador real (43/43) e build estático. Corre em cada push para `arena/**` e em cada PR. |
| `.github/workflows/deploy-vercel.yml` | Publica na Vercel, espera pelo build, verifica HTTP 200, título e marcadores de conteúdo na URL pública. |

O workflow de publicação corre a cada hora (`schedule`) para recuperar sozinho de
uma quota esgotada, e nunca lança pedidos em paralelo (`concurrency`).

**Quota gratuita da Vercel.** A conta tem um limite de 100 implantações por
24 horas, partilhado por **toda** a equipa (todos os projetos ligados ao
repositório). Quando o limite é atingido, a API responde `HTTP 402`
`api-deployments-free-per-day`. O `tools/deploy-vercel.mjs` trata esse caso de
propósito:

1. configura o projeto (build `bash build.sh`, saída `dist`, **sem** `ssoProtection`
   para o site ficar público e com `createDeployments` ligado à integração GitHub);
2. procura uma implantação já existente para o mesmo commit, para não gastar quota
   com duplicados;
3. ao receber `HTTP 402`, **não desiste**: espera com intervalos crescentes
   (com jitter) e volta a tentar dentro do orçamento de espera (`--wait-minutes`,
   omissão 45 min);
4. se o orçamento se esgotar, sai com o código `75` e o workflow reagenda a
   publicação para a execução horária seguinte;
5. depois de `READY`, verifica HTTP 200, título e marcadores de conteúdo na URL
   pública e grava o relatório em `qa/publicacao.json`.

Para publicar é preciso o segredo de repositório `VERCEL_TOKEN` (token da
conta Vercel com acesso à equipa). Sem esse segredo o workflow **não falha**:
adia a publicação com uma mensagem explícita. O `VERCEL_TOKEN` nunca é escrito
no código — só vive nos segredos do repositório.

```bash
VERCEL_TOKEN=... node tools/deploy-vercel.mjs --wait-minutes 45
node tools/deploy-vercel.mjs --dry-run     # não envia pedidos
```

### Estado atual

**O site está publicado e verificado** em <https://pizzeria-santachiara.vercel.app>
(também em <https://pizzeria-santa-chiara-v2.vercel.app>).

- Implantação `dpl_8bcdk3PFnjUXNz9J9wkUWaMqxU1R` — estado `READY`, subestado
  `PROMOTED`, alias público atribuído.
- Verificação na URL pública: **HTTP 200**, título
  `Pizzeria Santa Chiara — Pizza napolitana a lenha em Lisboa | Entrecampos`,
  morada `Avenida 5 de Outubro, 265`, telefone `+351 21 152 2801` e o menu
  completo presentes no HTML servido.
- Commit publicado: `d318891` (branch `arena/df6311cd-site`).

A publicação automática por GitHub Actions continua dependente do segredo de
repositório `VERCEL_TOKEN`, que **não existe** nesta conta (verificado por
diagnóstico: ausente no âmbito do repositório e do ambiente `production`). Sem
ele o workflow não falha — adia a publicação com uma mensagem explícita. Para
publicar manualmente:

```bash
VERCEL_TOKEN=... node tools/deploy-vercel.mjs --wait-minutes 45
```

A quota gratuita da equipa (100 implantações por 24 h, partilhada por todos os
projetos ligados ao repositório) continua a ser o limite prático; o script
espera e reagenda em vez de desistir.
