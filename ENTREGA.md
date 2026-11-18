# La Pizzaria Napolitana · Entrega e revisão

**Data da conferência:** 18 de novembro de 2026.
**Entrega:** `index.html` autossuficiente, 1.204.969 bytes. Fontes e mídia locais, sem dependência de CDN. O site funciona offline para explorar e montar o pedido; o encaminhamento exige conexão.

## O que foi confirmado antes da construção

- **Nicho e proposta:** pizzaria artesanal familiar em Bonsucesso, Fortaleza. Farinha italiana tipo 00, molho de tomate italiano e massa de fermentação lenta, de 48 a 72 horas. Não foram adicionados nomes de fundadores, data de fundação ou certificações.
- **Tarefa do visitante:** escolher pizzas e acompanhamentos, conferir escolhas e valores e encaminhar a solicitação ao atendimento. Sem pagamento, simulação de estoque ou confirmação automática.
- **Identidade:** logo original do cardápio, preto predominante, dourado, creme, vermelho-tomate e detalhes verdes. Tipografia editorial serifada e texto de leitura em DM Sans. O esqueleto e o injetor do arquivo estrelado `WORKSPACE-COMPLETO.zip` deram a base técnica, não a identidade de outro cliente.
- **Arquitetura:** entrada → cardápio e favorita da casa → proposta familiar → avaliações → localização e ação final. Menu, sacola e informações legais permanecem na mesma página.

### Fontes

