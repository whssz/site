# Dai Friarielli Malagueta — entrega e revisão

**Versão informativa:** site da pizzaria com ementa navegável e pedido montado no navegador. Não há checkout nem criação de encomenda. Os preços diretos, as condições de entrega/recolha, a autorização de média e a identificação formal são pendências para validação pela casa.

## Pesquisa e decisões

Antes da implementação, foram revistos `COMECE-AQUI.md`, `PROMPT-DE-ABERTURA.md`, `SCRIPT-UNIVERSAL.md`, `GUIA-DE-ESTILO.md`, `DEPLOY.md`, `CONFORMIDADE-E-LEGAL.md` e `ATALHOS.md`, bem como as bases, ferramentas, portfólio e mídias de referência do workspace estrelado. As imagens do workspace pertencem a exemplos de outros projetos: nenhuma foi reutilizada. A linguagem visual da entrega segue os tons marinho/grafite, rosé e creme solicitados, tipos serifado, cursivo e de leitura, e contornos ovais. Sem ficheiro verificável do logótipo, o nome é composto tipograficamente; o pequeno ornamento com a inicial não é apresentado como a marca oficial.

| Fonte consultada | Incorporação e limite |
|---|---|
| [Perfil da Dai no Instagram](https://www.instagram.com/daifriariellimalagueta/) e [Google Maps](https://www.google.com/maps?cid=9029508608175829570&hl=pt-PT) | A casa em Largo João dos Santos 13A, Murtal, 2775-102 Parede, o mapa e o telefone público **+351 21 598 6555** (chamadas). O número de chamadas não foi convertido em WhatsApp. Sem tabela semanal confirmada, a secção Visitar indica como consultar o horário; não exibe os horários de diretórios. |
| [Publicação sobre o forno](https://www.instagram.com/p/DVlMcw6l5gs/) e [apresentação da ementa](https://www.instagram.com/p/DVlSTidlxiC/) | Cozinha italiana, pizzas artesanais, massas, sobremesas e forno de mosaico fabricado em Itália. Não se atribui ano de fundação nem se repetem superlativos promocionais como factos. |
| [Ementa pública da Dai no Uber Eats](https://www.ubereats.com/pt/store/dai-friarielli-malagueta/jbKPBI8IT8CLSLdkKLpEkw) | Origem da seleção de 29 artigos e descrições disponíveis. Não garante stock ou integralidade da ementa presencial. Recolha/entrega são mostradas no resumo apenas como preferências; a plataforma informa disponibilidade para o visitante. Preços, horários e cobertura do app não foram tratados como informações diretas da casa. |
| Instagram oficial e ficha do Google | Ligações às publicações da própria casa e às avaliações na origem, sem copiar depoimentos. Novidades encaminha ao perfil oficial: sem anúncio de promoção não verificada. |

## Inventário visual e permissões

**Fotografias/vídeos copiados, incorporados ou publicados: 0.** No Maps, a foto principal não abriu e não foi possível verificar autoria das miniaturas. No Instagram, abriram as legendas/metadados, mas o acesso aos ficheiros originais não foi obtido. Não foi contornado nenhum bloqueio. Também não foi possível confirmar autoria/autorização das fotos na plataforma de pedidos nem casamento foto–prato. Sem reutilização de ficheiros sem validação, foto de cliente, banco de imagens, geração de imagens ou hotlink social.

| Elemento | Origem · colocação · condição de uso |
|---|---|
| Nome tipográfico, ornamento “D” e favicon oval | Código do site, cabeçalho/rodapé/separador. Identificação editorial provisória, não logótipo oficial nem proposta de rebranding. |
| Medalhão abstrato, frisos, ramo e malagueta | SVG do site, hero, especialidades, Novidades e elementos decorativos. Alusão aos grelos, à malagueta e à cerâmica; não reprodução fotográfica. |
| Selo de forno, traços de massa e símbolo de sobremesa | SVG do site, A casa, especialidades e cartões de Galeria. Grafismo decorativo, sem afirmar aparência do forno ou do prato. Ícones operacionais do próprio HTML; fundos e filetes no CSS. |
| [O forno da casa](https://www.instagram.com/p/DVlMcw6l5gs/) | Galeria → publicação no perfil da Dai, e link em A casa. Só ligação; sem ficheiro/miniatura ou alegação de direito de reprodução. |
| [Pizza, massa e tiramisù](https://www.instagram.com/reel/DORr-JbjQ1S/) | Galeria → reel no perfil da Dai. Só ligação; sem ficheiro, reprodução ou autoplay externo. |
| [Sabores de Itália](https://www.instagram.com/p/DORsMn6FYgx/) | Galeria → publicação no perfil da Dai. Só ligação; sem ficheiro/miniatura. |
| Cormorant Garamond · `display.woff2` | Títulos, ementa e selo; [Fontsource Variable](https://www.npmjs.com/package/@fontsource-variable/cormorant-garamond/v/5.3.0), SIL OFL 1.1. |
| Allura · `script.woff2` | Caligrafia de destaque; [Fontsource](https://www.npmjs.com/package/@fontsource/allura/v/5.3.0), SIL OFL 1.1. |
| Manrope · `text.woff2` | Navegação, texto e controlos; [Fontsource Variable](https://www.npmjs.com/package/@fontsource-variable/manrope/v/5.3.0), SIL OFL 1.1. |

As licenças das três fontes estão em `assets/fonts/` e no HTML exportado. Para substituir o fallback visual, precisamos do **logo oficial** e de originais autorizados do forno/espaço e dos pratos (preferência: Pizza Malagueta, gnocchi e tiramisù), incluindo identificação de cada prato, autorização para o site e permissão das pessoas identificáveis, se aparecerem. Links diretos oficiais são úteis para localizar e atribuir, não constituem por si só licença de download. Slots para hero, produtos, A casa, Galeria e CTA estão prontos.

## Checklist do estúdio — 15 pontos

| # | Estado | Critério |
|---|---|---|
| 1 | Parcial | Direção visual e nome conforme o briefing; logótipo original não localizado. |
| 2 | OK | Sete secções: abertura → casa/forno → ementa → especialidades → galeria/novidades → visita/pedido. |
| 3 | OK | Produtos e contactos rastreados às fontes; sem dados operacionais inventados. Preço direto, horário completo e promoção omitidos. |
| 4 | OK | Loops contínuos independentes, ativos também na secção final; pausa pelo utilizador. |
| 5 | OK | Fundo separado com luz morna, campos cromáticos, textura de grão e partículas discretas. |
| 6 | OK | Seis secções-ponte, linha luminosa no desktop, textura partilhada e ritmos de transição. |
| 7 | OK | Entradas com recorte, desvanecimento, escala e deslocamento; parallax no desktop, sem deslocamento extra no mobile. |
| 8 | OK | Estados de foco, toque e hover; realce ao adicionar, contador e estado do carrinho. |
| 9 | OK | Texto, visual e destaques específicos: Murtal, forno italiano, friarielli, Pizza Malagueta e tiramisù. |
| 10 | OK | 0 px de overflow nos três viewports do gate e nas 14 larguras da regressão; loops em transform/opacidade. |
| 11 | OK | `prefers-reduced-motion` sem loops ou revelações ocultas, com opção explícita de pausa no rodapé. |
| 12 | OK com alternativa prevista | Fluxo real testado até à cópia: artigos, quantidades, remoção, preferência, observações e persistência. WhatsApp direto apenas testado isoladamente; sem número oficial não há envio. |
| 13 | OK | Chamadas, rota, links, navegação, carrinho, cópia, informação legal e pausa acionáveis. |
| 14 | Fallback conforme a regra de origem | Nenhuma mídia falsa; Galeria aponta para a origem. Fotos/vídeos reais no corpo e logótipo dependem dos originais autorizados. |
| 15 | Produção | Publicação prevista em [dai-friarielli-malagueta.vercel.app](https://dai-friarielli-malagueta.vercel.app). A confirmação HTTP e da versão servida é feita no fecho da entrega. |

## QA em Chromium 131

| Viewport | Overflow | Loops contínuos | Keyframes ativos | Revelados / elegíveis | Erros JS |
|---|---:|---:|---:|---:|---:|
| Desktop · 1440 × 900 | 0 px | 28 | 12 | 24/24 | 0 |
| Tablet · 768 × 1024 | 0 px | 27 | 11 | 23/23 | 0 |
| Mobile · 390 × 844 | 0 px | 21 | 11 | 23/23 | 0 |

- `tools/qa.mjs` e `tools/qa-legal.mjs --strict`: gates aprovados em navegador, incluindo foco visível nos primeiros 14 elementos percorridos por Tab. `npm test`: 4 testes. `npm run test:browser`: navegação por toque e teclado, carrinho e cópia real, alternativa de cópia manual, verificação do resumo, fixture de validação de WhatsApp e layout entre 320–1920 px.
- axe sem violações WCAG A/AA nas duas páginas/estados testados (desktop e carrinho mobile); contraste amostrado contra o fundo composto, por exemplo: subtítulo do hero **7,27:1**, botão primário **8,26:1**, descrição da ementa **8,93:1**, texto da galeria **6,15:1**, morada **5,49:1**. A medição automatizada não substitui testes com leitores de ecrã e dispositivos reais.
- HTML autossuficiente ≈ **263 kB**, ou ≈ **126 kB em gzip** local; abaixo do orçamento de 3,2 MB. Sem pedidos externos no carregamento inicial, sem widgets e sem telemetria do site. Reformulação do kit do estúdio para conservar o ambiente e não animar dimensão/posição de layout nos loops. O build é reproduzível sem instalar dependências de produção.

## Verificação aplicável a Portugal

| Verificação | Estado nesta edição |
|---|---|
| Privacidade, termos, `lang="pt-PT"` e título | Publicados e ligados no rodapé. O texto explica o que fica no dispositivo, registos técnicos possíveis no alojamento, destinos externos e como pedir exercício de direitos. |
| Identificação do operador | Morada do estabelecimento e telefone visíveis. **Pendente:** denominação social, NIF/NIPC, sede e contacto escrito do responsável pelo tratamento confirmados pelo operador. Não foram publicados dados fictícios. |
| Livro de Reclamações e RAL | O rodapé liga para o [portal oficial do Livro de Reclamações Eletrónico](https://www.livroreclamacoes.pt/Inicio/). Confirmar registo da casa e entidade RAL aplicável antes de promoção comercial do site; não se declara adesão. Referências: [ASAE — Livro de Reclamações](https://www.asae.gov.pt/reclamacoes-e-denuncias/livro-de-reclamacoes.aspx) e [ASAE — RAL](https://www.asae.gov.pt/perguntas-frequentes1/area-economica/resolucao-alternativa-de-litigios-de-consumo.aspx). |
| Cookies e rastreio | Nenhum tracker nem banner. Só armazenamento funcional do pedido (sessão) e preferência de movimento (no dispositivo); observações não são persistidas pelo site. |
| Formulário e minimização | Só preferências e observações locais nesta versão; não pede nome, telefone ou morada. Morada e consentimento não pré-marcado, validados no teste isolado, só podem ser ativados para entrega direta confirmada. |
| Venda, reembolso e alergénios | Não há pagamento, contrato ou confirmação no site, por isso não há política de checkout/reembolso inventada. O texto recomenda confirmar alergénios com a casa; antes de aceitar pedidos diretos a distância, validar informação alimentar e condições de venda com o operador. |
| Contraste, `alt`, teclado, redução de movimento | Gate estrito aprovado; não há imagens informativas incorporadas sem `alt`. Grafismos decorativos são ocultados às tecnologias de apoio. |
| Veracidade e direitos | Sem avaliações/promoções fictícias ou republicação de mídia não autorizada. Revisão final do operador ainda necessária; o gate não certifica conformidade legal. |

**Para fechar as pendências:** logo e arquivos reais com autorização; ementa direta atualizada com preços e alergénios; horário oficial; número de WhatsApp do restaurante e modalidades de pedido confirmadas; denominação social/NIF ou NIPC, sede, e-mail e dados de RAL. A versão está sem indexação enquanto a casa não confirmar estes elementos.
