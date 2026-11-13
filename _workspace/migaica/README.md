# Migaica Doceria Artesanal — site + análise

> Entrega do site premium seguindo o script universal. Tudo abaixo foi apurado nos
> materiais fornecidos (logo em texto, Google Maps e Instagram). Nada foi inventado.

---

# 1. ANÁLISE DO MATERIAL (antes do código)

## 1.1 Identidade visual (da logo fornecida)
| Elemento | Definição aplicada no site |
|---|---|
| Lilás `#D5B1E9` | Cor principal — fundos, botões, tags, detalhes |
| Branco `#FFFFFF` | Cards, respiro, texto sobre lilás |
| Preto / roxo-escuro | Textos — usei `#241033` (roxo-escuro, como recomendado) |
| Laranja `#F5A000` | Estrelas de avaliação, acentos, pin |
| Vermelho `#F04436` | Estados de erro / "Fechado" |
| Magenta `#E000A5` | Destaques, CTAs, palavras em script |
| Tipografia manuscrita | Fonte real extraída da própria marca: **wordmark "Migaica"** retirado do vídeo end-card, + fonte script embutida (Dancing Script, licença OFL) nos acentos |
| Tipografia sem serifa | Textos de apoio — stack do sistema, sem dependência externa |
| Formas | Curvas e arredondado: arco do hero, cards de 22–34px, anel circular do logo |

**Regra respeitada:** o site é uma extensão da marca, não uma identidade nova.

## 1.2 Nicho e tarefa do cliente
- **Nicho:** doceria artesanal / delivery de doces (gastronomia)
- **Modelo:** venda direta — delivery próprio + retirada na loja + encomendas
- **Ação principal do visitante:** escolher doces e **montar o pedido**
- **Canal oficial:** WhatsApp **(21) 99559-2625** (confirmado no Maps **e** no linktree oficial)
- **Arquitetura escolhida:** o nicho manda → cardápio visual + sistema de pedidos, não um formulário genérico.

## 1.3 Dados reais confirmados
| Dado | Valor | Origem |
|---|---|---|
| Nome | Migaica Doceria artesanal LTDA | Google Maps |
| Categoria | Doceria | Google Maps |
| Nota | **5,0** | Google Maps |
| Avaliações | **227** | Google Maps |
| Endereço | Av. Prefeito Milton Rodrigues da Rocha, 200 — Novo Horizonte (Manilha), Itaboraí — RJ | Google Maps |
| Telefone/WhatsApp | (21) 99559-2625 | Google Maps + linktr.ee |
| Horário | **Qua, Qui, Sex, Sáb, Dom: 12:00–20:30** · Seg e Ter: fechado | Google Maps (tabela completa lida) |
| Atributo | Empresa que acolhe a comunidade LGBTQ+ | Google Maps |
| Perfil | "Migaica - Delivery de Doces em Itaboraí" · 5.313 seguidores · 457 posts | Instagram |
| Bio | "Mais que um doce, uma experiência!" (usado como headline) | Instagram |
| Site oficial | linktr.ee/migaica | Google Maps |
| iFood | loja migaica-doceria-centro-manilha | Linktree oficial |

## 1.4 O que NÃO consegui acessar (e por isso não inventei)
| Tentativa | Resultado |
|---|---|
| Instagram @migaicadoceria (fotos/posts/vídeos) | **HTTP 403 / redirect para login** — bloqueado |
| iFood (cardápio e preços) | **Cloudflare "verificação de segurança"** — não burlei |
| Cardápio Yooga (`delivery.yooga.app`) | API responde **400** — sem catálogo ativo |
| whatsmenu.com.br/migaicadoceria | **404** |
| Fotos do Maps além das 10 primeiras | Google serve "visualização limitada" para visitante |

**Consequência (regra de integridade):** como **não existe cardápio público com preços**, o site
**não mostra preço nenhum** e diz isso de forma clara ao cliente. Nenhum produto, sabor,
tamanho, ingrediente ou promoção foi inventado.

---

# 2. ARQUITETURA (6 seções grandes)

`ENTRAR → ENTENDER → EXPLORAR → CONFIAR → AGIR`

