# Avó Maria Pizza

Site da pizzaria da Parede, em português de Portugal. A identidade parte do logótipo publicado no Linktree oficial e do briefing: creme, verde-petróleo, tipografia retrô robusta e apontamentos de rosa, ocre e vermelho.

## Executar e verificar

```sh
npm ci              # só para o QA em navegador
npm run dev        # pré-visualização em http://localhost:3000
npm run build      # gera public/index.html e executa o injetor do estúdio
npm test           # regras de valor, seleção, resumo e canal
npm run qa         # QA do estúdio, legal e fluxo no Chromium + axe
```

O build requer apenas Node, sem dependências instaladas. `public/index.html` é a entrega autossuficiente; também pode ser aberto como ficheiro local. As ligações externas precisam de internet. O Chromium do QA é fornecido via npm em Linux x64; noutras plataformas use `CHROME_PATH` ou instale o navegador do Playwright.

## Manutenção

- **Carta e contacto**: `src/menu.json` guarda produtos, categorias, ingredientes, preços em cêntimos, favoritos, horários e canais. Os preços atuais no JSON são referências da Uber Eats, não preços da casa. Para um produto sem preço confirmado, use `null`; o subtotal não é apresentado como completo se um item não tiver preço.
- **Pedidos**: só os IDs dos produtos e as quantidades são guardados no navegador. Modalidade e notas ficam na página aberta. Não há API de entrega, pagamento, confirmação ou importação de carrinho pela Uber Eats. A versão atual permite copiar o resumo; para recolha direciona ao telefone publicado, e para entrega abre a loja na plataforma.
- **WhatsApp**: configure `business.whatsapp` somente com um número oficial confirmado, em formato internacional, só dígitos. `business.whatsappModes` define as modalidades confirmadas para atendimento nesse número. O link abre uma mensagem preenchida; não envia nem confirma automaticamente. Adicione coleta de morada apenas após confirmar entrega direta e rever privacidade/consentimento.
- **Mídia**: substitua os WebP locais no diretório `assets/`, atualizando `alt` e dimensões. Para uma fotografia de produto, use `photo: { file, width, height, alt }` no item, somente após confirmar a associação. Para vídeo original do hero, coloque um MP4 curto, sem áudio, em `assets/` e configure `heroVideo: { file, width, height }`. O poster permanece no mobile, com movimento reduzido ou se o vídeo não tocar. O build exige até 3 MB para o HTML.
- **Movimento**: `tools/anim-kit.*` e `tools/inject-anim.mjs` vieram do `WORKSPACE-COMPLETO.zip`. A adaptação troca a grelha por farinha/papel e usa `transform` e `opacity` nos loops. O injetor roda no build.
- **Vercel**: implantação estática por `vercel.json` (`npm run build`, diretório `public`). A versão é de revisão, com `noindex` no cabeçalho e no HTML. Retire-os apenas depois de a empresa aprovar conteúdo, preços, horários e uso das mídias.

Ver [RELATORIO.md](RELATORIO.md) para as fontes, limitações, inventário de mídias e a auditoria item a item.
