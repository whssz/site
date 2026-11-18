# Revisão de entrega — Sorvete Supremo

## Análise anterior à implementação

Foram lidos os sete guias anexados, o arquivo marcado **WORKSPACE-COMPLETO.zip** do Drive, o esqueleto, o kit de animação, os testes e o material de conformidade. As imagens do ZIP eram referências e materiais de outros projetos, não fotos da Sorvete Supremo.

- **Nicho e modelo:** fábrica de sorvetes e picolés com sorveteria física em Santa Cruz, Rio de Janeiro. Oferta: sorvetes, picolés e paletas. Não se presumiu serviço de entrega.
- **Tarefa principal:** o visitante escolhe sabores, quantidades e uma preferência de atendimento, revisa e abre o WhatsApp oficial. Não precisa redigitar os itens e o site não conclui a venda. Quando não há preço corrente, não há cálculo ou total simulado.
- **Direção visual:** creme/marfim, marrom, rosa suave e amarelo claro; serifas no display e texto de apoio grande. A moldura de papel, as faixas marmorizadas, o selo de Santa Cruz e o cartão da Rua Álvaro Alberto conectam a jornada sem simular fotografias da empresa. A logo do avatar foi mantida como referência principal.
- **Arquitetura:** apresentação → cardápio → sorveteria e prova pública → galeria de posts → endereço, horários e contato → CTA final. Sacola acessível no cabeçalho durante toda a página.

## Informações e fontes consultadas em 18/11/2026