1. **HERO** — quem é + o que vende + vídeo real (morango no chocolate) + nota 5,0 + CTA
2. **NOSSOS DOCES** (oferta principal em destaque) — 6 itens com foto real, filtros por categoria e botão **Adicionar ao pedido**
3. **A EXPERIÊNCIA** — vídeo real de produção, história, números reais, 3 avaliações reais do Google, galeria com 5 fotos
4. **MONTE SEU PEDIDO** — ferramenta funcional: carrinho, quantidades, entrega/retirada, dados, resumo e envio pelo WhatsApp
5. **ONDE ESTAMOS** — endereço, WhatsApp, tabela de horários, mapa animado com link real
6. **CTA FINAL + FOOTER**

---

# 3. SISTEMA DE PEDIDOS (seção 14 do script)

Diagnóstico: doceria → cliente **monta pedido** → encaminhamento pelo WhatsApp oficial.

**Fluxo implementado e testado:**
1. **Explorar** — catálogo visual com fotos reais, nome, descrição e filtro por categoria
2. **Adicionar** — botão funcional com feedback ("Adicionado" + toast)
3. **Revisar** — carrinho com +/−, remoção, resumo lateral atualizado em tempo real
4. **Entrega ou retirada** — botão escolhe a modalidade; o campo de endereço **só aparece** na entrega
5. **Enviar** — validação de nome (e endereço se entrega) → abre o WhatsApp **já preenchido** com itens, quantidades, modalidade, endereço, nome e observações

**Integridade:**
- Não existe "Pedido confirmado": o site diz que o pedido só é confirmado quando a loja responde.
- Sem preços inventados: o resumo avisa que valores e prazo são confirmados no atendimento.
- Fallback **"Copiar resumo"** caso o cliente prefira colar manualmente.
- Pedido salvo em `localStorage` — não se perde ao navegar ou recarregar.

**Testes executados (todos OK):** adicionar, aumentar, diminuir, remover, trocar modalidade,
validação sem nome, mensagem gerada, persistência após reload, URL do WhatsApp com número oficial.

---

# 4. MÍDIA REAL USADA (seção 15 — checklist)

## 4.1 Fotos — Google Maps (galeria oficial da empresa)
| Arquivo | O que mostra | Onde apliquei |
|---|---|---|
| `brigadeiros.webp` | Brigadeiros em prato dourado | Card "Brigadeiros artesanais" + galeria |
| `morango.webp` | Morangos no chocolate | Card "Morangos no chocolate" |
| `pote.webp` | Bolo de pote com calda | Card "Bolo de pote" |
| `fatia.webp` | Fatia de bolo em camadas | Card "Fatia de bolo de chocolate" |
| `caixa.webp` | Caixa vermelha personalizada "TE AMO" | Card "Caixa personalizada" + galeria |
| `copo.webp` | Sobremesa no copo com marca Migaica | Card "Sobremesa no copo" |
| `bastidor.webp` | Mãos com luvas partindo um doce | Galeria |
| `ambiente.webp` | Mesa posta ao anoitecer | Galeria |
| `pote2.webp` | Bolo de pote com morango | Galeria |
| `bolo_morango.webp` | Bolo com morangos | **NÃO usado** — a imagem tem um print de mensagem de cliente sobreposto (evita expor terceiros e texto desatualizado) |

## 4.2 Vídeos — TikTok oficial @migaica (mídia publicada pela própria empresa)
| Arquivo | Conteúdo | Onde apliquei | Ajuste |
|---|---|---|---|
| `morango.mp4` (6,3 s) | Morango no chocolate sendo cortado | **Hero** | trecho sem legendas embutidas, sem áudio, 540px |
| `producao.mp4` (6 s) | Potes sendo montados à mão | Seção "A experiência" | recortei a faixa inferior para remover as legendas do vídeo original, sem áudio |

Ambos: `muted + loop + playsinline + autoplay`, **poster** carregado primeiro, o da experiência
só toca quando entra na tela, e com `prefers-reduced-motion` fica apenas o poster.

## 4.3 Logo
`logo-wordmark.png` — o **logo real** foi extraído do end-card do vídeo da marca e recortado com
fundo transparente. Três versões: branca (footer), roxo-escuro (header) e magenta (reserva).

