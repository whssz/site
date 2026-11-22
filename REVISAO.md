# Revisão de entrega — Trattoria Pizzeria Nello's

Site em espanhol para a Trattoria Pizzeria Nello's (San Fernando, Cádiz). Dados consultados em novembro de 2026.

## 1. Fontes verificadas

| Dado | Fonte |
|---|---|
| Nome, endereço (C. San Federico, 52 · 11100 San Fernando), coordenadas, horário, 4,8/5 com 528 avaliações, sala/terraza/para llevar/domicilio | Ficha do Google Maps (`0xd0dcd71177ce8fb:0x886bfd8902a0c7c7`) |
| Telefones 856 94 21 29 e 613 54 53 03 | Google Maps, rótulo da fachada e diretórios |
| E-mail, "pizzería napolitana 100%", pedidos por telefone/Uber/Just Eat, reservas | Página de Facebook do restaurante |
| Carta e preços (60 pratos), "Masa 100% artesanal" | Carta impressa + Just Eat, Uber Eats e Glovo (vendor 531735), conferidos entre si |
| Razão social TRATTORIA PIZZERIA NELLO'S SL · CIF B10872992 | BORME / eInforma |
| Just Eat 4,6/5 (+220), Glovo 100% recomendação, Tripadvisor 5,0/5, temas frequentes das resenhas | Fichas públicas de cada plataforma, RestaurantGuru, GastroRanking, Wanderlog |
| Entrada acessível para cadeira de rodas | RestaurantGuru |
| Linktree (único link: carta) | https://linktr.ee/pizzerianellos |

Preços: os da carta do local. Nas plataformas alguns valores diferem (ex.: Glovo cobra água 1,50 € e Coca-Cola 2,00 €);
o site avisa que "en plataformas pueden variar". Itens sem preço público (pasta rellena do dia, gnocchi, provolone,
frito napolitano, arancino, sobremesas do dia, refrescos extra) aparecem como notas, sem botão de compra.

## 2. Inventário de mídia (100% do restaurante)