| Fonte | Usado no site / limite de acesso |
| --- | --- |
| [Google Maps](https://www.google.com/maps/place/Sorvete+Supremo/@-22.920799,-43.6897084,17z/data=!3m1!4b1!4m6!3m5!1s0x9bfa4232024f7b:0x28ed4e855a6093a4!8m2!3d-22.920799!4d-43.6897084!16s%2Fg%2F11c1s_2mpz) | Nome, categoria, endereço (Rua Álvaro Alberto, 850), telefone, horário e nota 4,8 na consulta. Link direto para ver avaliações atualizadas e link de rota. Na visualização limitada, não foi possível identificar fotos ou vídeos publicados pelo proprietário com segurança. |
| [Instagram oficial](https://www.instagram.com/sorvetesupremo/) | WhatsApp (21) 3157-4883; horário de segunda a sábado, das 11h às 18h; domingos e feriados, das 11h às 16h; sabores e categorias das legendas do perfil. Os posts retornaram texto, sem arquivo de foto ou vídeo acessível. A galeria abre os posts originais, não usa imagens remotas. |
| [Facebook oficial](https://www.facebook.com/sorvetesupremo/) | O acesso direto retornou HTTP 403. O índice público do perfil descreve a fábrica e modalidade de retirada. O [espelho público Foodyas](https://www.foodyas.com/BR/Rio-de-Janeiro/414346018770338/Sorvete-Supremo) vincula o avatar à página oficial e transcreve publicações da loja. Usado apenas para informações explícitas de alguns sabores e a origem do avatar. As fotos de produtos espelhadas não puderam ser verificadas/baixadas neste ambiente. |

Os links de cada item e suas variantes estão no `src/catalogo.json`. As publicações de catálogo são anteriores à consulta; foram usadas para identificar nomes divulgados, não disponibilidade atual. Excluídos preços promocionais, mínimos de atacado, promessas, números de seguidores e contagem de avaliações. Não foi verificado um cardápio atualizado com preços e não são afirmadas cobertura ou taxas de entrega, estoque, prazos ou tamanhos. Não foi confirmado CNPJ, razão social ou e-mail institucional; o site só publica a identificação comercial e os contatos verificados.

## Inventário de mídia

| Arquivo / link | Origem | Aplicação | Autorização |
| --- | --- | --- | --- |
| `logo.webp` | Avatar oficial do Facebook, vinculado ao perfil numérico 414346018770338 no espelho público Foodyas. Arquivo recuperado via busca pública de imagens, recortado e com fundo removido, sem redesenhar a logo. | Cabeçalho e rodapé, com texto alternativo. | Confirmar autorização de uso da marca na divulgação pública, se você estiver publicando para um terceiro. |
| `marmore.svg` | Composição gráfica abstrata do projeto; **não é uma foto**. | Visual de reserva do hero. | Sem mídia da empresa neste espaço. |
| [Doce de leite e canela](https://www.instagram.com/p/CN-TQ03rvVK/), [Maracujá e milho verde](https://www.instagram.com/p/CG3KXw6Lhm3/), [Paleta de coco](https://www.instagram.com/p/CGIHytFjWXU/) | Posts do Instagram oficial. | Links da galeria, sem copiar ou incorporar os arquivos. | A reprodução futura de fotos e vídeos requer confirmação de autorização. |

**Pendente:** fotos e vídeos autorizados para hero, ofertas, experiência, galeria e CTA. A foto de sorvete indexada a partir do Maps não foi usada, pois não havia comprovação de autoria da empresa. Não se usou banco de imagens, IA nem mídia de outro cliente. O manifest e os componentes já aceitam as fotos, versões móveis, capas e clipes.

## Teste final do roteiro

| # | Verificação | Resultado |
| --- | --- | --- |
| 1 | Identidade da empresa | Paleta/texto do briefing e avatar oficial; sem identidade genérica do estúdio. |
| 2 | ≥ 4 grandes seções e oferta clara | Seis seções; sorvetes, picolés e paletas aparecem na apresentação e no catálogo. |
| 3 | Informações reais | Dados e sabores separados por fonte; valores e disponibilidade atual não presumidos. |
| 4 | Animação contínua | 29 loops em 1440/768 px e 23 em 390 px, no topo e no fim. Acessibilidade permite desativar. |
| 5 | Fundo contextual | Fundo fixo com luzes creme/rosa/amarelo, formas orgânicas, pontos em deriva e partículas discretas. |
| 6 | Continuidade visual | Fio, faixa, recortes, curvas e glows atravessam seções; um papel de fundo comum às áreas. |
| 7 | Entrada e scroll | Entrada escalonada; clip, fade, escala, deslocamento e parallax leve. 19/19 alvos revelados nas três larguras. |
| 8 | Microinterações | Feedback de adição, estado do filtro, foco, hover de imagens/cards, botões, links e menu. |
| 9 | Revisão anti-template | Marbling, caderno de sabores, ficha de produto e número 850 conectados à loja e ao cardápio. |
| 10 | Mobile/performance | 0 px de rolagem horizontal e 0 erros JS em 390/768/1440 px. HTML autossuficiente de ~379 kB, sem requisições de terceiros no carregamento. |
| 11 | Movimento reduzido | 0 animações rodando e 0 alvos ocultos em `prefers-reduced-motion`; pausa manual conferida. |
| 12 | Conversão testada | Filtros, variante, adição, edição de quantidades, valor inválido, remoção, rascunho, preferência de retirada, observações, cópia, consentimento e URL/mensagem exatas. WhatsApp interceptado no teste, sem envio real. |
| 13 | Nenhum botão decorativo | CTAs levam ao cardápio, carrinho, rota, publicações ou WhatsApp; diálogos fecham com Esc. |
| 14 | Mídia real de produto/ambiente | **Parcial:** logo real e posts oficiais linkados. Sem fotos ou vídeos de produtos/ambiente verificáveis neste ambiente. |
| 15 | Link público | **Pendente:** a Vercel rejeitou o primeiro deploy (`projectSettings` ausente na requisição do conector). O projeto e o domínio existem, mas não há implantação ativa e o endereço retorna `404 DEPLOYMENT_NOT_FOUND`. O `README.md` descreve como publicar pela interface. |
| 16 | Conformidade e acessibilidade | Termos e privacidade, rascunho local sem dados pessoais solicitados, opt-in antes de abrir o resumo no WhatsApp, sem trackers. Não existe checkout próprio. QA legal estrito e axe no site e na sacola sem violações encontradas. |

As verificações técnicas podem ser repetidas com `npm test`. A auditoria automatizada não substitui autorização sobre mídia nem revisão jurídica do fornecedor.