## 4.4 ⚠️ Ponto de atenção para a empresa
As 10 fotos vieram da **galeria do Google Maps**. O Maps não expõe, na visualização pública, a
autoria de cada foto — então **não é possível garantir que todas sejam do proprietário**; algumas
podem ter sido enviadas por clientes. Recomendo pedir autorização/confirmar a origem antes de
publicar, ou substituir pelas fotos originais do Instagram (que eu não consegui acessar).
Todos os vídeos são do perfil oficial da marca (@migaica) no TikTok.

---

# 5. ANIMAÇÕES (seções 5 a 8 do script)

## Animação contínua (loop infinito, durante toda a navegação)
1. **3 blobs de gradiente** em movimento perpétuo (26s / 32s / 38s) — fundo contextual
2. **3 anéis concêntricos** girando (96s / 120s / 180s) — eco da forma circular do logo
3. **Partículas de açúcar** em canvas (30 no desktop, 16 no mobile) subindo lentamente, com brilho pulsante, nas cores da marca
4. **Marquee** de informações reais correndo continuamente
5. **Anel tracejado** girando ao redor do vídeo do hero
6. **Cards flutuantes** e **pin do mapa** com pulsação infinita

## Fundo contextual animado
Camadas de lilás + magenta + laranja em mesh, com anéis e partículas — abstrato, elegante e
ligado ao universo da confeitaria e à identidade (nada de bolo girando no fundo).

## Animações de scroll
- Reveal com fade + translate (com delays escalonados)
- **Parallax** no vídeo do hero e no vídeo da produção
- Header que compacta e ganha blur ao rolar
- Barra de pedido que desliza no mobile

## Microinterações
Hover com elevação nos cards, zoom suave nas fotos, botões que mudam de cor e recuam,
contador do carrinho, feedback "Adicionado", toasts, pin do mapa pulsando, filtros com estado ativo.

## Respeito a `prefers-reduced-motion`
Desliga blobs, anéis, partículas, marquee, parallax e vídeos — deixando só o poster.

---

# 6. RESPONSIVIDADE E PERFORMANCE
- Testado em **390px, 768px e 1440px**: **zero scroll horizontal** (`scrollWidth === clientWidth`)
- Mobile-first: menu fullscreen, barra de pedido fixa, carrinho em coluna única
- Só `transform` e `opacity` animados; `will-change` nos elementos de movimento
- Imagens em **WebP**; vídeos leves (345 KB e 564 KB), sem áudio, com poster
- Página **única e autossuficiente**: todos os assets embutidos em base64 — abre offline, sem depender de CDN, Instagram ou Google

---

# 7. ARQUIVOS

```
migaica/
├── index.html      ← ENTREGA (2,4 MB, tudo embutido: fotos, vídeos, logo, fonte)
├── template.html   ← mesma página com marcadores {{...}} para editar texto/CSS
├── build.py        ← reinjeta os assets no template e regenera o index.html
└── assets/         ← arquivos otimizados (WebP/MP4/PNG) para hospedar separadamente
```

**Para editar textos/preços:** mexa no `template.html` e rode `python3 build.py`.
**Para hospedar:** suba o `index.html` (Netlify, Vercel, Hostinger, qualquer lugar) — não precisa de servidor nem banco.

---

# 8. CHECKLIST FINAL DO SCRIPT

| Requisito | Status |
|---|---|
| Análise antes do código | ✅ |
| Identidade respeitada (cores, script, curvas) | ✅ |
| Nicho definiu a arquitetura | ✅ |
| Nenhuma informação inventada | ✅ (nem preço, nem produto, nem depoimento com nome) |
| Mínimo de 4 grandes seções | ✅ 6 seções |
| Jornada contínua (entrar→entender→explorar→confiar→agir) | ✅ |
| Animação contínua em loop | ✅ 6 camadas |
| Fundo contextual animado | ✅ |
| Animações de scroll | ✅ |
| Microinterações | ✅ |
| Sistema de pedidos funcional | ✅ testado |
| Envio organizado ao WhatsApp oficial | ✅ |
| Não simula confirmação/pagamento/estoque | ✅ |
| Mobile sem quebra | ✅ 390 / 768 / 1440 |
| Performance / reduced-motion | ✅ |
| Mídia real da empresa | ✅ 10 fotos + 2 vídeos + logo real |
| Lista de mídias com origem | ✅ seção 4 |

