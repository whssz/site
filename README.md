# Dai Friarielli Malagueta

Site em português europeu para a pizzaria no Murtal, Parede. Ementa com seleção local de pratos; sem pagamentos nem transmissão do pedido nesta versão. Consulte o [relatório de entrega, fontes e checklist](docs/ENTREGA.md).

## Construção e pré-visualização

```sh
npm run build            # Node.js ≥ 22, não precisa de instalar dependências
npm run dev              # http://localhost:4173
```

Abra `public/index.html` para a edição autossuficiente. O resultado inclui tipografia, ilustrações de interface, CSS, JS e o kit de movimento no mesmo HTML. Sem rede, a ementa e o pedido continuam disponíveis; os destinos externos precisam de ligação. A cópia pode usar seleção manual se o navegador não permitir acesso à área de transferência.

**Conteúdo:** `content/site.json` reúne o catálogo, os contactos, o horário, os canais de pedido, as novidades e as referências visuais. `src/` contém o layout, os estilos, o estado do pedido e as interações. `tools/build.mjs` renderiza, incorpora os ficheiros e chama `tools/inject-anim.mjs`; não edite o HTML gerado. A pasta `public/` é saída de build, não vai para o Git.

## Atualizar com dados confirmados

- **Ementa:** confirme cada artigo/artigo de época e descrição com a casa. `priceCents` fica `null` até haver preço direto autorizado; use cêntimos inteiros e `priceSource` para registar a confirmação. O subtotal cobre apenas os valores confirmados; sem preço para todos os artigos, não se mostra total final. Não copie preços da plataforma.
- **Horário:** preencha `location.hours` com objetos `days` e `hours`, e `location.hoursSource` com o registo oficial. Sem dias publicados, a interface oferece consulta no Google Maps e contacto telefónico.
- **WhatsApp:** preencha `order.whatsapp` com o número oficial internacional (só dígitos), e `order.whatsappSource` com a confirmação. Defina `order.directModes` (`pickup`, `delivery`) só para modalidades que a casa confirme para esse canal. Use `requiresDeliveryAddress: true` apenas se a entrega direta for confirmada e exigir morada. Mantenha consentimento, validação e revisão da mensagem; o envio continua a ser uma ação do visitante no WhatsApp. A plataforma da configuração é externa e não recebe a seleção deste site.
- **Novidades:** adicione a `news` apenas publicações confirmadas com `title`, `text` e `url` da fonte oficial. Retire campanhas quando terminarem.
- **Média local:** coloque os originais autorizados, já otimizados, em `assets/`. Cada referência na configuração deve ter `file` (caminho relativo ao repositório), `source` (post ou identificação da entrega do proprietário), `authorized: true`, `width`, `height` e `alt` descritivo para imagens informativas. Não guarde permissões com dados pessoais no Git; mantenha o comprovativo fora do repositório. Slots: `media.logo`, `media.hero.photo`, `media.house`, `media.visit`, `menu[].items[].media`, `gallery[].media`. As especialidades reutilizam a média do respetivo artigo. Use WebP/AVIF e `variants` para variantes da mesma imagem (com caminhos e dimensões próprios); o hero é prioritário e as restantes imagens usam carregamento diferido. `media.hero.video` e `gallery[].video` aceitam MP4 silencioso de pequeno tamanho, com a respetiva fotografia como poster. Em ecrãs até 620 px, com economia de dados, movimento reduzido ou pausa, fica só a fotografia. Prefira clipes curtos sem faixa de áudio. Otimize o total **antes** de incorporar: a página leva todas as variantes dentro do próprio ficheiro.
- **Legal e indexação:** em `src/index.html`, reveja Privacidade/Termos para a operação real e complete a identificação e os dados em falta listados no relatório. `indexable: false` é para revisão sem inclusão nos motores de busca; não é proteção de acesso. Depois de a casa aprovar a versão final e a identificação, configure `siteUrl` e `indexable` de acordo com essa decisão.

## QA e publicação

```sh
bash tools/setup.sh      # dependências de QA e Chromium
npm run qa               # build, dois gates do estúdio, testes do pedido e browser
node tools/verify.mjs https://dai-friarielli-malagueta.vercel.app
```

`CHROMIUM_PATH` permite usar Chromium/Chrome local. Sem ele, o runner usa o Chromium instalado por Playwright ou, em Linux x64, a distribuição de QA incluída nas dependências. Não é uma dependência do site. Os testes de WhatsApp interceptam o destino num cenário de teste e **não enviam** mensagens.

O projeto de publicação da Vercel é `dai-friarielli-malagueta`, separado dos outros sites. `vercel.json` executa `npm run build`, serve `public/` e desativa o deploy automático do Git. Publique explicitamente o commit testado de `arena/0b9dcd18-site` em produção, sem tocar em `main`. O verificador exige resposta 200, título e correspondência byte a byte com o HTML local. O deploy pode continuar acessível por URL direta mesmo com `noindex`.
