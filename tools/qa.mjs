/**
 * QA — Pizzeria Santa Chiara
 * Portão de qualidade do estúdio (implementação local equivalente a tools/qa.mjs):
 *  1) auditoria estática (HTML/CSS): acessibilidade, animações em loop, links, dados fictícios
 *  2) teste funcional real do fluxo de pedido em DOM (jsdom)
 * Saída: PASS/FAIL por item e código de saída 1 em caso de falha.
 *
 *   node tools/qa.mjs index.html
 */
import fs from "node:fs";
import path from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";

const file = process.argv[2] || "index.html";
const root = path.dirname(path.resolve(file));
const html = fs.readFileSync(path.resolve(file), "utf8");

const results = [];
const ok = (name, detail = "") => results.push({ pass: true, name, detail });
const bad = (name, detail = "") => results.push({ pass: false, name, detail });

/* ------------------------------------------------------------------ */
/* 1. AUDITORIA ESTÁTICA                                                */
/* ------------------------------------------------------------------ */
const dom = new JSDOM(html, { url: "https://pizzeria-santachiara.vercel.app/" });
const doc = dom.window.document;

/* 1.1 head */
const lang = doc.documentElement.getAttribute("lang");
lang && /^pt/i.test(lang) ? ok("lang pt-PT", lang) : bad("lang pt-PT", String(lang));
const title = (doc.querySelector("title") || {}).textContent || "";
title.length > 20 ? ok("title preenchido", title.slice(0, 60)) : bad("title preenchido");
const desc = doc.querySelector('meta[name="description"]');
desc && desc.getAttribute("content").length > 80 ? ok("meta description", desc.getAttribute("content").slice(0, 60) + "…") : bad("meta description");
["og:title", "og:description", "og:image", "og:type"].forEach(t => {
  const m = doc.querySelector(`meta[property="${t}"]`);
  m && m.getAttribute("content") ? ok(`meta ${t}`) : bad(`meta ${t}`);
});

/* 1.2 imagens: alt, dimensões, lazy */
const imgs = [...doc.querySelectorAll("img")];
let noAlt = 0, noDim = 0, noSrc = 0;
imgs.forEach(i => {
  const alt = i.getAttribute("alt");
  if (alt === null || alt.trim() === "") noAlt++;
  if (!i.getAttribute("width") || !i.getAttribute("height")) noDim++;
  if (!i.getAttribute("src")) noSrc++;
  const src = i.getAttribute("src") || "";
  if (/^https?:/.test(src) && !/pizzeria-santachiara/.test(src)) bad("mídia externa (deve ser local)", src);
});
imgs.length >= 12 ? ok("mídia real suficiente", `${imgs.length} imagens`) : bad("mídia real suficiente", `${imgs.length} imagens`);
noAlt === 0 ? ok("alt em 100% das imagens", `${imgs.length}/${imgs.length}`) : bad("alt em 100% das imagens", `${noAlt} sem alt`);
noDim === 0 ? ok("dimensões declaradas (sem CLS)") : bad("dimensões declaradas", `${noDim} sem width/height`);
noSrc === 0 ? ok("todas as imagens com src") : bad("todas as imagens com src", `${noSrc}`);

/* ficheiros de imagem existem no disco? */
let missing = [];
imgs.forEach(i => {
  const src = i.getAttribute("src") || "";
  if (src && !/^https?:|^data:/.test(src) && !fs.existsSync(path.join(root, src))) missing.push(src);
});
missing.length === 0 ? ok("ficheros de imagem presentes no disco") : bad("ficheros de imagem presentes", missing.join(", "));

