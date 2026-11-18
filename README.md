# Brutta Pizzeria Napoletana

Sítio em PT-PT para a Brutta de Paço de Arcos. A carta tem uma seleção editável e persistente. A seleção pode ser copiada; **não é enviada pelo site**. A recolha é combinada com a Brutta por telefone; para entrega, o site abre a loja confirmada na Uber Eats.

## Construir e testar

```sh
npm run dev             # gera o HTML e serve em 0.0.0.0:4173
npm run build           # gera public/index.html
bash tools/setup.sh     # instala apenas as dependências de QA
npm test                # movimento/layout, legal e fluxo em Chromium
```

Node.js 22 ou superior. A compilação não precisa de dependências de produção nem de acesso à rede. O HTML final incorpora estilos, JavaScript, fontes OFL e a arte vetorial. Pode abrir `public/index.html` diretamente; os destinos externos, naturalmente, requerem ligação. O diretório `public/` é gerado e não é fonte.

- **Carta e consulta:** `src/menu.json` (`checkedOn`, descrições e preços de **recolha na Uber Eats**, em cêntimos).
- **Contactos e operador:** `src/business.json`. `whatsapp` só deve ser preenchido se confirmado pela Brutta, com número internacional sem `+`. `operator` só deve ser preenchido com `name`, `taxId` (NIF/NIPC), `address`, `email` e eventual `registration` verificados. Confirmar os dados legais antes de ativar `indexable`.
- **Estilo e movimento:** `src/index.html`, `src/style.css` e `src/app.js`. `tools/build.mjs` chama `tools/inject-anim.mjs` com a camada do estúdio adaptada à Brutta. Não editar o HTML gerado.
- **Originais aprovados:** guardar WebP/AVIF e eventuais MP4 em `src/assets/`. Em `src/media.json`, cada entrada usa `file`, `source`, `authorized: true`, `alt`, `width`, `height`, mais `variants: [{ file, width }]` e/ou `video` quando disponíveis. Registar titular, licença e destino no relatório. Os slots estão vazios até haver autorização. Vídeo sem áudio relevante, com poster, apenas em viewports maiores, sem poupança de dados e com movimento permitido; confirmar no browser quando houver originais.

## Vercel

Usar um projeto **exclusivo da Brutta**, com `npm run build`, pasta de saída `public/` e sem instalação de dependências. O `ignoreCommand` em `vercel.json` autoriza builds deste ramo apenas no projeto dedicado da Brutta, identificado por ID, pois o repositório é partilhado. A promoção para produção é feita a partir do commit da versão revista. O workflow desta branch verifica o endereço público sem autenticação.

Após o deploy, a partir de uma máquina com acesso público ao domínio:

```sh
node tools/verify-deploy.mjs https://<projeto-brutta>.vercel.app/
```

O comando faz um GET sem autenticação e valida status, título, tipo, disposição inline e igualdade do HTML pelo tamanho e SHA-256. **`noindex` não é proteção por palavra-passe.** Até fechar as pendências da marca e de identificação, a página é uma versão de revisão, não o lançamento oficial.

[Relatório de entrega, fontes, inventário visual e checklist](docs/BRUTTA-ENTREGA.md)
