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

Cada entrada tem `photo` (nome do arquivo), `alt` (o que realmente aparece), `width` e `height` (dimensões da foto). `mobile` aceita uma versão menor com a mesma proporção; `video` aceita um MP4 curto, comprimido e sem áudio, usando `photo` como capa. O site só inicia um clipe visível por vez no desktop e mantém a capa em celular, com movimento reduzido ou pausado. `npm test` verifica esse comportamento em um build temporário com amostras técnicas que nunca entram no site. Repita os testes e confira visualmente a relação de cada foto com seu produto ao incluir os arquivos reais; eles devem manter o HTML abaixo de ~3 MB.

## Vercel

O novo projeto [sorvete-supremo-site](https://vercel.com/whsszxx-9424/sorvete-supremo-site) está conectado ao GitHub `whssz/site` e configurado para `npm run build`, saída `public`, sem instalar dependências de produção. A fonte do site é `arena/ca3cb3fc-site`. A pasta `public` é gerada e não deve ser enviada ao Git. O projeto anterior `sorvete-supremo` não é o alvo destas instruções.

### Produção pelo painel

Em **Settings → Environments → Production → Branch Tracking**, defina `arena/ca3cb3fc-site` para futuros deploys de produção. Não publique `main`, que não contém o site. Se já houver um build `Ready` da branch em [**Deployments**](https://vercel.com/whsszxx-9424/sorvete-supremo-site/deployments), é possível promovê-lo a produção por ali. Caso contrário, use **Create Deployment** com essa branch.

### Produção pela CLI

Como alternativa, em uma máquina com acesso à Vercel, execute no checkout da branch `arena/ca3cb3fc-site`:

```sh
npx --yes vercel@latest login
npx --yes vercel@latest deploy --prod --project sorvete-supremo-site --scope whsszxx-9424
```

Conclua o login pelo navegador, sem compartilhar credenciais no chat. Se a CLI não encontrar o projeto existente, não confirme a criação de outro.

### Verificação

Após o deploy de produção, abra `https://sorvete-supremo-site.vercel.app/` sem sessão. Em uma máquina com acesso ao domínio, `npm run verify:vercel` confirma HTTP 200, título e correspondência exata entre o HTML publicado e o build local. Antes de haver um deploy de produção atribuído ao domínio, o endereço reservado pode retornar `404 DEPLOYMENT_NOT_FOUND`.