/* 1.3 fontes locais existem */
const cssAll = [...doc.querySelectorAll("style")].map(s => s.textContent).join("\n");
const faces = [...cssAll.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(m => m[1]);
let fontMissing = [];
faces.forEach(f => {
  const m = f.match(/url\(([^)]+)\)/);
  const u = m ? m[1].replace(/"/g, "").replace(/'/g, "") : "";
  if (u && !fs.existsSync(path.join(root, u))) fontMissing.push(u);
});
faces.length >= 4 ? ok("fontes @font-face declaradas", `${faces.length}`) : bad("fontes @font-face declaradas");
fontMissing.length === 0 ? ok("ficheiros de fonte presentes") : bad("ficheiros de fonte presentes", fontMissing.join(", "));

/* 1.4 animações */
const css = [...doc.querySelectorAll("style")].map(s => s.textContent).join("\n");
const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]);
const loopRules = [...css.matchAll(/animation\s*:[^;}]*infinite/g)].length;
const animatedNames = [...css.matchAll(/animation(?:-name)?\s*:\s*([^;}]+)/g)].map(m => m[1]);
const used = new Set();
animatedNames.forEach(v => v.split(",").forEach(x => {
  const name = x.trim().split(/\s+/)[0];
  if (name && name !== "none") used.add(name);
}));
const missingKf = [...used].filter(n => !keyframes.includes(n) && !/^(var|inherit|initial)$/.test(n));
keyframes.length >= 10 ? ok("keyframes distintos", `${keyframes.length}: ${keyframes.join(", ")}`) : bad("keyframes distintos", `${keyframes.length}`);
loopRules >= 2 ? ok("animações em loop perpétuo (CSS)", `${loopRules} regras infinite`) : bad("animações em loop perpétuo", `${loopRules}`);
missingKf.length === 0 ? ok("todo nome de animação tem @keyframes", `${used.size} usados`) : bad("todo nome de animação tem @keyframes", missingKf.join(", "));

/* fundo contextual animado: ≥3 estratos */
const bg = doc.querySelector(".bg");
bg ? ok("fundo contextual animado presente") : bad("fundo contextual animado presente");
const strata = bg ? bg.children.length : 0;
strata >= 3 ? ok("fundo com ≥3 estratos", `${strata} camadas`) : bad("fundo com ≥3 estratos", `${strata}`);
/* layers sempre animadas? */
const alwaysOn = [".bg-aurora", ".bg-grid", ".bg-blob.b1", ".bg-blob.b2", ".bg-blob.b3"].every(sel => {
  const el = doc.querySelector(sel);
  if (!el) return false;
  const re = new RegExp("\\" + sel + "(\\.[\\w-]+)?\\s*\\{[^}]*\\}");
  const m = css.match(re);
  return !!m && /infinite/.test(m[0]);
});
alwaysOn ? ok("fundo em movimento contínuo (aurora + grade + blobs)") : bad("fundo em movimento contínuo");

/* prefers-reduced-motion */
const rm = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/);
rm ? ok("bloco prefers-reduced-motion presente") : bad("bloco prefers-reduced-motion presente");
/* a regra final tem de desligar */
const rmHasNone = /animation\s*:\s*none\s*!important/.test(css.slice(rm ? rm.index : 0));

/* 1.5 links */
const anchors = [...doc.querySelectorAll("a[href]")];
const internal = anchors.filter(a => (a.getAttribute("href") || "").startsWith("#"));
const badInternal = internal.filter(a => {
  const id = a.getAttribute("href").slice(1);
  return id && !doc.getElementById(id);
});
badInternal.length === 0 ? ok("links internos resolvem", `${internal.length} âncoras`) : bad("links internos resolvem", badInternal.map(a => a.getAttribute("href")).join(", "));
const external = [...new Set(anchors.map(a => a.getAttribute("href") || "").filter(h => /^https?:/.test(h)))];
console.log("\n  links externos:", external.join(", ") || "—");
const unsafe = anchors.filter(a => a.target === "_blank" && !/noopener/.test(a.getAttribute("rel") || ""));
unsafe.length === 0 ? ok("links externos com rel=noopener") : bad("links externos com rel=noopener", `${unsafe.length}`);

