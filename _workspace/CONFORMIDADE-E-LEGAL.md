# CONFORMIDADE, LEGAL E ACESSIBILIDADE — módulo obrigatório

> **Aviso:** este documento é um checklist técnico de construção de site, não é parecer
> jurídico. Ele garante que o site **não nasça irregular por descuido**. O enquadramento
> final de cada cliente é do advogado dele.
>
> **Derivado dos 18 prints enviados (checklist de site profissional / LGPD / CDC / WCAG).**
> Vale para **todo** site do estúdio, junto com `SCRIPT-UNIVERSAL.md`.

---

## 0. Como ler este documento (leia antes de tudo)

Existem **quatro classes** de item. Confundir as classes é o erro que gera site irregular
ou site com bloco inútil.

| Classe | Significado | Se não aplicar |
|---|---|---|
| **A · SEMPRE** | Independe de nicho. Todo site precisa. | Site nasce irregular |
| **B · CONDICIONAL** | Só existe se o site **fizer** aquilo (vender, coletar dado, usar cookie). | Bloco vazio ou peça faltando |
| **C · ADAPTÁVEL** | Obrigatório, mas a **forma muda** conforme o nicho. | Texto genérico que não protege ninguém |
| **D · PROIBIDO** | Nunca, em nicho nenhum. | Risco jurídico e de reputação |

**Regra-mãe da adaptação:** antes de implementar qualquer item, responda três perguntas:

1. **O site faz isso?** (vende, agenda, coleta dado, rastreia, entrega)
2. **Que dado pessoal está em jogo?** (nome, e-mail, telefone, endereço, CPF, dado de saúde)
3. **Qual obrigação o nicho carrega?** (CDC, LGPD, regra de conselho profissional, ANVISA)

Se a resposta 1 for "não", o item **não entra** — bloco legal vazio também é falha.
Se a resposta 2 envolver **dado sensível** (saúde, biometria, religião, orientação sexual),
o item sobe de classe: passa a ser **A** e exige cuidado reforçado de segurança.

---

## 1. CLASSE A · SEMPRE (independe de nicho)

| # | Item | Como implementar | Verificação |
|---|---|---|---|
| A1 | **Política de Privacidade** | Página/seção real, com três blocos: *quais dados coletamos · como usamos · seus direitos* | Link no rodapé, navegável por teclado |
| A2 | **Termos de Uso** | Página/seção real: o que o site oferece, regras de uso, responsabilidades | Link no rodapé |
| A3 | **Identificação do fornecedor** | Razão social, CNPJ, endereço e e-mail de contato no rodapé (CDC art. 33) | Presente e visível |
| A4 | **Contraste WCAG AA** | Texto normal ≥ **4.5:1**; texto grande (≥24px ou ≥19px negrito) ≥ **3:1** | Medido, não estimado |
| A5 | **Alt em toda imagem** | Descritivo e específico: `alt="Equipe da clínica na recepço"` — nunca `alt="imagem"` | 0 imagens sem alt |
| A6 | **Navegação por teclado** | Tab alcança tudo, ordem lógica, foco visível, `Esc` fecha modal | Percorrer a página só com Tab |
| A7 | **Licença de mídia** | Toda foto/vídeo tem origem e permissão registradas | Lista de mídias com origem |
| A8 | **Nenhum dado inventado** | CNPJ, razão social, e-mail, DPO, endereço: **reais ou ausentes** | Nunca placeholder no ar |
| A9 | **Sem promessa sem prova** | Nada de "resultado garantido", "100% de sucesso", "em 24h" | Revisão de copy |
| A10 | **Sem avaliação falsa** | Só depoimento real, com nome e origem (Google, Instagram) | Nenhum depoimento inventado |
| A11 | **Idioma declarado** | `<html lang="pt-BR">` | Presente |

> **A8 é o item mais violado do mercado e o mais perigoso.** Rodapé com
> `CNPJ 00.000.000/0001-00` é pior do que rodapé sem CNPJ: é declaração falsa.
> **Se o dado não existe, a linha é removida** e a pendência entra no relatório de entrega.

---

## 2. CLASSE B · CONDICIONAL (só se o site fizer aquilo)

