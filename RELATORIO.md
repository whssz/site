# Avó Maria Pizza — Relatório de entrega

**Site de revisão:** [avo-maria-pizza.vercel.app](https://avo-maria-pizza.vercel.app/) · projeto exclusivo `avo-maria-pizza` na Vercel. O domínio público respondeu **HTTP/2 200**, com `Content-Type: text/html; charset=utf-8`, `Content-Disposition: inline` e o título **Avó Maria Pizza — Pizza artesanal na Parede, Cascais**. O cabeçalho `X-Robots-Tag: noindex, nofollow` mantém a indicação de não indexar durante a revisão; não é uma proteção por senha.

**Entrega local:** `npm run build` gera `public/index.html` (363.188 bytes), com CSS, JavaScript, imagens e fontes embutidos. O ficheiro abriu em Chromium com a rede desligada; foi possível adicionar ao pedido e ver o subtotal. Os canais externos requerem internet ou telefone.

## Fontes e decisões editoriais

Fontes consultadas em 18 de novembro de 2026. Da chegada à ação, a página apresenta a fermentação natural e o lugar, deixa explorar a carta, mostra a história e as provas de reconhecimento da marca, e encaminha para preparar o pedido ou visitar a pizzaria.

- [Google Maps — Avó Maria Pizza](https://www.google.com/maps/place/Av%C3%B3+Maria+Pizza/data=!4m2!3m1!1s0xd1ec96d8b076a93:0x8884c7943ef92b4a): morada, coordenadas, telefone fixo e nota de 4,8/5. O horário consultado indicava fecho às 22h30 e segunda e terça encerradas. O [Linktree oficial](https://linktr.ee/avomariapizza) indica fecho às 23h, e um [vídeo publicado em maio](https://www.instagram.com/p/DYhpI4aqg4Y/) dizia “aberto todos os dias”. A página atribui o horário ao Maps, avisa que as fontes divergem e recomenda confirmar por telefone. Não calcula “aberto agora”.
- [Instagram oficial](https://www.instagram.com/avomaria.pizza/): fermentação natural; [a Avó Maria e as raízes da marca](https://www.instagram.com/p/DfDK4RrxYsZ/); [Valpaços, onde a Avó nasceu](https://www.instagram.com/p/DYorMwFCr5B/); [distinção Solete Fast Good](https://www.instagram.com/p/DRj6uhIAsz9/). Edições sazonais não foram incluídas sem confirmação de disponibilidade atual.
- [Link adicional enviado](http://tinyurl.com/AvoMariaPizza) → [loja de pedidos na Uber Eats](https://www.ubereats.com/pt/store/avo-maria-pizza-parede/8RKTFAw3RQWpKLU7iEVhPA): 26 itens (16 pizzas, 3 pães de alho, 2 sobremesas e 5 bebidas), com ingredientes ou descrição de produto e preços de referência da plataforma. Os três destaques são os mais apreciados ali, não uma alegação de vendas. A secção de promoções remete à loja; não anuncia condições ou combos sem confirmação. Não foram inferidos tamanhos, bordas, adicionais, taxas ou prazos.
- [Guia Repsol — ficha da Avó Maria](https://www.guiarepsol.com/es/fichas/solete/avo-maria-pt405269/): corrobora morada, telefone, e-mail de contacto, estilo napolitano e Solete. O e-mail foi publicado para contacto, não como canal confirmado de pedidos.
- **Materiais de trabalho:** o `WORKSPACE-COMPLETO.zip` marcado no Drive e os sete guias anexados foram revistos. O esqueleto, as referências visuais do portfólio, o injetor e os scripts de QA orientaram o desenvolvimento. Não foi localizado ficheiro identificável da Avó Maria no ZIP; o material de outros clientes não faz parte do site nem do repositório.

## Inventário de mídia

| Ficheiro local | Origem e tamanho | Aplicação | Autorização |
| --- | --- | --- | --- |
| `assets/identidade.webp` | Avatar oficial do [Linktree](https://linktr.ee/avomariapizza), 400 × 400, 16.246 B | História | Origem oficial; confirmar uso institucional com a pizzaria. |
| `assets/simbolo.webp` | Recorte do mesmo avatar, 205 × 172, 11.112 B | Cabeçalho, rodapé e ícone da aba | Mesma confirmação do logótipo; desenho não recriado. |
| `assets/pizzas-a-mesa.webp` | Foto indexada da [loja da Avó Maria na Uber Eats](https://www.ubereats.com/pt-en/store/avo-maria-pizza-parede/8RKTFAw3RQWpKLU7iEVhPA), 240 × 192, 23.050 B | Hero, galeria “À mesa” e respetiva ampliação | Proveniência comercial identificada; licença de republicação e crédito do fotógrafo não confirmados. |
| `assets/cartao-da-avo.webp` | Capa com duas pizzas e logótipo da [mesma loja](https://www.ubereats.com/pt/store/avo-maria-pizza-parede/8RKTFAw3RQWpKLU7iEVhPA), 240 × 192, 8.266 B | Galeria “O cartão da Avó” e respetiva ampliação | Proveniência comercial identificada; licença de republicação e crédito do fotógrafo não confirmados. |
| Reel [“A nossa Avó Maria”](https://www.instagram.com/p/DfDK4RrxYsZ/) | Perfil oficial | Ligações na história e na galeria; não está alojado ou reproduzido no site | Ligação externa, sem cópia do vídeo. |
| Caprasimo e DM Sans | Fontes locais WOFF2 | Títulos e texto | Licenças SIL Open Font License incluídas em `assets/fonts/`. |

As duas capas são de baixa resolução e não estão associadas a sabores individuais. Foram inspecionadas e otimizadas para WebP, com dimensões no HTML e carregamento diferido fora do hero quando aplicável. Os ícones e desenhos abstratos da interface não se apresentam como fotos. Não foram utilizados bancos de imagens, imagens geradas ou fotos atribuídas a visitantes.

**O que não foi possível incorporar:** as páginas do Instagram abriram para leitura, mas a rota de incorporação retornou HTTP 400 e não foi disponibilizado MP4. No Maps, não foi possível atribuir as fotos à pizzaria. Os originais de produto da CDN da Uber Eats não ficaram acessíveis para inspeção; a ficha do Repsol apresentou créditos de imagens cedidas pelo estabelecimento, mas o ficheiro de alta resolução testado não abriu (HTTP 500 na ferramenta de consulta) e não há licença de republicação confirmada. Por isso, as fichas usam grafismos de categoria em vez de fotos de outros sabores. Para completar a mídia do hero, carta, história, galeria e CTA, são necessários **originais autorizados**, com as fotos de carta identificadas por produto e um MP4 curto. Antes da divulgação comercial, confirmar a autorização de uso e eventuais créditos das imagens já incluídas na revisão.

## Checklist do script

| # | Verificação | Resultado |
| --- | --- | --- |
| 1 | Identidade preservada | Aplicados logótipo oficial, creme, verde-petróleo, tipografia robusta e acentos do briefing. |
| 2 | Jornada / ≥ 4 secções | Sete: entrada, carta, história, galeria, promoções, visita e ação final. |
| 3 | Nada inventado | Dados atribuídos às fontes, preços da plataforma sinalizados e divergência de horários explícita. |
| 4 | Movimento contínuo | Fundo e pormenor no cabeçalho continuam ativos ao navegar, com pausa disponível. |
| 5 | Fundo contextual | Luz difusa, farinha/papel em deriva, formas e partículas subtis. |
| 6 | Continuidade | Fundo comum, arcos, faixa em diagonal e seis pontes entre secções. |
| 7 | Scroll variado | Revelações em fade, escala, clip e deslocamento; parallax em ecrãs maiores. |
| 8 | Microinterações | Navegação, botões, seleção de itens, opções de atendimento e galeria respondem às ações. |
| 9 | Anti-template | Arco de forno, carta impressa, lettering, selo e ilustração da marca; história local em vez de texto genérico. |
| 10 | Mobile e peso | Zero overflow nas quatro larguras; alvos autónomos ≥ 44 × 44 px na página e no carrinho a 390 px; uma requisição na entrada. |
| 11 | Movimento reduzido | `prefers-reduced-motion` e controlo de pausa testados. |
| 12 | Fluxo real | Adição, quantidades, remoção, persistência, modalidade, notas, revisão e cópia testadas. Recolha a confirmar por telefone; entrega na Uber Eats, sem importar o carrinho. |
| 13 | CTAs funcionais | Âncoras, carrinho, galeria, diálogos e canais verificados. Sem checkout nem confirmação fictícia. |
| 14 | Mídia real | **Parcial**: logótipo e duas capas com origem declarada. Faltam originais, fotos por produto e vídeo local autorizado; ver inventário. |
| 15 | Publicação | Domínio dedicado na Vercel; `HTTP/2 200` e título verificados em acesso público. |

### Conformidade (secção 16)

| Item | Resultado |
| --- | --- |
| 16.1 Termos e privacidade | Acessíveis no rodapé; descrevem seleção no navegador e saída para canais externos. |
| 16.2 Identificação | Nome comercial, morada e contactos confirmados. **Pendente com a empresa:** denominação social e NIF/NIPC, não inventados. |
| 16.3 Rastreamento | Sem rastreadores nem cookies analíticos; sem banner inapropriado. |
| 16.4 Consentimento | Nenhum formulário de transmissão. O WhatsApp não foi ativado sem número oficial. |
| 16.5 Coleta mínima | IDs e quantidades no navegador; notas opcionais e a modalidade só na página aberta. Não se pedem morada, nome ou telefone. |
| 16.6 Reembolso | Não se aplica ao site, que não vende, paga nem confirma encomendas. |
| 16.7 Acessibilidade | `lang=pt-PT`, sete instâncias de imagem com `alt`, contraste e foco validados no QA; teclado e Escape testados. |
| 16.8 Portão técnico | `qa-legal.mjs` sem bloqueantes nem avisos. O QA não certifica direitos de imagem ou conformidade jurídica. |

## QA em Chromium

| Ecrã | Rolagem horizontal | Animações contínuas | Reveals visíveis | Erros JS |
| --- | ---: | ---: | ---: | ---: |
| 1440 × 900 | 0 px | 32 | 21/21 | 0 |
| 768 × 1024 | 0 px | 32 | 21/21 | 0 |
| 390 × 844 | 0 px | 25 | 21/21 | 0 |

- `npm test`: 6/6. `npm run qa`: animação, legal e teste de fluxo passaram. O fundo fixo apresentou 11 loops em 320/390 px e 17 em 768/1440 px; 18 keyframes no build. Em movimento reduzido, zero animações em execução e nenhum reveal oculto.
- Axe WCAG 2/2.1 A/AA sem violações detetadas na página e no carrinho aberto. Medição de alvo exclui links inline em prosa. Verificação visual das entradas em desktop, tablet e mobile, e do carrinho e resumo em 390 px.
- Fluxo exercitado: filtrar e expandir a carta; selecionar, retomar após recarregar, editar e remover; validar a modalidade; verificar `2 × Margherita = 25,00 €` e observações no resumo; copiar e comparar o texto exato; verificar o `tel:` e o destino Uber Eats; confirmar que o site não envia o pedido. Navegação da galeria e diálogos também testada. Nenhum pedido foi enviado no teste.
- Amostra local sem limitação de rede e com movimento reduzido: FCP/LCP de 236 ms em 390 × 844 e 336 ms em 1440 × 900. Uma requisição HTTP de documento e nenhum subrecurso externo antes da interação; não são métricas de campo da Vercel.

**Antes da divulgação comercial:** obter as mídias autorizadas, confirmar horários e valores com a pizzaria e completar a identificação legal. Um WhatsApp oficial só é necessário se a empresa quiser receber pedidos por esse canal; o resumo copiável já funciona.