/* 1.6 dados fictícios / proibidos */
const bodyText = doc.body.textContent;
const fake = [
  [/00\.000\.000\/0001-00/, "CNPJ de exemplo"],
  [/lorem ipsum/i, "lorem ipsum"],
  [/example\.com/i, "example.com"],
  [/\bXXXXX\b/, "placeholder XXXXX"],
  [/pedido confirmado/i, "promessa de pedido confirmado"],
  [/resultados? garantid/i, "promessa sem prova"],
  [/100% (de )?sucesso/i, "promessa sem prova"]
];
const fakeHits = fake.filter(([re]) => re.test(bodyText)).map(([, n]) => n);
fakeHits.length === 0 ? ok("nenhum dado fictício ou promessa sem prova") : bad("nenhum dado fictício", fakeHits.join(", "));

/* 1.7 consentimento: não pré-marcado */
const consent = doc.querySelector("#f-consent, input[type=checkbox]");
consent && !consent.hasAttribute("checked") && !consent.defaultChecked
  ? ok("consentimento explícito e não pré-marcado") : bad("consentimento não pré-marcado");

/* 1.8 botões: nenhum decorativo */
const buttons = [...doc.querySelectorAll("button")];
const orphanButtons = buttons.filter(b => {
  const hasHook = b.hasAttribute("data-add") || b.hasAttribute("data-open-cart") || b.hasAttribute("data-cat") || b.id;
  return !hasHook;
});
orphanButtons.length === 0 ? ok("todos os botões têm ação real", `${buttons.length} botões`) : bad("botões decorativos", orphanButtons.map(b => b.textContent.trim() || b.className).join(" | "));

/* 1.9 estrutura: ≥4 secções principais */
const mainSections = [...doc.querySelectorAll("main > section")];
mainSections.length >= 4 ? ok("≥4 grandes secções", mainSections.map(s => s.id || "(sem id)").join(", ")) : bad("≥4 grandes secções", `${mainSections.length}`);
["#cardapio", "#destaques", "#visite", "#privacidade", "#termos"].forEach(sel => {
  doc.querySelector(sel) ? ok(`âncora ${sel} existe`) : bad(`âncora ${sel} existe`);
});

/* 1.10 itens de menu com preço real */
const items = [...doc.querySelectorAll(".item[data-price]")];
const badPrice = items.filter(i => !(parseFloat(i.dataset.price) > 0));
badPrice.length === 0 ? ok("todos os itens têm preço válido", `${items.length} itens`) : bad("itens sem preço", `${badPrice.length}`);
const itemNames = items.map(i => i.dataset.name);
const dup = itemNames.filter((n, i) => itemNames.indexOf(n) !== i);
dup.length === 0 ? ok("sem nomes de item duplicados") : bad("itens duplicados", dup.join(", "));

/* 1.11 responsividade: nada com largura fixa perigosa */
const fixedWidths = [...css.matchAll(/[;{}\s](?:min-)?width:\s*(\d{4,})px/g)].map(m => parseInt(m[1])).filter(w => w > 480);
fixedWidths.length === 0 ? ok("sem larguras fixas perigosas") : bad("larguras fixas perigosas", fixedWidths.join(", "));
/* overflow-x — clip (ou hidden como fallback) para impedir scroll horizontal.
   `clip` preserva position:sticky, `hidden` cria um content-box rolável que o quebra. */
const overflowX = [...css.matchAll(/overflow-x:\s*(hidden|clip)/g)].map((m) => m[1]);
overflowX.includes("clip")
  ? ok("overflow-x:clip aplicado (sem scroll horizontal, sticky preservado)")
  : overflowX.includes("hidden")
    ? ok("overflow-x oculto (sem scroll horizontal)")
    : bad("overflow-x ausente");

