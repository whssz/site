# Relatório de QA — Quatro em 1

Gerado em: 2026-11-16 01:50 UTC
Arquivo: index.html (3354700 bytes)
Site: https://quatro-em-1.vercel.app/

## 1. Animação e layout (tools/qa.mjs)
```

  QA · index.html
  ────────────────────────────────────────────────────────────────
  viewport   h-scroll  loop   keyframes  revela   erros
  desktop    0px       44     14         37/37    0
  tablet     0px       44     14         37/37    0
  mobile     0px       29     12         37/37    0
  ────────────────────────────────────────────────────────────────
  reduced-motion: desliga tudo ✓

  ✓ PASS — pode publicar

```

## 2. Conformidade (tools/qa-legal.mjs)
```

  QA LEGAL · index.html
  ────────────────────────────────────────────────────────────────────
   · lang=pt-BR · title="Quatro em 1 — Confeitaria em Campo Grande | Doce"
   · imagens: 67 · sem alt: 0
   · links legais: privacidade=true termos=true cookies=false reembolso=false
   · formulário: 0 campo(s) · consentimento: não
   · trackers: nenhum · banner: não
   · contraste: todos os textos medidos passaram
   · teclado: foco visível em todos os 14 primeiros
  ────────────────────────────────────────────────────────────────────

  ✓ Nada pendente.

  ✓ PASSOU

```

## 3. Fluxo funcional do pedido (scripts/test-flow.mjs)
```

── 1. adicionar produtos
  OK   14 botões "Adicionar" visíveis na categoria inicial
  OK   badge do carrinho = 2

── 2. trocar de categoria e adicionar de outra aba
  OK   badge = 3 após adicionar salgado

── 3. abrir o pedido e conferir itens
  OK   gaveta abriu
  OK   3 itens listados (vistos: 3)

── 4. alterar quantidade
  OK   quantidade do 1º item virou 2 (visto: 2)
  OK   total exibido: R$ 75,50

── 5. remover item
  OK   item removido (2 itens restantes)

── 6. validação: envia sem nome
  OK   campo nome marcado como erro
  OK   WhatsApp NÃO abriu sem dados válidos

── 7. validação: consentimento obrigatório
  OK   WhatsApp NÃO abriu sem consentimento

── 8. modalidade delivery x retirada
  OK   campo de endereço oculto em "Retirar na loja"
  OK   campo de endereço aparece em "Delivery"

── 9. envio completo
  OK   WhatsApp aberto 1 vez (1)
  OK   URL usa o número oficial da loja
  OK   mensagem tem o bloco do pedido
  OK   mensagem tem o total
  OK   mensagem registra Delivery
  OK   mensagem leva o endereço
  OK   mensagem leva as observações
  OK   mensagem leva o nome

── mensagem gerada ──
Olá! Quero fazer um pedido da Quatro em 1.

*Pedido*
• 2x Charlotte de morango grande — R$ 23,50 cada = R$ 47,00
• 1x Charlotte de morango pequena — R$ 17,00 cada = R$ 17,00

*Total:* R$ 64,00

*Recebimento:* Delivery
*Endereço:* Rua das Flores, 123 — Campo Grande
*Nome:* Cliente de teste
*Observações:* Sem cebola, por favor

_Aguardando a confirmação de vocês!_
─────────────────────

── 10. persistência ao recarregar
  OK   pedido preservado após recarregar (3 unidades)

── 11. teclado e acessibilidade
  OK   Esc fecha a gaveta

── 12. mobile 390px
  OK   barra de pedido aparece no mobile
  OK   barra ativa com itens no mobile
  OK   sem scroll horizontal no mobile (doc 390 / cli 390)

── erros de JS: nenhum
  OK   nenhum erro de JavaScript

✔ FLUXO APROVADO — 0 falhas
```

## 4. Site publicado
```
mídia/fonte embutida em data: URI : 79
requisições externas de recurso : nenhuma
tamanho                         : 3.20 MB
APROVADO: arquivo único e autossuficiente
```
