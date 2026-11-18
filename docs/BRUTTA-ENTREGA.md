# Brutta Pizzeria Napoletana · Relatório de entrega

Consulta das fontes e da ementa: **18 de novembro de 2026**. Esta versão destina-se a revisão; o lançamento da versão oficial depende dos originais autorizados e da confirmação do operador.

## Pesquisa e decisão de projeto

Foram consultados os sete guias e o `WORKSPACE-COMPLETO.zip` marcado com estrela no Drive. O esqueleto, o kit de movimento e os verificadores serviram de base técnica; nem o ZIP nem os anexos continham originais da Brutta. A investigação sobre a marca, o menu e os canais precedeu a implementação.

O negócio é uma pizzaria de Paço de Arcos (Oeiras), de pizza napolitana artesanal, massa de fermentação lenta e forno a lenha. Dado o foco em comida, visita e encomenda, a página abre a carta sem exigir registo nem clique para WhatsApp. O pedido local deixa a pessoa escolher, corrigir e rever a seleção antes de sair do site. A visita continua disponível a partir do hero e do rodapé.

| Etapa | Secção e função |
| --- | --- |
| Entrar | Hero com a proposta, acesso à carta e à visita. |
| Entender | A Casa: a história relatada por Rosario Corsa e os dois elementos do método que a Brutta anuncia. |
| Explorar | Ementa: 24 artigos, cinco categorias, Margherita/Diavola/Alla Mortadella em destaque, lista editável. |
| Confiar | Três publicações oficiais selecionadas e acesso ao perfil e às avaliações no Maps (sem nota fixa). |
| Agir | Morada, horário, chamada, rotas e volta à ementa. No pedido, copiar resumo e seguir para telefone ou Uber Eats. |

A direção parte da fachada descrita e do universo do forno: grafite, latão dourado, papel areia, castanho e verde-oliva profundo. O arco e a luz da brasa ligam hero, capas, carta e morada. Fraunces editorial e Manrope funcional; letreiro tipográfico que usa o nome existente, não um logótipo oficial fabricado. A identidade visual pode receber o ficheiro original sem mudar a arquitetura. A animação deriva do esqueleto do estúdio e do **ANIM-KIT v2**: luz/brasas abstratas, faixa, fio luminoso, ponto do letreiro e transições em ponte. Variações de reveal incluem fade, recorte, entrada lateral, escala e parallax interior no desktop. Em dispositivos pequenos há menos partículas; a preferência do sistema e o botão de pausa retiram a animação.

### Fontes factuais