/* ------------------------------------------------------------------ */
/* 2. TESTE FUNCIONAL (jsdom)                                           */
/* ------------------------------------------------------------------ */
const vc = new VirtualConsole();
const jsErrors = [];
vc.on("jsdomError", e => jsErrors.push(e.message));
vc.on("error", e => jsErrors.push(String(e)));

const dom2 = new JSDOM(html, {
  url: "https://pizzeria-santachiara.vercel.app/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole: vc
});
const win = dom2.window, d2 = win.document;

/* jsdom não tem scrollTo real nem clipboard: stubs seguros */
win.scrollTo = () => {};
win.HTMLElement.prototype.scrollIntoView = () => {};
Object.defineProperty(win.navigator, "clipboard", {
  value: { writeText: (t) => { win.__copied = t; return Promise.resolve(); } },
  configurable: true
});
win.open = () => {};

await new Promise(r => setTimeout(r, 400));

function click(el) { el.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true })); }
function setVal(el, v) { el.value = v; el.dispatchEvent(new win.Event("input", { bubbles: true })); el.dispatchEvent(new win.Event("change", { bubbles: true })); }

jsErrors.length === 0 ? ok("sem erros de JavaScript no arranque") : bad("erros de JavaScript", jsErrors.slice(0, 3).join(" | "));

/* 2.1 adicionar item */
const addBtn = d2.querySelector('.item[data-id="margherita"] [data-add]');
click(addBtn);
const fabCount = d2.getElementById("fab-count").textContent.trim();
fabCount === "1" ? ok("adicionar ao pedido atualiza o contador", fabCount) : bad("adicionar ao pedido", `contador=${fabCount}`);

/* 2.2 total calculado */
const total1 = d2.getElementById("t-total").textContent.trim();
total1 === "€10,00" ? ok("total calculado corretamente", total1) : bad("total calculado", total1);

/* 2.3 aumentar quantidade */
click(d2.querySelector(".cart-line .qty button:last-child"));
const total2 = d2.getElementById("t-total").textContent.trim();
total2 === "€20,00" ? ok("quantidade altera o total", total2) : bad("quantidade altera o total", total2);

/* 2.4 adicionar outro item */
click(d2.querySelector('.item[data-id="diavola"] [data-add]'));
const total3 = d2.getElementById("t-total").textContent.trim();
total3 === "€33,00" ? ok("dois itens somam corretamente", total3) : bad("soma de itens", total3);

/* 2.5 observações por linha */
const note = d2.querySelector(".cart-line .cart-notes");
setVal(note, "sem orégãos");
const previewTxt = d2.getElementById("f-preview").value;
previewTxt.includes("sem orégãos") ? ok("observações da linha entram no resumo") : bad("observações no resumo", previewTxt.slice(0, 80));

/* 2.6 validação: sem nome / sem consentimento */
const waBtn = [...d2.querySelectorAll(".drawer-actions button")].find(b => /WhatsApp/i.test(b.textContent));
click(waBtn);
const errNomeVisible = d2.getElementById("e-nome").classList.contains("show");
const errConsVisible = d2.getElementById("e-consent").classList.contains("show");
errNomeVisible && errConsVisible ? ok("validação bloqueia envio sem nome e sem consentimento") : bad("validação do formulário", `nome=${errNomeVisible} consent=${errConsVisible}`);

/* 2.7 entrega pede morada */
const radioEntrega = d2.querySelector('input[name="modo"][value="entrega"]');
radioEntrega.checked = true;
radioEntrega.dispatchEvent(new win.Event("change", { bubbles: true }));
const addrHidden = d2.getElementById("addr-fields").hidden;
addrHidden === false ? ok("modo entrega revela a morada") : bad("modo entrega revela a morada");