| Fonte consultada | Uso |
|---|---|
| [Cardápio original no Drive](https://drive.google.com/file/d/1Yz6e1LkARcNe__t8pqA5E-EvNseWEns1/view?usp=sharing) — `Cardapio OK 300.jpg` | Logo, arte, ingredientes, categorias, preços, tipos de bebida, quatro opções de soda italiana e fermentação. O arquivo completo foi obtido pelo conector do Drive. |
| [Ficha da pizzaria no Google Maps](https://www.google.com/maps/place/La+Pizzaria+Napolitana/@-3.7797786,-38.5814713,17z/data=!4m5!3m4!1s0x7c74def973e2ce1:0xb22c875ca277aa7!8m2!3d-3.7797786!4d-38.5814713?hl=pt-BR) | Nome, categoria, Rua Sobreira Filho, 243, Bonsucesso, Fortaleza – CE; telefone e WhatsApp **(85) 98642-8078**; nota **5,0 em 158 avaliações** na consulta; três avaliações públicas em português com nome e fonte. Não é uma contagem em tempo real. |
| [Instagram oficial](https://www.instagram.com/lapizzarianapolitana/) | Proposta familiar e horário: quarta a segunda, 19h–23h; terça fechada. |
| [Publicação sobre a massa](https://www.instagram.com/p/Df4gYKlKNXs/) e [publicação sobre pizza e vinho](https://www.instagram.com/p/DfqUQlIKobK/) | A legenda confirma a farinha 00 e a longa fermentação; links editoriais para as publicações originais. |

## Inventário de mídia utilizada

**Uma única origem para as imagens da marca:** o cardápio enviado pela empresa via link do Drive. Cada linha abaixo é um recorte desse arquivo. São apresentados como **arte do cardápio**, não como ensaio fotográfico do salão, registro de preparo ou fotografia fiel de um sabor específico.

| Mídia | Arquivos locais | Aplicação |
|---|---|---|
| Logotipo original | `marca.webp`, `marca-small.webp` | Cabeçalho, ícone do navegador e apresentação da pizzaria. |
| Pizza com tomate, queijo e manjericão | `pizza-hero.webp`, `pizza-mobile.webp`, `pizza-menu.webp` | Hero responsivo, capa da categoria de pizzas salgadas e prévia de compartilhamento. |
| Pizza doce com chocolate e castanhas | `dolce-small.webp` | Capa da categoria de doces, sem associação a um sabor individual. |
| Garrafa, taça e uvas | `vino.webp` | Capa de bebidas e vinhos, não atribuída a uma garrafa específica. |
| Folhas de manjericão | `basilico.webp` | Detalhe decorativo do hero. |
| Tomates da moldura da favorita | `pomodori.webp` | Acompanhamento visual do destaque “À moda da casa”. |

Grão, filetes, selo tipográfico de fermentação e ícones são elementos gráficos de interface, não imagens apresentadas como fotografia. Nenhuma foto de banco, cliente, outro restaurante ou imagem gerada para substituir uma foto real foi usada.

**Limitação encontrada:** o Maps abriu a ficha e mostrou miniaturas sem comprovação de autoria do proprietário; os vídeos identificáveis estavam ligados a comentários de visitantes. O Instagram retornou perfil, posts e legendas, mas não disponibilizou arquivos de imagem/vídeo nos resultados acessíveis. Nenhuma dessas mídias foi copiada. Não houve tentativa de contornar login ou bloqueio.

**Para completar a galeria fotográfica e o vídeo:** enviar as fotos e os vídeos originais da casa por upload ou pasta compartilhada, com identificação de produto, autoria e permissão. O espaço editorial e a reprodução responsiva já estão preparados em `src/verified-extras.json`. A empresa deve confirmar os direitos de uso comercial da arte fornecida e das futuras mídias; a publicação numa rede social, por si só, não comprova a licença. Imagens de pessoas identificáveis exigem atenção adicional à autorização.

## Pedido funcional

- **40 itens do cardápio:** 12 pizzas salgadas, 5 pizzas doces, 1 mousse, 3 gelatos e 19 bebidas. Os três acessos editoriais dão entrada às categorias reais, com busca por sabor/ingrediente e organização por grupo.
- Preço individual, quantidade, remoção, observações, edição e totalização em centavos. A soma é recalculada a cada alteração. A única bebida sem preço no documento, cerveja zero álcool, entra como **consulta**, nunca como item gratuito.
- Soda italiana com os quatro sabores documentados, contabilizados separadamente. Sem seletores de tamanho, borda, adicionais ou meio a meio sem comprovação.
- Pedido preservado na aba durante a navegação e o recarregamento. Consentimento desmarcado, resumo revisável, abertura do **WhatsApp oficial** ou cópia do mesmo conteúdo. Não há conclusão de compra simulada.
- **Teste de referência:** 1 Marguerita (R$ 45), 1 À moda da casa (R$ 66), 2 sodas de limão siciliano (2 × R$ 16) e 1 cerveja zero sob consulta → **R$ 143,00 de subtotal conhecido**, com a pendência indicada separadamente.

## QA em navegador real

| Viewport | Scroll horizontal | Loops medidos | Animações distintas ativas na medição | Reveals concluídos | Erros JS |
|---|---:|---:|---:|---:|---:|
| Desktop · 1440 × 900 | 0 px | 27 | 11 | 7/7 | 0 |
| Tablet · 768 × 1024 | 0 px | 26 | 10 | 7/7 | 0 |
| Celular · 390 × 844 | 0 px | 20 | 10 | 7/7 | 0 |

- `node tools/qa.mjs index.html`: **PASS**. Em reduced-motion: zero animações ativas e zero conteúdo oculto pelo reveal.
- `node tools/qa-legal.mjs index.html --strict`: **PASS**, sem bloqueios nem alertas. Oito elementos de imagem com `alt`; decoração com `alt` vazio; navegação inicial por teclado com foco visível. Sem rastreadores ou banner desnecessário.
- **32 amostras de contraste** em títulos, texto introdutório, CTA, títulos das capas e crédito da arte, incluindo texto sobre mídia, em 320/390/768/1440 px. Menor contraste medido: **5,38:1 em texto normal** e **4,56:1 em texto grande**. Isso complementa o teste automático, não é certificação de acessibilidade.
- `npm test`: **15 grupos de testes funcionais aprovados** no Chromium. Foram verificados busca, preços, quantidades, opções, subtotal parcial, consentimento, cópia, abertura de nova aba com mensagem exata, persistência, remoção do último item, maiores de idade, controles de avaliação, termos, navegação móvel e uso offline.
- Abertura e edição dos pedidos verificadas em **320, 390, 620, 768, 1024 e 1440 px**. Nenhum pedido de teste foi enviado ao estabelecimento.
- O espaço reservado para vídeo não aparece no site sem arquivo autorizado. Reprodução de vídeo real do estabelecimento não foi testada: nenhum clipe autorizado estava disponível.

## Checklist do script, item por item

1. **Identidade — atendido:** logo, paleta e arte vêm do material fornecido, não do portfólio de outro cliente.
2. **Arquitetura — atendido:** cinco grandes seções organizadas pela jornada de uma pizzaria.
3. **Dados — atendido:** cardápio, preços, contatos, horários e avaliações rastreáveis às fontes acima.
4. **Loop contínuo — atendido:** luz, textura e partículas em ritmos distintos, com pausa voluntária e exceção de acessibilidade.
5. **Fundo contextual — atendido:** calor difuso de forno e partículas finas, sem objeto literal girando.
6. **Continuidade — atendido:** fundo fixo compartilhado, iluminação atravessando seções, filetes e ritmo editorial.
7. **Scroll — atendido:** entrada gradual, revelação por recorte, escala e parallax em elementos diferentes.
8. **Microinterações — atendido:** navegação, capas, botões, quantidades e estados de feedback.
9. **Anti-template — atendido:** caderno de menu da família, favorita real e tempo de fermentação da própria casa.
10. **Responsividade — atendido:** sem overflow nos viewports testados, navegação e pedidos acessíveis no celular.
11. **Reduced-motion — atendido:** movimento suprimido, sem esconder o conteúdo.
12. **Conversão — atendido:** jornada real de pedido testada do item à mensagem revisável.
13. **CTAs — atendido:** destinos oficiais, navegação, filtros, edição, cópia e encaminhamento funcionais.
14. **Mídia — fallback aplicado e identificado:** arte original fornecida, sem imagens de terceiros. Fotografias e vídeos documentais continuam dependentes dos arquivos autorizados da empresa.
15. **Publicação —** conferência do endereço público registrada na seção de publicação desta entrega.

## Conformidade e lacunas deliberadas

- Privacidade e termos descrevem este fluxo. Não há pixel, analytics, cadastro, dados de pagamento nem checkout. Por isso não foram acrescentados banner de marketing ou política de reembolso fictícia.
- **CNPJ, razão social e e-mail institucional:** não documentados; omitidos, a completar pela empresa. Revisão jurídica final é responsabilidade da empresa e de seus assessores.
- **Combos, promoções vigentes e ranking de mais vendidos:** não documentados; não exibidos. O destaque segue a designação “Favorita da casa”, não números de venda. Ofertas aprovadas têm espaço preparado sem blocos vazios.
- **Entrega, retirada, área atendida, taxas, disponibilidade e prazo:** não confirmados nos materiais. O atendimento combina a modalidade; nenhum endereço particular é solicitado nem há promessa de delivery.
- A confirmação da solicitação acontece com a pizzaria, não ao clicar em um link.

## Publicação

**[Abrir La Pizzaria Napolitana na Vercel](https://la-pizzaria-napolitana.vercel.app/)**

Projeto próprio `la-pizzaria-napolitana`, conectado ao repositório. A Vercel devolveu `READY`, `PROMOTED`, `target: production` e confirmou a atribuição do domínio. A página pública foi aberta sem login e retornou o título **“La Pizzaria Napolitana — Pizza artesanal em Fortaleza”**, com a apresentação, as categorias, a favorita, as avaliações, o endereço e o canal oficial corretos.

A referência da entrega está em `qa/publicacao.json`. O teste pós-publicação compara o corpo da resposta pública, não apenas o estado do deploy: exige HTTP 200, `text/html` sem download forçado, título correto, **1.204.969 bytes** e SHA-256 idêntico ao arquivo revisado. Não depende de token da Vercel.