| Arquivo | Origem | Onde aparece |
|---|---|---|
| `fachada-dia.webp` (640×360) | Google Maps · foto `AF1QipPCXpwQ7THhKi4X9OjMxSOyugwLhMX9O5-T6zAg` | La casa (foto principal), galeria |
| `fachada-noite.webp` (512×288) | Google Maps · foto `AF1QipPo4_PYSwuJeH68iRveMIOshO_XWrOxxucaYkD5` | La casa, galeria · `og-nellos.jpg` (prévia ao compartilhar) |
| `bancada-pizza-forno.webp` (512×281) | Google Maps · foto `AF1QipPzF1nEW8OkwyfWTjNiaCEfOZq0G3-7UNyiz71O` | La casa, galeria |
| `pizza-tricolore.webp` (320×425) | Ficha oficial de Nello's no Glovo (foto da loja) | Hero, carta (Tricolore), galeria |
| `pizza-la-rosita.webp` (320×400) | Ficha oficial de Nello's no Glovo (foto da loja) | Hero, carta (La Rosita), galeria |
| `pizza-parmigiana.webp` (320×320) | Glovo · produto 41972133477 | Hero, carta (Parmigiana), galeria |
| `pizza-capricciosa.webp` (320×320) | Glovo · produto 41972133471 | Carta (Capricciosa), galeria |
| `pizza-quattro-stagioni.webp` (320×320) | Glovo · produto 41972133476 | Carta (Quattro Stagioni), galeria |
| `pizza-all-assassina.webp` (320×402) | Glovo · produto 41972133485 | Carta (All'Assassina), galeria |
| `pizza-diavola.webp` (320×320) | Glovo · produto 41972133469 | Carta (Diavola), galeria |
| `pizza-reggina.webp` (320×320) | Glovo · produto 41972133482 | Só galeria, com legenda neutra ("Mortadela italiana y pistacho"): a foto não corresponde aos ingredientes da Reggina na carta |

As fotos de 320 px nunca são esticadas: quadros de no máximo 320 px e lightbox em tamanho nativo.
Logotipo: não havia arquivo oficial; o rótulo tricolor da fachada foi recriado tipograficamente (Great Vibes) e há espaço
`data-logo-slot` para o arquivo oficial.

**Não abriu / foi rejeitado:** Facebook (HTTP 403 sem login), PDF antigo da carta no Drive (HTTP 404), imagens do Linktree e da
galeria do RestaurantGuru (não acessíveis), nenhum vídeo público do restaurante. Rejeitadas na auditoria visual: fotos com marca
d'água (Just Eat, Uber Eats, javirecetas.com, jogo americano "…ARDINO"), fotos genéricas de banco do Glovo e fotos com flash duro.

## 3. QA medido

| Portão | Resultado |
|---|---|
| `qa.mjs --min-loop 8 --min-kf 12` | PASS · scroll horizontal 0 px (1440/768/390) · 44/44/38 loops · 16 keyframes · 56/56 revelam · 0 erro de JS · reduced-motion desliga tudo |
| `qa-legal.mjs --strict` | PASSOU · lang=es · 24 imagens, 0 sem alt · privacidade e termos · consentimento obrigatório não marcado · 0 rastreador, sem banner · contraste ok · foco visível nos 14 primeiros Tabs |
| `qa-nellos.mjs` (E2E) | 57/57 · axe-core WCAG 2.1 AA com 0 violação (página desktop e celular, gaveta, política) · CSP de produção ativa |

## 4. Teste final — 15 itens

1. Identidade do cliente preservada: rótulo tricolor real, azul do letreiro marítimo, caligrafia "Nello's" em preto. ✓
2. Seções ENTRAR → AGIR: hero, la casa, carta, galeria, opiniões, cómo pedir, horário/ubicación, CTA. ✓
3. Nada inventado: preços, pratos, notas, horário e contatos com fonte; sem depoimento individual. ✓
4. Animação contínua em loop o tempo todo (ondas, fotos flutuantes, selo, marquee, fundo). ✓
5. Fundo contextual abstrato: aurora azul, blobs, pontos em deriva, partículas e ondas mediterrâneas. ✓
6. Continuidade: ondas atravessando as bordas da carta, brilhos-ponte entre seções, fio vertical. ✓
7. Scroll variado: clip nos títulos, fade, scale, deslocamento lateral, parallax e entrada dos números (sempre com o valor real no texto). ✓
8. Microinterações em botões, cards, chips, links, fotos e menu. ✓
9. Anti-template: rótulo da fachada, carta napolitana real, fotos da casa, endereço e horário de Cádiz. ✓
10. Mobile-first, 0 scroll horizontal, só transform/opacity. ✓
11. `prefers-reduced-motion` desliga tudo, e há botão de pausa manual (WCAG 2.2.2). ✓
12. Fluxo real testado ponta a ponta no navegador (E2E 57/57). ✓
13. Nenhum botão decorativo (sem JS os botões de compra nem existem; aparece o aviso de pedido por telefone). ✓
14. Mídia 100% real com origem declarada (tabela acima). ✓
15. Publicação na Vercel com HTTP 200 verificado. ✓

**Conformidade:** política de privacidade (coleta, uso, direitos, AEPD) e aviso legal (LSSI-CE art. 10) linkados no rodapé e no
consentimento · identificação real do fornecedor · sem banner de cookies (não há rastreamento) · consentimento explícito, não
marcado, bloqueando o envio · coleta mínima (endereço só para domicílio; alergias tratadas como dado de saúde) · sem bloco de
reembolso (o site não vende) · contraste medido · alt em 100% · teclado e foco visível.

## 5. Pendências para o cliente

- **Dados registrais** (Registro Mercantil: tomo, folio, hoja) não foram encontrados publicamente: não foram publicados.
- **WhatsApp oficial** não confirmado: o envio usa copiar/compartilhar + telefone; basta preencher `whatsapp` em `src/carta.json`.
- **Entrega própria:** a ficha indica "a domicilio", mas a zona e os custos não são públicos; o site diz que o local confirma.
- **Fotos do Glovo:** publicadas pelo restaurante na própria ficha; vale confirmar a autoria e, se possível, enviar fotos próprias.
- **Logotipo vetorial** e **tabela de alérgenos por prato**, se existirem, podem entrar sem mudar o código.

## 6. Publicação

- **No ar:** https://trattoria-pizzeria-nellos.vercel.app — HTTP 200 público, título
  "Trattoria Pizzeria Nello's · Auténtica pizza napoletana en San Fernando (Cádiz)", `og:image` `/og-nellos.jpg`,
  `robots.txt` e `sitemap.xml` servidos.
- Projeto Vercel `trattoria-pizzeria-nellos` (equipe `whsszxx-9424`). Produção atual: `dpl_FyFs45rUFBSp17DpBK72tDZ9SAEw`,
  commit `7764225`, READY/PROMOTED, HTML de 1.228.011 bytes (mesmo tamanho do build local do mesmo commit, que passou nos testes).
- **Ajustes já no GitHub e ainda não publicados:** cifras sem contagem animada (o texto traz sempre o dado real, inclusive
  para buscadores e leitores sem JavaScript) e botão de WhatsApp gerado no build só quando houver número oficial. A Vercel
  recusou o novo deploy com **402 — limite diário de deploys do plano gratuito atingido** (libera em até 24 h).
  Para publicar: painel da Vercel → projeto → *Deployments* → *Create Deployment* → branch `arena/3a2438e4-site`.
- **Deployment Protection:** o domínio de produção é público; as URLs específicas de cada deploy podem pedir login da Vercel.
- **Atualizar:** editar `src/carta.json` → `npm test` → commit/push → novo deploy de produção (push sozinho não publica).