| Origem consultada | Dado utilizado / limite |
| --- | --- |
| [Google Maps fornecido](https://maps.app.goo.gl/jygaM19DWLBHLGwM6?g_st=ic) | Nome no Maps: Restaurante Brutta Maravilhoso; Av. Patrão Joaquim Lopes 4, 2770-134 Paço de Arcos; +351 967 079 666; terça a domingo 12h–15h e 19h–22h, segunda encerrado; botão de pedidos leva à Uber Eats. A pontuação não foi copiada. |
| [@bruttapizzeria](https://www.instagram.com/bruttapizzeria/?hl=pt) | “Pizzeria artigianale”, forno a lenha, fermentação lenta, telefone de contacto/encomendas. Não identifica WhatsApp. [Anúncio da Uber Eats](https://www.instagram.com/p/DVby6apiHQs/) confirma a plataforma. |
| [Uber Eats — Recolha](https://www.ubereats.com/pt/store/brutta-pizzeria-napoletana/G0H3mOCHRaeVF32RekQ3zw?diningMode=PICKUP) | 24 artigos, nomes/descritivos e valores de recolha verificados na consulta. Não são preços de balcão, preço de entrega, taxas, disponibilidade ou garantia de preço. O site apresenta a data da consulta. |
| [Uber Eats — loja](https://www.ubereats.com/pt/store/brutta-pizzeria-napoletana/G0H3mOCHRaeVF32RekQ3zw) | Entrega na plataforma no endereço correspondente. A plataforma confirma cobertura, taxas, disponibilidade e preço. Não foi encontrada integração oficial para importar este carrinho. |
| [New in Oeiras — entrevista](https://newinoeiras.nit.pt/comida/novo-italiano-em-paco-de-arcos-tem-hamburguer-de-pizza-aprovado-por-isaltino-morais) · [anúncio do Pátio Antico](https://www.instagram.com/p/DQaP7a5DLhH/) | Chef Rosario Corsa, origem napolitana, abertura ao lado do Pátio Antico, intenção rústica e origem do nome. Horários/preços históricos do artigo não usados. |
| [Tripadvisor](https://www.tripadvisor.pt/Restaurant_Review-g1212457-d34442500-Reviews-Brutta_Pizzeria_Napoletana-Paco_de_Arcos_Oeiras_Lisbon_District_Central_Portuga.html) · [BellaCiao](https://bellaciao.pt/restaurante/restaurante-brutta/) | Corroboração do tipo de casa, forno e localização. Sem testemunhos incorporados. |

Não foram adicionados tamanhos, extras, personalizações, reserva, stock, pagamentos, prazos, taxas ou área de entrega. O telemóvel publicado é tratado como **telefone**, não como WhatsApp. Não se pede morada para entrega. O subtotal de referência continua identificado como tal nos dois modos, inclusive na cópia.

## Origem e colocação visual

**Nesta versão: 0 fotos, 0 vídeos incorporados, 0 imagens de terceiros e 0 hotlinks.** As capas são composições gráficas, sem simular produtos nem o espaço real. A galeria leva ao conteúdo oficial fora do site.

| Elemento publicado | Colocação / origem e direitos |
| --- | --- |
| Letreiro de texto, selo circular, ícones vetoriais e favicon B | Cabeçalho, rodapé, capa principal e controlos. Grafismo criado para a página; nome comercial confirmado. Não se apresenta como logótipo oficial. |
| Arco, halo, partículas, grão e fio luminoso | Fundo contínuo e hero. CSS/SVG locais inspirados no forno; sem ficheiro de fotografia. Movimento do esqueleto/ANIM-KIT adaptado. |
| Cartaz “De Nápoles. Para a mesa.” | A Casa. Cartaz tipográfico local, não foto da sala nem citação do chef. |
| Capas de Margherita, Diavola e Alla Mortadella | Destaques da carta. Cada artigo tem padrão, texto e cor, sem tentativa de mostrar a pizza. |
| “Noites de verão” | Capa verde da galeria, link para o [reel oficial](https://www.instagram.com/p/DXCtGDfCJaZ/). Grafismo local, mídia permanece no Instagram. |
| “Amore, fuoco e pizza” | Capa castanha da galeria, link para a [publicação oficial](https://www.instagram.com/p/DU6fQM3CHES/). Grafismo local, sem miniatura da publicação. |
| “Brutta Saladas” | Capa dourada da galeria, link para o [reel oficial](https://www.instagram.com/p/DVRgf-WiFyu/). Grafismo local, sem miniatura da publicação. |
| Placa tipográfica “N.º 4” | Visite-nos. Texto da morada verificada, grafismo local que não representa uma placa real. |
| Fraunces normal/itálica e Manrope variável | Tipografia de toda a página. WOFF2 distribuídos por Fontsource, com licenças SIL OFL 1.1 em `src/assets/fonts/` e no HTML. |

### Por que os originais não entraram

- **Instagram:** links e metadados abertos, mas os URLs `/embed/` experimentados devolveram HTTP 400, e não foi disponibilizado um original que pudesse ser guardado com autoria e permissão demonstradas.
- **Maps:** as miniaturas da ficha não identificaram autoria; Street View não forneceu uma imagem de fachada apta. Não foram descarregadas imagens para o site.
- **Tripadvisor e imprensa:** as duas imagens da galeria do Tripadvisor estão identificadas como fotografias de viajantes. A galeria da New in Oeiras é publicada pela imprensa, sem autorização de republicação confirmada.
- **Uber Eats:** acesso direto aos ficheiros CDN tentado sem sucesso. A presença na plataforma não comprova que a Brutta detenha os direitos para nova publicação.
- **Drive/anexos:** material de estúdio, sem fotos ou vídeos próprios desta pizzaria.

**Para completar:** enviar fotografia original da fachada/letreiro, da sala e do forno, e de cada uma das três pizzas em destaque (identificar qual pizza em cada ficheiro). Se houver, enviar logótipo vetorial e vídeo curto próprio, com indicação do autor e autorização de uso no site; um link direto para uma publicação pode ajudar, mas publicação pública não equivale a licença. Os slots de hero, história, menu, galeria e visita já aceitam imagem responsiva e poster. Imagens novas precisam de `alt` descritivo, crop/contraste revistos, lazy-load fora do hero e QA de tamanho e movimento.

## Conformidade e privacidade

- Política e Termos estão no rodapé. O carrinho e a preferência de pausa usam armazenamento local; a nota não fica guardada nem sai do site sem ação do utilizador. O alojamento trata acessos técnicos; nenhum script de métricas, pixel, chat ou embed de terceiros é carregado pela página.
- Não há formulário de recolha de dados pessoais, envio ou pagamento. Não há banner de cookies nem cláusula de devolução de venda inexistente. O WhatsApp não está ativado. Se o canal for confirmado, rever a política de contacto/partilha e repetir o QA antes de publicar o número.
- Foi colocado o link para o [portal oficial do Livro de Reclamações](https://www.livroreclamacoes.pt/Inicio/). Isto não pressupõe que o registo da Brutta no portal tenha sido confirmado. Confirmar o registo e as indicações aplicáveis com o operador ([ASAE](https://www.asae.gov.pt/reclamacoes-e-denuncias/livro-de-reclamacoes.aspx)).
- **Pendente para lançamento oficial:** denominação social, NIF/NIPC, identificação comercial aplicável, morada de sede se distinta, e-mail de contacto/privacidade e confirmação da entidade de resolução alternativa de litígios (RAL) aplicável, se houver. Consultar [art. 10.º do Decreto-Lei 7/2004](https://www.anacom.pt/render.jsp?contentId=952094) e art. 18.º da Lei 144/2015 na redação vigente. Dados não verificados não entram na página. Este relatório e o QA são verificações técnicas, não parecer jurídico nem certificação WCAG.

## QA executado no navegador

`npm test` executou o build, `tools/qa.mjs`, `tools/qa-legal.mjs --strict` e `tools/test-order.mjs` com Chromium 153.0.8010.0. Build: **269 685 bytes**, 24 artigos; SHA-256 `adbd794b0a409c82a54cb4be4d1e6b7481fd14f04e897b793ee7b27909eaff52`.

| Viewport | Scroll horizontal | Loops ativos | Keyframes ativos distintos | Reveals | Erros JS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop 1440 × 900 | 0 px | 33 | 13 | 17/17 | 0 |
| Tablet 768 × 1024 | 0 px | 33 | 13 | 17/17 | 0 |
| Mobile 390 × 844 | 0 px | 24 | 13 | 17/17 | 0 |

- **Fluxo real em Chromium:** 2 Margherita, 1 Brutta Roquefort e 1 Tiramisú → 46,00 €; aumentar Margherita → 58,00 €; diminuir → 46,00 €; retirar o burger → 31,00 €. Resumo linha a linha, nota e texto da área de transferência coincidiram. Entrega abriu o URL da loja (destino intercetado no teste, sem fazer pedidos). Recolha aponta para o telefone confirmado; não foi efetuada uma chamada.
- Carrinho restaurado após reload; notas não persistentes; Esc fecha e restitui foco; botão de limpar e remoção individual testados; navegação, separadores e legais acessíveis por teclado. Cópia manual testada com área de transferência indisponível. Carrinho a 320 px sem overflow; controlos de toque no carrinho com mínimo de 44 × 44 px.
- Pausa persistente e `prefers-reduced-motion` verificados. HTML aberto offline e subtotal calculado sem rede. Ementa visível sem JavaScript. Sem pedidos a terceiros durante navegação normal.
- **Acessibilidade:** QA legal sem alertas técnicos, com foco visível em 14 paragens iniciais. Axe: 0 violações automáticas na página e nos carrinhos desktop/mobile; regra de contraste pediu revisão de fundos compostos. Medição adicional por pixels do fundo em 1440/390 px e no carrinho mobile: menor rácio para texto normal de **4,96:1 / 4,57:1 / 5,51:1** e para texto grande de **5,26:1 / 5,26:1 / 6,48:1** nas amostras verificadas. Zero imagens fotográficas; SVGs de decoração fora da árvore acessível.

## Checklist do estúdio (15 itens)

| # | Critério | Estado |
| ---: | --- | --- |
| 1 | Identidade preservada | Nome, nicho e direção visual preservados. Falta logótipo/originais para validar a identidade gráfica com a Brutta. |
| 2 | ≥4 secções com jornada completa | **OK:** cinco secções principais, mais rodapé e carrinho. |
| 3 | Dados sem invenção | **OK:** fontes e limites acima. Sem preços diretos, notas ou dados legais não validados. |
| 4 | Movimento contínuo em loop | **OK:** ponto do letreiro, fio e fundo; ver números acima. |
| 5 | Fundo abstrato contextual animado | **OK:** luz, grade, brasa e tons do forno, sem objetos literais. |
| 6 | Continuidade entre secções | **OK:** transições em ponte, fio, faixa e gradação de grafite para papel. |
| 7 | Reações variadas ao scroll | **OK:** fade, recorte, escala, lateral e parallax desktop. |
| 8 | Microinterações | **OK:** hover, foco, feedback ao adicionar, navegação e separadores. |
| 9 | Direção premium e antitemplate | **OK para revisão:** arco, casa, placa N.º 4 e carta desenhados para a Brutta. |
| 10 | Mobile e performance | **OK:** 0 px de scroll lateral nos viewports testados, HTML único < 3 MB. |
| 11 | Reduced motion | **OK:** 0 loops ao reduzir movimento; sem conteúdo de reveal escondido. |
| 12 | Fluxo ponta a ponta | **OK no site:** carrinho → revisão → cópia e canal oficial; confirmação continua fora do site. |
| 13 | Nenhum botão decorativo | **OK:** links e controlos têm ações, SVGs decorativos não são controlos. |
| 14 | Fotos/vídeos reais com origem | **Pendente:** faltam originais e autorização. Galeria provisória apenas com grafismos e links oficiais. |
| 15 | URL Vercel pública verificada | Ver estado da publicação abaixo. |

**Secção 16:** termos/privacidade, minimização, ausência de tracking, adaptação ao fluxo sem venda e QA técnico **OK**. Identificação jurídica do fornecedor, enquadramento RAL e confirmação do Livro de Reclamações **pendentes de validação**. Não equivale a um lançamento oficial completo.

## Publicação

O deploy deve usar apenas um projeto separado da Brutta e o commit da branch `arena/ad59ad84-site`. Entregar o endereço como versão de revisão, com acesso anónimo verificado; manter `noindex` até à revisão final. Não usar nem atualizar um projeto de outro cliente.
