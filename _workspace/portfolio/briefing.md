# Briefing — Portfólio

> Documento vivo. Tudo que você me mandar (fotos, links, textos, decisões) vai sendo anotado aqui.
> Última atualização: 06/11/2026

---

## 1. Objetivo
Criar um portfólio com base em:
- **8 capturas de tela** de sites de referência → salvas em `portfolio/referencias/`
- **2 sites ao vivo** (projetos reais no ar) → analisados abaixo

## 2. Referências visuais recebidas (screenshots)

| # | Arquivo | Segmento | O que tem de bom |
|---|---------|----------|------------------|
| 1 | `image-1.png` | Barbearia ("Excellence") | Preto + dourado, hero com foto forte, **fluxo de agendamento em 4 passos** muito bem resolvido, cards de profissional/serviço |
| 2 | `image-2.png` | Moda / streetwear ("GAZU") | Tipografia gigante como protagonista, grid editorial, preto e branco, categorias em cards (Men/Women/Kids) |
| 3 | `image-3.png` | Coaching de negócios de luxo | Paleta areia/dourado, curvas suaves (blob/máscara arredondada), "About me" + serviços + depoimentos, tom sofisticado |
| 4 | `image-4.png` | Portfólio de designer digital | Dark mode, tipografia condensada enorme, números de credibilidade (6+, 40+, 18+, 12), grid de projetos + "core capabilities" + ferramentas |
| 5 | `image-5.png` | Brigadeiros (russo) | Marrom/creme, fotos macro do produto, catálogo em cards, storytelling artesanal |
| 6 | `image-6.png` | Chocolate ("Chocoteja") | Composição lúdica, splash de chocolate, amarelo quente + marrom, seções com muito movimento |
| 7 | `image-7.png` | Bolo de chocolate ("Cake") | Bege/creme + marrom cacau, foto hero em ângulo alto, cards de "mood", seção de ingredientes, depoimentos |
| 8 | `image-8.png` | Cafeteria ("Coffee") | Verde escuro + creme, hero com produto grande, 3 cards de produto com fundos pastel, badges de diferencial |

### Padrões que se repetem (= o seu gosto)
1. **Hero de impacto** — foto grande + headline curta e forte.
2. **Paleta restrita** — 2 a 3 cores no máximo (dark/luxo, creme/artesanal, verde/natural).
3. **Tipografia como design** — serifada elegante OU sans condensada gigante.
4. **Grid de cards** bem espaçado, com respiro.
5. **Prova social** — números, avaliações, selos de garantia.
6. **Mobile-first** — todos os prints são versões de celular (layout em coluna única).

## 3. Sites no ar (projetos reais)

### Douce Luna Atelier — `douce-apresentacao.base44.app`
- Confeitaria artesanal em São Paulo (Jardim Iguatemi)
- Tom: celestial, delicado, autoral ("cada doce é um presente do céu")
- Estrutura: hero → sobre o atelier (com +1.000 fatias/mês, 5,0 Google, 101 avaliações) → criações (Red Velvet, Tartes, Cafeteria) → depoimento → endereço/horários → CTA
- CTAs: delivery (Yooga) + WhatsApp
- Visual: creme/dourado, fotos macro, tipografia serifada

### Mô a Mô Doces — `momoadoces-amor-artesanal.base44.app`
- Doces artesanais em **São Luís/MA** (Cohajap), desde 2013, 3 lojas
- Tom: afetivo, próximo, regional ("o primeiro brownie do Maranhão", cupuaçu)
- Estrutura: hero + números (4,7 Google / 204 avaliações, 5,0 TripAdvisor) → história com linha do tempo (2013 → depois → hoje) → "nossas delícias" em 7 categorias, cada card com CTA de WhatsApp pré-preenchido → salgados → contato
- Visual: marrom chocolate + creme, fotos de produto, storytelling de origem

## 4. Catálogo de segmentos já cobertos (útil para montar as categorias do portfólio)
- Gastronomia / doces e cafeteria (4 exemplos)
- Beleza e bem-estar (barbearia)
- Moda e varejo (e-commerce)
- Marca pessoal / coaching
- Portfólio profissional (design)

## 5. Decisões já tomadas (06/11/2026)
| Tema | Definição |
|---|---|
| Papel dos sites | **Misto** — alguns projetos são seus, outros são referência de estilo |
| Área do portfólio | **Designer / criação de sites** |
| Direção visual | **Escuro e sofisticado** — preto carvão `#0B0A08` + dourado `#C9A46A` + creme `#F4ECDE` (escolha minha, alinhada às refs 1 e 4) |
| Formato | Ainda em aberto — v1 feita em **página web** (HTML único, pode virar PDF depois) |
| Idioma | Português (BR) |

## 6. Pendências (responder para avançar)
- [ ] **Quais dos 8 projetos são seus de verdade?** (os outros viram "referências" ou saem do site)
- [ ] **Nome** e como quer ser chamado no site (hoje está "Seu Nome" / monograma "SN")
- [ ] **WhatsApp e e-mail** reais (hoje: `55SEUNUMERO` e `seuemail@exemplo.com`)
- [ ] **Sua foto** para o bloco "Sobre mim"
- [ ] Bio real (anos de experiência, quantos projetos, cidade de atuação)
- [ ] Quer também versão **PDF** para enviar por e-mail/WhatsApp?

## 7. Arquivos do projeto
```
portfolio/
├── index.html        ← O PORTFÓLIO (arquivo único, imagens embutidas em base64)
├── template.html     ← mesma página com marcadores {{T1}}...{{T8}} no lugar das imagens
├── briefing.md       ← este documento
├── referencias/      ← os 8 prints originais (image-1 … image-8)
└── assets/
    ├── thumb-1…8.jpg ← capas 4:5 dos projetos
    ├── real-douce.jpg, real-momo.jpg ← imagens reais dos sites no ar
    └── src/          ← originais baixados dos sites
```

### Como o site está montado
1. Header fixo com blur ao rolar
2. Hero: headline + 3 telas empilhadas flutuando
3. Faixa marquee com os nichos atendidos
4. Números de credibilidade (6+ / 40+ / 18+ / 100%)
5. Grid de 8 projetos (capa 4:5, tag de segmento, hover com zoom)
6. Bloco "No ar agora" com os 2 links publicados (Douce Luna e Mô a Mô)
7. Serviços (4 cards) · Processo (4 passos) · Sobre mim
8. Depoimentos · CTA final · Footer com contatos

### Onde editar (dentro do `index.html`)
- Nome: buscar `Seu Nome` e `SN` (monograma)
- WhatsApp: buscar `55SEUNUMERO`
- E-mail: buscar `seuemail@exemplo.com`
- Números: buscar `6<i>+</i>`, `40<i>+</i>`, `18<i>+</i>`
- Foto do "Sobre": substituir o bloco `<div class="about-photo rev">` por `<img>`