| # | Item | Entra quando | Não entra quando |
|---|---|---|---|
| B1 | **Banner de cookies** | Há **qualquer** cookie/script não essencial (GA4, pixel Meta, heatmap, chat) | Só cookies essenciais (o site não rastreia) → **banner é desnecessário** |
| B2 | **Política de Cookies** | Existe B1 | — |
| B3 | **Consentimento em formulário** | Existe formulário que envia dado pessoal (nome, e-mail, telefone, endereço) | Não existe formulário |
| B4 | **Política de Reembolso / devolução** | Há **venda** com pagamento (CDC art. 49: 7 dias de arrependimento em compra fora do estabelecimento) | Site institucional sem venda própria → não entra |
| B5 | **Regras de entrega/atendimento** | Delivery, agendamento, prazo, taxa | — |
| B6 | **Scripts de tracking revisados** | Existe B1 | Remover o que está instalado e não é usado (tracker antigo, heatmap ocioso) |
| B7 | **Encarregado de dados (DPO)** | Tratamento relevante de dados / empresa de médio porte | Contato de privacidade no rodapé já resolve no pequeno negócio |

**B3 na prática:** checkbox **não pré-marcado**, texto claro, link para a política, e o
envio **bloqueado** enquanto não marcado. Checkbox já marcado é consentimento inválido.

---

## 3. CLASSE C · ADAPTÁVEL (a forma muda por nicho)

### 3.1 Matriz de decisão por nicho

| Nicho | Termos | Privacidade | Cookies | Reembolso | Consumo mínimo | Nota |
|---|---|---|---|---|---|---|
| **Doceria / restaurante / delivery** | ✔ | ✔ (nome, endereço, telefone de entrega) | Só se rastrear | **Forte**: devolução de alimento perecível tem regra própria — texto precisa refletir a realidade operacional | `nome + endereço + telefone` | O fluxo por WhatsApp coleta dado: privacidade **não** é opcional |
| **Barbearia / salão / estética** | ✔ | ✔ | Só se rastrear | Cancelamento e no-show no lugar de "reembolso" | `nome + telefone` | No-show é o tema real do nicho |
| **Clínica / consultório / saúde** | ✔ | ✔ **elevado** | Quase sempre sim (GA/pixel) | Raramente se aplica | Mínimo absoluto — dado de saúde é **sensível** (LGPD art. 5 II) | Consentimento específico; nunca pedir sintoma em formulário aberto |
| **E-commerce / loja** | ✔ | ✔ | ✔ | **Obrigatório** (CDC art. 49) | `nome + endereço + e-mail` | É o nicho onde os 4 itens são inegociáveis |
| **Infoproduto / curso** | ✔ | ✔ | ✔ | **Obrigatório** + regra de garantia | `nome + e-mail` | Promessa de resultado é o maior risco do nicho |
| **Advocacia / contabilidade** | ✔ | ✔ | Só se rastrear | Conforme contrato de serviço | `nome + e-mail` | Respeitar regra do conselho (OAB: publicidade sóbria) |
| **Imobiliária** | ✔ | ✔ | Se rastrear | Conforme contrato | `nome + telefone` | Anúncio de imóvel exige dados corretos (CRECI) |
| **Portfólio pessoal / B2B** | ✔ | ✔ (se há formulário) | Não | **Não se aplica** | `nome + e-mail` | Bloco de reembolso aqui é erro de adaptação |
| **Pet shop / veterinária** | ✔ | ✔ | Se rastrear | Produto: art. 49 · serviço: contrato | `nome + telefone` | — |

### 3.2 Como decidir sozinho, sem perguntar ao cliente

```
O site vende e recebe pagamento?          → sim: reembolso obrigatório (art. 49)
                                          → não: reembolso NÃO entra
O site coleta dado pessoal?               → sim: consentimento + privacidade obrigatórios
                                          → não: privacidade mínima, consentimento fora
O site instala analytics/pixel/chat?       → sim: banner + política de cookies obrigatórios
                                          → não: banner NÃO entra (e não invente um)
O nicho lida com saúde/dado sensível?      → sim: sobe para classe A, texto reforçado
Existe conselho profissional?              → sim: seguir a regra do conselho acima de tudo
```

**Nunca** copie o bloco de reembolso de um e-commerce para a doceria, nem o banner de
cookies para um site que não rastreia. Bloco legal fora de contexto **é erro de adaptação**,
não zelo.

---

## 4. CLASSE D · PROIBIDO (em qualquer nicho)