/* 2.8 mensagem final com todos os dados */
setVal(d2.getElementById("f-nome"), "Ana");
setVal(d2.getElementById("f-tel"), "912345678");
setVal(d2.getElementById("f-morada"), "Rua da Prata 10, 1100-052 Lisboa");
d2.getElementById("f-consent").checked = true;
setVal(d2.getElementById("f-consent"), "on");
const msg = d2.getElementById("f-preview").value;
const checks = [
  ["nome do produto", msg.includes("Margherita") && msg.includes("Diavola")],
  ["quantidades", msg.includes("2x Margherita")],
  ["observações", msg.includes("sem orégãos")],
  ["total", msg.includes("€33,00")],
  ["modalidade", msg.includes("Entrega")],
  ["nome do cliente", msg.includes("Nome: Ana")],
  ["telefone", msg.includes("912345678")],
  ["morada", msg.includes("Morada: Rua da Prata")],
  ["aviso de confirmação humana", /A confirmar pela equipa/.test(msg)]
];
checks.forEach(([label, pass]) => pass ? ok("resumo do pedido: " + label) : bad("resumo do pedido: " + label, msg.slice(0, 120)));

/* 2.9 remover item */
click(d2.querySelector(".cart-line .rm"));
const afterRemove = d2.getElementById("t-total").textContent.trim();
afterRemove === "€13,00" ? ok("remover item atualiza o total", afterRemove) : bad("remover item", afterRemove);

/* 2.10 persistência (dados preservados ao navegar) */
const stored = d2.defaultView.localStorage.getItem("sc-cart");
stored && stored.includes("diavola") ? ok("pedido preservado no navegador", stored.slice(0, 60) + "…") : bad("pedido preservado no navegador", String(stored));

/* 2.11 filtro de categorias */
const tabEspeciais = [...d2.querySelectorAll(".tab")].find(t => t.dataset.cat === "especiais");
click(tabEspeciais);
const hiddenGroups = [...d2.querySelectorAll(".menu-cat")].filter(g => g.classList.contains("hide")).length;
const shownGroups = [...d2.querySelectorAll(".menu-cat")].filter(g => !g.classList.contains("hide")).length;
shownGroups === 1 && hiddenGroups >= 5 ? ok("filtro de categorias funciona", `1 grupo visível, ${hiddenGroups} ocultos`) : bad("filtro de categorias", `vis=${shownGroups} oc=${hiddenGroups}`);
click([...d2.querySelectorAll(".tab")].find(t => t.dataset.cat === "todas"));

/* 2.12 abrir/fechar carrinho */
const fab = d2.getElementById("fab");
click(fab);
d2.getElementById("drawer").classList.contains("open") ? ok("carrinho abre") : bad("carrinho abre");
d2.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
!d2.getElementById("drawer").classList.contains("open") ? ok("Esc fecha o carrinho") : bad("Esc fecha o carrinho");

/* 2.13 reveal: nada fica invisível para sempre */
const revs = [...d2.querySelectorAll(".rv, .rv-clip, .rv-fade, .rv-left, .rv-right, .rv-scale")];
const neverRevealed = revs.filter(r => !r.classList.contains("in"));
neverRevealed.length === 0 ? ok("todos os elementos com reveal são revelados", `${revs.length} elementos`) : bad("elementos nunca revelados", `${neverRevealed.length}`);

/* ------------------------------------------------------------------ */
/* 3. RELATÓRIO                                                          */
/* ------------------------------------------------------------------ */
console.log("\n═══ QA — PIZZERIA SANTA CHIARA ═══\n");
results.forEach(r => console.log(`${r.pass ? "  PASS" : "  FAIL"}  ${r.name}${r.detail ? "  — " + r.detail : ""}`));
const failed = results.filter(r => !r.pass);
console.log(`\n  ${results.length - failed.length}/${results.length} verificações passaram`);
if (failed.length) {
  console.log("\n  FALHAS:");
  failed.forEach(f => console.log(`   ✗ ${f.name}${f.detail ? " — " + f.detail : ""}`));
  process.exit(1);
}
console.log("  RESULTADO: PASS\n");
