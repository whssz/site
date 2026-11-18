# La Pizzaria Napolitana

Site estático e caderno de pedidos da pizzaria em Bonsucesso, Fortaleza. Conteúdo em português, sem cadastro, rastreadores, pagamento ou backend fictício.

## Usar

- **`index.html` é a entrega:** abre diretamente no navegador, inclusive offline. Imagens, fontes, CSS e JavaScript estão incorporados. Os links externos de atendimento exigem internet.
- `npm run dev` inicia a prévia na porta 5173 (ou `PORT`).
- `npm run build` gera o HTML e `dist/`, usando apenas o Node. Esse comando executa o **injetor original do estúdio**. A configuração da Vercel publica somente `dist/`, não os arquivos de desenvolvimento.
- `npm ci && npm test` executa a jornada real de pedidos com Chromium e Playwright. A abertura do WhatsApp é interceptada no navegador de teste, sem contactar clientes nem enviar mensagens à casa.
- `npm run qa` executa `tools/qa.mjs` e `tools/qa-legal.mjs --strict`, do workspace fornecido. Apenas a inicialização do Chromium foi adaptada. Em Linux x64, o binário e as bibliotecas de teste vêm do npm; em outros ambientes, instale o Chromium do Playwright ou defina `CHROMIUM_PATH`.

## Atualização editorial

| Arquivo | Responsabilidade |
|---|---|
| `src/restaurant.json` | Canal oficial, endereço, horário, redes e referência da consulta. |
| `src/menu.json` | Catálogo. Preço em **centavos inteiros**; `null` = sob consulta, nunca grátis. |
| `src/verified-extras.json` | Espaços opcionais para mídia autorizada e ofertas confirmadas. As listas vazias não criam seções vazias no site. |
| `src/site.html` | Estrutura, apresentação, navegação, privacidade e termos. |
| `src/site.css` / `src/foundation.css` | Identidade e fundação adaptada do esqueleto do estúdio. |
| `src/app.js` | Busca, filtros, escolhas, sacola, notas, cópia e direcionamento ao WhatsApp. |
| `tools/anim-kit.*` | Kit de movimento do estúdio, tokenizado para a luz do forno. |
| `src/assets` | Somente recortes do cardápio fornecido e textura decorativa; sem imagens de terceiros. |
| `src/fonts` | Cormorant Garamond e DM Sans, subconjunto latino local, licenças OFL incluídas no HTML. |

**Fluxo atual:** 12 pizzas salgadas, 9 doces/sobremesas e 19 bebidas. O visitante escolhe os itens, altera ou remove quantidades, seleciona o sabor da soda quando pertinente, registra observações e revisa os valores. O resumo fica na mesma aba (`sessionStorage`). O consentimento não é salvo. Somente o clique autorizado abre o WhatsApp com a mensagem; o visitante ainda precisa enviá-la. Há cópia independente do resumo, inclusive sem acesso à área de transferência automática.

O rascunho não é salvo em servidor e não existe integração de estoque. Sem comprovação da modalidade, não há seletor de entrega/retirada, cobrança de frete ou promessa de prazo. Não há meio a meio, tamanhos ou bordas adicionadas por suposição.

### Incluir fotos e vídeos reais

Coloque os arquivos **autorizados** em `src/assets`. Em `src/verified-extras.json`, `heroMedia` aceita um registro ou `null`; `gallery` aceita uma lista de registros. Campos: `type` (`photo` ou `video`), `src` (caminho local iniciado por `assets/`), `source` (fonte comprovável), `approved` (somente `true` após autorização), `width`, `height`, `alt` descritivo e `caption`. Vídeo também exige `poster` WebP/AVIF. Exporte MP4 curto sem áudio; imagens WebP/AVIF. Não aponte para CDNs das redes sociais.

O build rejeita registros sem origem, aprovação, dimensões ou arquivo local. Com vídeo, o site mantém o cartaz em celular/reduced-motion, pausa fora de vista e reproduz **no máximo um** clipe visível, silencioso, em loop. Não há vídeo ou fotografia do salão publicado nesta edição. Mantenha o HTML preferencialmente abaixo de 3 MB.

### Combos, promoções e dados adicionais

Cadastre apenas ofertas **realmente documentadas**. Uma oferta em `menu.json`, com descrição, preço, `source`, `approved: true` e grupo `Combos` ou `Promoções`, pode ser indicada por `id` na lista `promotionIds` dos extras. Ela ganha ação funcional no mesmo carrinho. Remova-a quando expirar. Não há oferta promocional presumida nesta edição.

O destaque “À moda da casa” reproduz **Favorita da casa** do cardápio. Não representa um ranking de vendas. Prefira atualizar o cardápio, endereço, horários e WhatsApp a partir da própria empresa; a data e a contagem das avaliações em `restaurant.json` devem acompanhar nova consulta.

## Conteúdo e integridade

Consulte **`ENTREGA.md`**: fontes, inventário de mídia, verificações, checklist e pendências para a empresa. Nenhum arquivo privado do ZIP do estúdio nem ativo de outro cliente é publicado pelo site.