| Proibido | Por quê | Alternativa correta |
|---|---|---|
| Avaliação/depoimento inventado | Publicidade enganosa (CDC art. 37) | Só avaliação real, com origem e nome |
| Promessa sem comprovação ("resultados garantidos") | Engana o consumidor | Descrever o processo, não o resultado |
| CNPJ / razão social / endereço de exemplo | Declaração falsa de identificação | Omitir o bloco e reportar pendência |
| Foto de banco de imagens se passando por produto real | Mídia falsa (e viola o `SCRIPT-UNIVERSAL` seção 15) | Mídia real do cliente; se não houver, fallback elegante declarado |
| Imagem de terceiro sem licença | Violação de direito autoral | Origem licenciada e registrada |
| Marca de terceiro no layout | Risco de concorrência desleal | Só a marca do cliente |
| Coletar CPF/renda/data de nascimento sem necessidade | Excesso de coleta (LGPD art. 6 III, minimização) | Pedir só o que o serviço exige |
| Checkbox de consentimento pré-marcado | Consentimento inválido | Vazio por padrão, bloqueando o envio |
| "Pedido confirmado" automático ao cliente | A confirmação é do atendimento humano | Dizer "enviamos seu pedido no WhatsApp" |

---

## 5. Implementação em site de arquivo único

Tudo abaixo funciona num HTML autossuficiente (padrão do estúdio). Blocos prontos em
**`base/legal-snippets.html`** — copiar, não reescrever.

### 5.1 Termos e Privacidade
Como a entrega é um arquivo só, **não** crie páginas separadas: use `<section id="privacidade">`
e `<section id="termos">` no fim da página (ou `<dialog>`), linkadas no rodapé e no
consentimento. Conteúdo em linguagem clara, no tamanho real do negócio — duas páginas
copiadas da internet são pior que um texto curto e verdadeiro.

### 5.2 Consentimento no formulário
```html
<label class="consent">
  <input type="checkbox" id="consent" required>
  Concordo com o tratamento dos meus dados conforme a
  <a href="#privacidade">Política de Privacidade</a>.
</label>
```
E no envio: **se não marcado, não envia** (foco no checkbox + mensagem clara).

### 5.3 Cookies
Banner com **três caminhos**: `Aceitar` · `Recusar` · `Preferências`. Recusar tem que ser
tão fácil quanto aceitar. A escolha persiste (`localStorage`) e só os cookies permitidos
carregam. Sem banner se não houver rastreamento.

### 5.4 Acessibilidade
- Contraste medido, não "no olho".
- `alt` em todas as imagens, descritivo.
- Foco visível em tudo (`:focus-visible`, nunca `outline:none` sozinho).
- `Esc` fecha modal; `Enter` aciona; ordem de Tab lógica.
- Área de toque ≥ 44×44px no mobile.

### 5.5 Pendência de dado legal
Se o cliente não mandou CNPJ/razão social, **não preencha**. Deixe fora e escreva no
relatório de entrega: *"Falta razão social e CNPJ — bloco de identificação não publicado
(não preencher com exemplo)."*

---

## 6. O que o QA automatizado mede

`node tools/qa-legal.mjs <arquivo>` — verifica o que é verificável por máquina:

| Verificação | Bloqueia? |
|---|---|
| `<html lang>` e `<title>` presentes | sim |
| Imagem sem `alt` | sim |
| CNPJ/telefone de exemplo (`00.000.000/0001-00`) | sim |
| Link de Termos e Privacidade existentes | alerta |
| Formulário sem checkbox de consentimento | alerta |
| Banner de cookies quando há script de tracking | alerta |
| Contraste abaixo de 4.5:1 (texto normal) | alerta |
| Foco visível ao navegar por Tab | alerta |
| Frases de promessa sem prova | alerta |

O que **não** é automatizável e continua sendo revisão humana: se o texto de privacidade
descreve o que o site realmente faz, se a avaliação é real, se a mídia tem licença, se a
adaptação ao nicho faz sentido.

---

## 7. Checklist final de conformidade

- [ ] Política de Privacidade real, com os três blocos (coleta · uso · direitos)
- [ ] Termos de Uso reais, linkados no rodapé
- [ ] Identificação do fornecedor (razão social, CNPJ, endereço) — **reais**, ou bloco ausente e reportado
- [ ] Banner de cookies **só** se houver rastreamento; com Aceitar / Recusar / Preferências
- [ ] Scripts de tracking revisados: nenhum tracker órfão
- [ ] Consentimento explícito em todo formulário, não pré-marcado, bloqueando o envio
- [ ] Coleta mínima: nenhum campo que o serviço não usa
- [ ] Reembolso/arrependimento presente **se houver venda** — ausente se não houver
- [ ] Contraste ≥ 4.5:1 (normal) e ≥ 3:1 (grande), medido
- [ ] `alt` em 100% das imagens, descritivo
- [ ] Navegação completa por teclado, com foco visível
- [ ] Licença de toda mídia registrada · nenhuma marca de terceiro
- [ ] Zero avaliação inventada · zero promessa sem prova
- [ ] `lang="pt-BR"` e `<title>` corretos
