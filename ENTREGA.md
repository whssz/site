# Entrega — Pizzeria Napolitana (Torralba de Calatrava)

## Decisão de identidade (conflito de material)
O briefing cita **Pizzaria Nordestina** e descreve uma logo com fatia de pizza antropomórfica, mas nenhum arquivo de logo foi anexado. O Google Maps e o Instagram enviados apontam para a **Pizzeria Napolitana**, em Torralba de Calatrava (Espanha). Para não atribuir endereço, telefone, horários e fotos de um negócio a outro, o site usa o nome e os dados verificados dos links enviados. A paleta amarelo/vermelho/preto/branco e o clima alegre seguem o briefing; o mascote é um SVG autoral criado a partir da descrição do personagem, não uma foto.

## Mídia real utilizada
| Mídia | Origem | Onde foi aplicada | Observação |
|---|---|---|---|
| Foto principal `lh3.googleusercontent.com/...AABkmLfn...` | Google Maps do estabelecimento | Hero e galeria | URL direta usada porque o download de `lh3.googleusercontent.com` foi bloqueado no sandbox; pode expirar e deve ser hospedada localmente quando possível. |
| Foto `lh3.googleusercontent.com/...AABkmLd5...` | Galeria pública do Google Maps | Seção Sobre e galeria | Mesma observação acima. |
| Mapa incorporado (`maps?q=...&output=embed`) | Google Maps, endereço verificado | Seção Contato | Não é foto; é o mapa real do endereço. |
| SVG do mascote | Criado no código a partir da descrição do briefing | Header, hero, destaque e CTA | Ilustração decorativa, não apresentada como foto da empresa. |

**Não usadas:** fotos de banco, imagens de IA, capturas do zip do Drive (sem relação com a pizzaria), avatares de avaliadores e a foto de diretório terceirizado.

**Não foi possível acessar/baixar:** mídias do Instagram (perfil e reels abertos para leitura de texto, mas as imagens/vídeos não foram expostos ao coletor; links diretos expiram e não foram inventados). Nenhum vídeo foi inserido. As duas fotos do Google Maps são as únicas mídias visuais disponíveis.

## Dados verificados usados
Nome, categoria, endereço, telefone, horários, nota 4,8/85 avaliações e três avaliações nominadas: Google Maps. Biografia, novidade Salchipizza e seus ingredientes: Instagram oficial. Formas de recebimento (para levar / retirada no Mercado Municipal): Instagram oficial.

## Pendências (não inventadas)
- Preços, promoções e combos: não publicados nos canais consultados; exibidos como “valor a confirmar”.
- Número de WhatsApp oficial: não confirmado; o site copia o resumo pronto e oferece chamada telefônica para o número do Maps, sem alegar envio/confirmação.
- Logo original da Pizzaria Nordestina: não anexada.
- Razão social e CNPJ: não informados — bloco de identificação do fornecedor não publicado.

## Fluxo funcional
Cardápio com filtros → adicionar ao pedido → quantidades/remoção → modalidade → observações → consentimento → copiar resumo → ligar. Estado do pedido persistido em `localStorage`. Nenhum botão decorativo.

## QA
- `node tools/qa.mjs public/index.html` → **PASS (estático)**: 10 keyframes distintos, 20 declarações de animação infinita, fundo contextual animado com partículas, reveal por `IntersectionObserver`, `prefers-reduced-motion` ativo, barra de progresso.
- `node tools/qa-legal.mjs public/index.html` → **PASS (estático)**: `lang`, `title`, 4/4 imagens com `alt`, nenhum dado fictício, Privacidade e Termos linkados, consentimento não pré-marcado, nenhum rastreador.
- `node tools/test-flow.mjs` → **19/19 verificações**: adicionar, somar, diminuir, remover, filtrar, validar consentimento, copiar resumo com modalidade/observações, abrir/fechar carrinho e persistir pedido.
- QA em navegador real (scroll horizontal, revealed elements, reduced-motion medidos) **não pôde rodar**: o download do Chromium do Playwright foi bloqueado pela rede do sandbox.

## Vercel
Projeto criado: `pizzeria-napolitana-site` (`prj_MQOeVurq4NfGaxYP5tnLB2fKBq2g`), conectado a `whssz/site`, com `outputDirectory: public`. O conector da Vercel não consegue fazer o primeiro deploy de um projeto novo (`projectSettings object is required`), e não há token CLI na sessão. Para concluir: gerar um token em https://vercel.com/account/tokens e rodar:

```bash
npx vercel@latest link --yes --project pizzeria-napolitana-site --token "$VT"
cd public && npx vercel@latest deploy --prod --yes --token "$VT"
```

Não gravar o token no repositório.
