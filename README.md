# Sorvete Supremo

Site da sorveteria de Santa Cruz, Rio de Janeiro. Vitrine de sabores e montagem de pedido, com revisão e abertura do WhatsApp oficial. Não há pagamento, confirmação de pedido, rastreamento ou servidor de cadastro.

## Rodar e testar

```sh
npm ci
npm run dev             # http://localhost:4173
npm test                # animação, conformidade e fluxo no Chromium
npm run build           # gera public/index.html
```

O HTML gerado é autossuficiente: CSS, JS, fontes e imagens estão embutidos. Abra `public/index.html` diretamente para ver a página sem rede. Links externos continuam dependendo de conexão. Em Linux, o QA usa o Chromium empacotado se não encontrar o de Playwright. Nos demais sistemas, execute `npx playwright install chromium` antes dos testes ou configure `CHROMIUM_EXECUTABLE`.

- `src/index.html`, `src/styles.css`, `src/site.js`: estrutura, visual e interações.
- `src/catalogo.json`: produtos, sabores confirmados e fontes. A seleção é um rascunho de consulta: valores e disponibilidade são confirmados no atendimento.
- `tools/anim-kit.*`: camada do WORKSPACE-COMPLETO, adaptada à marca. `npm run build` executa `tools/inject-anim.mjs` na saída.
- `REVISAO.md`: fontes, inventário de mídia, checklist e pendências.

## Atualizar as fotos e os vídeos

Use apenas arquivos da Sorvete Supremo com autorização de publicação. Coloque WebP ou AVIF em `src/assets/` e declare os dados em `src/midia.json`. As chaves de seção são `hero`, `experiencia` e `cta`; `produtos` aceita objetos por `id` do catálogo; `galeria` aceita `doce-de-leite`, `maracuja-milho` e `paleta-coco`. As chaves vazias mantêm o acabamento editorial, não um quadro de imagem quebrado.

Cada entrada tem `photo` (nome do arquivo), `alt` (o que realmente aparece), `width` e `height` (dimensões da foto). `mobile` aceita uma versão menor com a mesma proporção; `video` aceita um MP4 curto, comprimido e sem áudio, usando `photo` como capa. O site só inicia um clipe visível por vez no desktop e mantém a capa em celular, com movimento reduzido ou pausado. Rode o build e os testes novamente com as novas mídias; elas devem manter o HTML abaixo de ~3 MB.

## Vercel

A configuração versionada usa o build `npm run build`, saída `public`, sem instalar dependências de produção. Use o projeto **sorvete-supremo**; não reaproveite a configuração nem os domínios de outros clientes. A fonte desta versão é a branch `arena/ca3cb3fc-site`. A pasta `public` é gerada e não deve ser enviada ao Git.
