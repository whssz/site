# PROMPT DE ABERTURA — cole isto no início de qualquer chat novo

> Substitua o que está entre `<>`. Se alguma linha não se aplicar, apague.
> Sem as linhas de **cliente** e **links**, o site não sai: eu não tenho como
> adivinhar o negócio nem achar mídia real no escuro.

---

```
Segue o COMECE-AQUI.md e o SCRIPT-UNIVERSAL.md do meu workspace.
Leia os dois antes de escrever código.

CLIENTE
- Negócio: <NOME>
- Nicho: <ex.: doceria artesanal, barbearia, clínica>
- Cidade: <CIDADE/UF>
- Oferta principal: <o que vende de verdade>

IDENTIDADE VISUAL
- <anexei logo e cores  |  está em uploads/<arquivo>  |  use as cores do perfil>
- <se não houver identidade pronta, a direção visual é por sua conta>

MÍDIA REAL — de onde tirar
- Google Maps: <URL do perfil>
- Instagram: @<perfil>
- Site atual / Linktree: <URL>
- Pasta local (se eu já tiver mandado fotos): <caminho>

REGRAS QUE VALEM SEMPRE
1. Segue o SCRIPT-UNIVERSAL.md por completo, seções 1 a 15. Se sobrar item sem
   revisar, o site não está completo.
2. Mídia 100% real desses links — nada de banco de imagens, IA ou ilustração
   se passando por foto. Se um link não abrir, diga o que não abriu e use fallback.
3. Não invente preço, produto, sabor, depoimento, número, endereço, horário.
   O que não existir, não entra.
4. As animações vêm do base/skeleton.html (12 keyframes, fundo contextual,
   reveals variados). Não reescreva de olho no portfólio: copie e adapte.
5. Fluxo funcional real se o nicho pedir (cardápio → carrinho → WhatsApp).
   Nenhum botão decorativo. Não exibir "pedido confirmado".
6. Depois de escrever o site, roda `node tools/inject-anim.mjs <arquivo>` — é isso que
   injeta o fundo animado, os 12 keyframes e as microinterações. Site sem esse passo
   vem sem animação.
7. Roda `node tools/qa.mjs <arquivo>` e me mostra os números. Sem PASS, não entrega.
   (Se faltar navegador: `bash tools/setup.sh`; sem ele o QA roda em modo estático.)
8. Publica na Vercel e me manda o link já verificado (HTTP 200), na mesma resposta.

ENTREGA
- Lista de cada mídia usada, com origem (Maps/Instagram/upload) e onde foi aplicada
- Checklist dos 15 itens do teste final, item por item
- Números do QA
- Link publicado
```

---

## Por que cada bloco existe

| Bloco | Sem ele, o que acontece |
|---|---|
| `COMECE-AQUI` + `SCRIPT-UNIVERSAL` | Eu volto ao zero: sem padrão de animação, sem checklist |
| Cliente e nicho | Não sei o que construir — o nicho define a arquitetura |
| Links de mídia | Não tenho como buscar foto real; o pedido "pegue dos links que mandei" não resolve, porque no chat novo esses links não existem |
| Identidade visual | Eu invento uma identidade — o que viola a regra 1 do script |
| "Roda o qa.mjs" | A entrega volta a depender da minha palavra em vez de números |
| "Publica e manda o link" | Fico esperando você pedir |

## Versão curta, se o workspace já tiver tudo

```
Segue o COMECE-AQUI.md. Site para <CLIENTE> (<nicho>, <cidade>).
Mídia real: Maps <URL> · Instagram @<perfil>. Identidade em <pasta>.
Segue o SCRIPT-UNIVERSAL completo, roda o qa.mjs e publica na Vercel.
```
