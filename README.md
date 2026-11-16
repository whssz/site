# Faz de Conta Doces

Site de apresentação e solicitação de encomendas para a Faz de Conta Doces, em Vila Isabel (Rio de Janeiro). `index.html` é autossuficiente: CSS, JavaScript, fontes e imagens estão incorporados no próprio arquivo. Não há checkout, processamento de pagamentos nem confirmação automática de pedidos. A mensagem é preparada no navegador e precisa ser enviada pela pessoa no WhatsApp.

## Conferência dos dados

- [Cardápio oficial](https://fazdecontadoces1.goomer.app/menu), consultado em 16/11/2026: nomes, descrições e valores. Preços iniciais, tamanhos, taxa, disponibilidade e condições devem ser confirmados com a equipe.
- [Google Maps](https://www.google.com/maps/place/Faz+de+Conta+Doces/data=!3m1!1e3!4m2!3m1!1s0x997f6316a9eeb1:0x72270dfa1e20e8d3?hl=pt-BR), consultado em 16/11/2026: endereço, telefone, nota e as duas citações de avaliações.
- [Instagram oficial](https://www.instagram.com/fazdecontadoces/) e [publicação de Carol Viana](https://www.instagram.com/p/Da70lN9Bydl/): história e referências visuais.
- [Linktree oficial](https://linktr.ee/fazdecontadoces): WhatsApp e links para os catálogos.

O fornecedor não informou razão social, CNPJ nem e-mail para publicação; esses dados não foram inventados. Recomenda-se confirmar os dados legais e revisar preços e horários regularmente.

## Mídias

As fotos foram extraídas dos PDFs de [casamento](https://drive.google.com/file/d/1n1Q1V9BUNBqfJ5zZYcXRhYG_7Qo-A7Uv/view?usp=sharing) e [docinhos](https://drive.google.com/file/d/1BqSP1a2xS3asl3Lk7zk-j0oHdEuKi9pq/view?usp=sharing) disponibilizados pela marca. O solicitante confirmou na conversa que são de autoria própria da Faz de Conta e autorizou seu uso, assim como o da logo do perfil; o nome individual do fotógrafo não foi informado. Os arquivos em `assets/` são cópias WebP de edição; as versões que o site usa estão embutidas no HTML.

| Arquivo | Origem | Onde aparece |
| --- | --- | --- |
| `logo.webp` | Identidade visual do perfil oficial @fazdecontadoces, encontrada por busca de imagens | Cabeçalho e rodapé |
| `bolo-hero.webp` | Catálogo de casamento, p. 1 | Hero |
| `docinhos-hero.webp` | Catálogo de docinhos, p. 2 | Hero, detalhe circular |
| `bolo-celebrar.webp` | Catálogo de casamento, p. 7 | Destaque de casamentos |
| `docinhos-catalogo.webp` | Catálogo de docinhos, p. 1 | Destaque de docinhos |
| `carol.webp` | Catálogo de casamento, p. 2 | História |
| `bolo-claro.webp` | Catálogo de casamento, p. 6 | Galeria |
| `docinhos-verdes.webp` | Catálogo de docinhos, p. 3 | Galeria |
| `bolo-flores.webp` | Catálogo de casamento, p. 6 | Galeria |

Os vídeos do Instagram não ficaram disponíveis para download nesta sessão e, por isso, não foram usados. O catálogo de bolos de aniversário credita um terceiro e suas fotos não foram utilizadas. Para substituir por vídeo original ou por uma versão de melhor qualidade da logo, fornecer os arquivos com autorização correspondente.

## Executar e testar

```sh
# Servidor local para prévia e para o teste funcional
python3 -m http.server 3000 --bind 0.0.0.0

# Em outro terminal, com Playwright e Chromium instalados:
node tools/qa.mjs index.html
node tools/qa-legal.mjs index.html --strict
node tests/flow.cjs
```

O kit de movimento é injetado por `node tools/inject-anim.mjs index.html --refresh`. O bloco de `<noscript>` precisa permanecer antes do `<style>` principal: o injetor acrescenta o CSS ao último bloco de estilos. O `tools/setup.sh` contém a instalação do Playwright para uma nova sessão. O teste do fluxo intercepta a abertura de `wa.me` localmente: verifica a mensagem e a abertura de nova aba, mas não envia mensagem real.

`.vercelignore` permite apenas o HTML; um deploy pode usar `mkdir -p public && cp index.html public/index.html` com diretório de saída `public` para servir apenas o arquivo autossuficiente.

O repositório é compartilhado por outros projetos Vercel. `vercel.json` permite o build deste ramo apenas no projeto `faz-de-conta-doces` (pelo nome ou ID) e ignora builds acionados automaticamente nos demais projetos, para não substituir sites de outros clientes. Ao mover o site para outro projeto, ajuste essa condição de proteção.
