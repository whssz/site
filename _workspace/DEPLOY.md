# Playbook — publicar todo site na Vercel automaticamente

> Este arquivo existe para sobreviver às conversas. O agente **não tem memória entre
> chats diferentes**: se você abrir uma conversa nova, anexe/aponte este arquivo
> (ex.: "segue o DEPLOY.md") e o fluxo abaixo volta a valer.

## Regra combinada (06/11/2026)
Sempre que o usuário pedir **um site**, o agente deve, sem precisar ser lembrado:

1. **Construir** o site completo em `/home/user/<slug>/index.html`
   (arquivo único e autossuficiente: imagens, vídeos, logo e fontes embutidos em base64).
2. **Publicar na Vercel** em produção, num projeto novo com o nome do site.
3. **Verificar** com requisição HTTP real (`HTTP 200`, tamanho, `<title>`).
4. **Entregar o link** (`https://<slug>.vercel.app`) junto com a entrega do site.

## Conta
- Usuário Vercel: `whsszxx-9424`
- Team/org: `team_z6tahC0dowvMZFiASHvvIgBP`
- Projetos já criados: `migaica-doceria` (site da Migaica), `dociffitas-site` (não usar para outros clientes)

## Nome do projeto
Slug do nome do site, minúsculo e com hífen:
`Migaica Doceria` → `migaica-doceria` · `Dociffitas` → `dociffitas-site`

## ⚠️ Limitação conhecida do conector (testada em 06/11/2026)
O conector do Vercel **não consegue fazer o primeiro deploy de um projeto novo**:

> `The projectSettings object is required for new projects, but is missing in the deployment payload.`

O conector também não expõe `projectSettings` nem `skipAutoDetectionConfirmation`.
Consequência: **projeto novo = token + CLI**. Projeto que já tem deploy = conector funciona.

## Caminho A — token + CLI (funciona sempre, inclusive projeto novo)
```bash
npx --yes vercel@latest whoami --token "$VT"                     # valida
npx --yes vercel@latest link --yes --project <slug> --token "$VT" # vincula
cd <pasta> && npx --yes vercel@latest deploy --prod --yes --token "$VT"
```
O usuário precisa gerar o token em https://vercel.com/account/tokens e colar no chat.
**Nunca gravar o token em arquivo do workspace.** Apagar `.env.local` e `.vercel/`
depois do deploy (o CLI cria e eles podem conter credencial).

## Caminho B — conector (só para projeto que já tem deploy)
`create_deployment` com `project`, `name`, `target: "production"` e `files`.
Atenção: o conteúdo dos arquivos viaja como **texto na conversa** — sites com
muitos MB (vídeos embutidos) não passam; nesses casos use o Caminho A.

## Checklist pós-deploy
- [ ] `curl -I https://<slug>.vercel.app` → `HTTP/2 200`
- [ ] `content-disposition: inline` (e não `attachment`)
- [ ] tamanho servido == tamanho local
- [ ] `<title>` correto
- [ ] WhatsApp/e-mail/telefone do cliente presentes no HTML
- [ ] avisar sobre **Deployment Protection** (pode pedir login em `*.vercel.app`):
      Project → Settings → Deployment Protection → Disabled, se o link for externo

## Segurança
- Token é credencial de **escrita** na conta. Preferir expiração curta (1 dia) e revogar depois.
- O token colado em 06/11/2026 deve ser revogado em https://vercel.com/account/tokens
- Não publicar nada em host de arquivos público (tentado: tmpfiles e litterbox recusam HTML).
