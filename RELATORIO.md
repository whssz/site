# Avó Maria Pizza — Revisão de entrega

**Fontes consultadas em 18 de novembro de 2026.** A jornada é entrar → entender → explorar → confiar → agir. Neste negócio, a tarefa principal é escolher pizzas e montar um pedido, para recolha ou entrega. Não é um formulário genérico nem um checkout.

## Fontes e decisões editoriais

- [Google Maps — Avó Maria Pizza](https://www.google.com/maps/place/Av%C3%B3+Maria+Pizza/data=!4m2!3m1!1s0xd1ec96d8b076a93:0x8884c7943ef92b4a): pizzaria, morada, localização, telefone fixo, horário e nota de 4,8/5. O horário está explicitamente atribuído ao Maps, com link para confirmação; o [Linktree oficial](https://linktr.ee/avomariapizza) apresenta um horário de fecho diferente. Não calculamos um estado “aberto agora”.
- [Perfil oficial no Instagram](https://www.instagram.com/avomaria.pizza/): fermentação natural; [a Avó Maria e as raízes da marca](https://www.instagram.com/p/DfDK4RrxYsZ/); [Valpaços, onde a Avó nasceu](https://www.instagram.com/p/DYorMwFCr5B/); [distinção Solete Fast Good](https://www.instagram.com/p/DRj6uhIAsz9/). Edições sazonais não entraram na carta atual sem confirmação de disponibilidade.
- [Link adicional enviado](http://tinyurl.com/AvoMariaPizza): redireciona para a [loja de pedidos da pizzaria na Uber Eats](https://www.ubereats.com/pt/store/avo-maria-pizza-parede/8RKTFAw3RQWpKLU7iEVhPA). A seleção mostra 26 itens, organizados em 4 categorias, com valores de referência da plataforma. Os destaques são os três marcados como mais apreciados na loja, não uma classificação inventada de vendas. Existe uma secção promocional no canal; condições e disponibilidade ficam na plataforma. Não foram inferidos combos, tamanhos, bordas ou adicionais.
- [Guia Repsol — ficha da Avó Maria](https://www.guiarepsol.com/es/fichas/solete/avo-maria-pt405269/): corrobora morada, telefone, e-mail de contacto, pizzas de estilo napolitano e o Solete. As fotografias da ficha não foram incorporadas sem inspeção dos arquivos.
- **Drive**: `WORKSPACE-COMPLETO.zip` e os sete Markdown anexados foram revistos. O ZIP incluía o esqueleto, o injetor e as ferramentas de QA; não foi localizado ali um ficheiro identificável da marca Avó Maria. Foi usado o logótipo da própria pizzaria publicado no Linktree. As imagens de outros clientes no material serviram apenas como referências de processo, não como mídia do site.

## Mídia publicada no site

| Ativo local | Origem | Aplicação |
| --- | --- | --- |
| `assets/identidade.webp` | Logótipo do [Linktree da empresa](https://linktr.ee/avomariapizza), ligado no Maps | Cartão da história |
| `assets/simbolo.webp` | Recorte do mesmo logótipo, sem recriar o desenho | Cabeçalho, rodapé e ícone da aba |
| `assets/pizzas-a-mesa.webp` | Fotografia de capa da [loja de pedidos da Avó Maria](https://www.ubereats.com/pt-en/store/avo-maria-pizza/8RKTFAw3RQWpKLU7iEVhPA), encontrada na indexação da mesma loja do link adicional | Fotografia principal do hero e galeria “À mesa” |
| `assets/cartao-da-avo.webp` | Capa da [loja de pedidos atual](https://www.ubereats.com/pt/store/avo-maria-pizza-parede/8RKTFAw3RQWpKLU7iEVhPA) | Galeria “O cartão da Avó” |

As capas não estão associadas a sabores individuais. Só estavam disponíveis em resolução limitada, foram inspecionadas e são servidas localmente em WebP no HTML, sem imagens geradas, banco de imagens ou fotos de clientes. Confirme com a empresa a autorização de reutilização **do logótipo e das duas fotografias**, incluindo eventual crédito ao fotógrafo, antes da divulgação comercial.

O Instagram disponibilizou o perfil, as legendas e o endereço de um reel oficial, mas não os arquivos de imagem/vídeo para incorporar. O reel está **ligado, não alojado nem reproduzido no site**. A vista disponível do Maps mostrou fotos, mas não identificou o autor das imagens; nenhuma foi usada. As imagens individuais do catálogo não puderam ser baixadas e inspecionadas; há grafismos neutros nas fichas. Enviar uma foto de capa em alta resolução, fotos originais identificadas por pizza e MP4s autorizados completaria essa parte do briefing. O espaço de vídeo no hero já está preparado.

## Checklist do script

| # | Verificação | Resultado |
| --- | --- | --- |
| 1 | Identidade | Identidade escrita e logótipo oficial do Linktree aplicados; ficheiro de marca em alta não recebido. |
| 2 | Pelo menos quatro grandes secções | Sete: entrada, carta, história, galeria, promoções, visita e ação final. |
| 3 | Informações reais | Carta e dados atribuídos às fontes; divergência de horários explicitada; sem ofertas ou contactos fabricados. |
| 4 | Movimento infinito | Camadas fixas e pormenor no cabeçalho movem-se durante a navegação, exceto com redução de movimento ou pausa escolhida. |
| 5 | Fundo contextual | Luz, textura de farinha em deriva, formas e partículas suaves. |
| 6 | Continuidade | Fundo comum, arcos, faixa em diagonal, linha lateral e luz de transição entre secções. |
| 7 | Scroll | Reveal em fade, escala, clip e deslocamento; parallax em ecrãs maiores. |
| 8 | Microinterações | Botões, cards, galeria, navegação, opções e feedback do pedido. |
| 9 | Design específico | Selo da capa, arco inspirado no forno, carta impressa e ilustração oficial da Avó Maria. |
| 10 | Responsividade e peso | 320/390/768/1440 px sem rolagem horizontal; HTML autossuficiente menor que 370 kB. |
| 11 | Preferência de movimento | `prefers-reduced-motion` e controlo de pausa verificados. |
| 12 | Conversão real | Produtos, quantidades, remoção, subtotal, modalidade, notas, edição, resumo e cópia testados. Recolha por telefone e entrega pela Uber Eats; não há WhatsApp oficial confirmado. |
| 13 | CTAs | Ações ligadas a âncoras, seleção, diálogos ou canais reais; sem confirmação de pedido simulada. |
| 14 | Mídia própria | Logótipo e duas capas verificadas. Em falta: originais do Instagram/Maps, vídeo local e fotos identificadas por item (ver inventário). |
| 15 | Publicação | Projeto preparado para implantação estática na Vercel. Versão de revisão sem indexação enquanto persistirem pendências de conteúdo. |

**Conformidade:** privacidade e termos acessíveis no rodapé; zero rastreadores, cookies analíticos, formulários de dados pessoais ou pagamentos. Como não há checkout, não há política de reembolso inventada. O site apresenta o nome comercial, a morada e contactos confirmados; denominação social e NIF/NIPC não foram disponibilizados. Confirmar identificação legal com a empresa antes da divulgação comercial.

## QA em Chromium

| Ecrã | Rolagem horizontal | Animações contínuas | Reveals visíveis | Erros JS |
| --- | ---: | ---: | ---: | ---: |
| 1440 × 900 | 0 px | 32 | 21/21 | 0 |
| 768 × 1024 | 0 px | 32 | 21/21 | 0 |
| 390 × 844 | 0 px | 25 | 21/21 | 0 |

- `prefers-reduced-motion`: zero animações em execução, nenhum reveal oculto.
- `qa-legal.mjs`: zero bloqueantes e zero avisos; sete instâncias de imagens com `alt`. Sem problemas no teste automatizado axe WCAG A/AA da página e do pedido.
- Seis testes unitários passaram. No navegador: filtro e expansão da carta; seleção persistente; alteração e remoção; validação da modalidade; cálculo em cêntimos; notas e resumo idêntico ao texto copiado; caminhos de recolha/entrega; foco, Escape e navegação da galeria. Nenhum pedido foi efetivamente enviado durante os testes.