## Pendências (dependem da empresa)
1. **Preços e cardápio oficial** → hoje o site não mostra valores (por integridade). Com a tabela de preços, viro os cards em pedido com total calculado.
2. **Autorização das fotos do Maps** (ver 4.4).
3. **Instagram** → se enviar as fotos/vídeos, eu troco as mídias e amplio a galeria.
4. **Link de entrega próprio** (Yooga está fora do ar) — hoje o site usa WhatsApp + iFood.

---

## Camada de movimento — MIGA-ANIM v1 (10/11/2026)

O site já tinha camada própria (blobs, anéis girando, partículas de açúcar em canvas,
floaty, ping, marquee, parallax). A auditoria mostrou que faltavam cinco itens do script
universal — e só eles foram adicionados, sem duplicar o que existia:

| Adicionado | O que resolve |
|---|---|
| Grão sobre a página | item "textura" — a página tinha cor e forma, mas nenhuma matéria |
| Pose de entrada diferente por família | o reveal era todo `translateY(30px)`; agora cada bloco entra de um jeito |
| Brilho varrendo botão e card | microinteração premium (item 9) |
| Glows na fronteira de `#doces` / `#experiencia` / `#pedido` | continuidade entre seções (item 7) |
| Barra de progresso de leitura | movimento contínuo ligado à navegação |
| `prefers-reduced-motion` universal | antes só `.bg-blob` e `.ring-bg` paravam; `ping`, `floaty`, marquee, `pulseRing` e o pino do mapa continuavam animando |

**Aplicar:** editar `template.html` → `python3 anim_migaica.py` → `python3 build.py`

**QA (tools/qa.mjs):**

| viewport | h-scroll | loop | keyframes | revela | erros |
|---|---|---|---|---|---|
| 1440 | 0px | 19 | 10 | 18/18 | 0 |
| 768 | 0px | 18 | 10 | 18/18 | 0 |
| 390 | 0px | 18 | 10 | 18/18 | 0 |

`prefers-reduced-motion`: desliga tudo. Fluxo de pedido testado ponta a ponta: carrinho,
quantidade, remover, modalidade, endereço, observações → mensagem do WhatsApp montada
corretamente, sem exibir "pedido confirmado".

Screenshots do QA: `qa-hero.png`, `qa-doces.png`, `qa-experiencia.png`, `qa-mobile.png`.

---

## Módulo legal e de acessibilidade — MIGA-LEGAL v1 (11/11/2026)

Aplicado conforme `CONFORMIDADE-E-LEGAL.md`. Conteúdo escrito a partir do que o site
**realmente faz** (não há texto copiado de terceiros):

| Item | Situação no site |
|---|---|
| Política de Privacidade | Seção `#privacidade`: coleta (nome, endereço, observações) · uso (envio ao WhatsApp) · compartilhamento · cookies · direitos (LGPD) · identificação |
| Termos de Uso | Seção `#termos`: oferta, como o pedido é finalizado, preços confirmados no atendimento, entrega, devolução/CDC art. 49, uso do site |
| Identificação do fornecedor | Razão social e endereço reais. **CNPJ pendente — não publicado** (não foi inventado) |
| Consentimento no formulário | Checkbox obrigatório, não pré-marcado, **bloqueia o envio** do pedido até ser marcado |
| Banner de cookies | **Não existe — e isso está correto**: o site não instala rastreador nenhum |
| Contraste WCAG AA | 37 textos reprovavam → **0**. Tokens `--lilac-text` (6.2:1) e `--magenta-text` (6.3:1) só onde o acento é palavra |
| Foco visível | Menu mobile fechado estava no Tab (links invisíveis) → `visibility:hidden`; foco visível garantido com `!important` |
| Estrelas de avaliação | Marcadas como decorativas (`aria-hidden`); a nota existe em texto ao lado |

**QA legal:** `node tools/qa-legal.mjs migaica/index.html` → *Nada pendente.*

**Bugs reais que a auditoria encontrou:** 37 textos abaixo do contraste mínimo, menu
mobile fechado capturando o Tab, e ausência total de consentimento no formulário —
nenhum deles visível a olho nu.
