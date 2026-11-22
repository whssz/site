#!/usr/bin/env node
/**
 * Teste em navegador real (Chromium/Playwright) do site da Pizzeria Santa Chiara.
 *
 *   node tools/browser-test.mjs [url|ficheiro]
 *
 * Verifica:
 *  - renderização do hero, menu, galeria e rodapé;
 *  - ausência de overflow horizontal em 4 larguras (inclui mobile);
 *  - fluxo de pedido: adicionar, alterar quantidade, observação, remover,
 *    subtotal/total, modos (retirada/mesa/entrega), validação e consentimento;
 *  - persistência em localStorage entre recargas;
 *  - WhatsApp/cópia:链接 wa.me correto e cópia do resumo;
 *  - `prefers-reduced-motion`: animações contínuas desligadas;
 *  - erros de consola e recursos 404/500.
 */
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv[2] || "index.html";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      let rel = decodeURIComponent(url.pathname);
      if (rel === "/" || rel === "") rel = "/index.html";
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !existsSync(file)) {
        res.writeHead(404, { "content-type": "text/plain" });
        return res.end("404");
      }
      const body = await readFile(file);
      res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch (err) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end(String(err));
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

/* ------------------------------------------------------------------ */
const results = [];
let failures = 0;
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) failures++;
  const mark = ok ? "✓" : "✗";
  console.log(`${mark} ${name}${detail ? " — " + detail : ""}`);
}
function near(a, b, eps = 0.01) {
  return Math.abs(a - b) < eps;
}
function parseEuro(txt) {
  return parseFloat(String(txt || "").replace(/[^\d,]/g, "").replace(",", ".")) || 0;
}

/* ------------------------------------------------------------------ */
/* Chromium: usa o binário instalado pelo Playwright. Em sandbox sem
   dependências do sistema, aceita-se CHROMIUM_PATH e as pastas de
   bibliotecas partilhadas em LD_LIBRARY_PATH.                          */
const launch = {
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--headless=new",
    "--disable-features=Vulkan",
  ],
  env: { ...process.env },
};

const libDirs = [
  process.env.CHROMIUM_LIB_PATH,
  "/tmp/pwtest/al2023/lib",
  "/tmp/pwtest/lib",
  "/tmp/pwtest",
].filter((d) => d && existsSync(d));
if (libDirs.length) {
  launch.env.LD_LIBRARY_PATH = [process.env.LD_LIBRARY_PATH, ...libDirs]
    .filter(Boolean)
    .join(":");
}

/** Procura um Chromium utilizável, por ordem de preferência. */
function findChromium() {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH;
  }
  const candidates = [
    // binário do pacote @sparticuz/chromium (servidores sem dependências)
    "/tmp/pwtest/chromium/chromium",
    // instalações do sistema
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  ];
  for (const c of candidates) if (existsSync(c)) return c;

  // registo do Playwright (npx playwright install chromium)
  const registry =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    path.join(process.env.HOME || "/root", ".cache", "ms-playwright");
  if (existsSync(registry)) {
    for (const dir of readdirSync(registry)) {
      if (!dir.startsWith("chromium")) continue;
      for (const rel of [
        "chrome-linux/chrome",
        "chrome-linux/headless_shell",
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
      ]) {
        const full = path.join(registry, dir, rel);
        if (existsSync(full)) return full;
      }
    }
  }
  return null;
}

const executablePath = findChromium();
if (executablePath) {
  launch.executablePath = executablePath;
  console.log(`· Chromium: ${executablePath}`);
} else {
  console.log(
    "::warning::Nenhum Chromium encontrado. Instale com `npx playwright install chromium` " +
      "ou defina CHROMIUM_PATH."
  );
}

const { server, port } = await startServer();
const base = `http://127.0.0.1:${port}/`;
const target = /^https?:\/\//.test(arg) ? arg : base;

const browser = await chromium.launch(launch);
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
const badResponses = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));
page.on("response", (r) => {
  if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);
});

/* ---------- 1. carga e estrutura ---------- */
await page.goto(target, { waitUntil: "load" });
await page.waitForTimeout(600);

check("Título do documento preenchido", (await page.title()).trim().length > 5, await page.title());
check(
  "Meta description presente",
  (await page.locator('meta[name="description"]').getAttribute("content").catch(() => ""))?.length > 20
);
check("Idioma pt-PT declarado", (await page.locator("html").getAttribute("lang")) === "pt-PT");
check("H1 único", (await page.locator("h1").count()) === 1);
check(
  "Menu com 60+ itens",
  (await page.locator(".item[data-price]").count()) >= 60,
  String(await page.locator(".item[data-price]").count())
);
check("Galeria com 6+ imagens", (await page.locator("#ambiente img").count()) >= 6);
check("Rodapé com telefone oficial", (await page.locator('a[href="tel:+351211522801"]').count()) >= 1);
check(
  "Sem imagens com alt vazio",
  (await page.evaluate(() =>
    Array.from(document.images).filter((i) => !i.getAttribute("alt")).length
  )) === 0
);

/* ---------- 1b. hero: sem cartão flutuante sobreposto ---------- */
const heroOverlays = async () =>
  page.evaluate(() => {
    const hero = document.querySelector(".hero");
    if (!hero) return null;
    return Array.from(hero.querySelectorAll("*"))
      .filter((el) => getComputedStyle(el).position === "absolute")
      .map((el) => (el.className || el.tagName).toString().trim());
  });
check(
  "Hero sem cartão flutuante (.hero-stamp ausente)",
  (await page.locator(".hero-stamp").count()) === 0
);
check(
  "Hero só com a pastilha de estado em cima",
  JSON.stringify(await heroOverlays()) === JSON.stringify(["hero-chip"]),
  JSON.stringify(await heroOverlays())
);
check(
  "Pastilha 'Aberto ao domingo' presente",
  (await page.locator(".hero-chip").count()) === 1 &&
    /Aberto ao domingo/i.test(await page.locator(".hero-chip").textContent())
);

/* ---------- 2. overflow horizontal em várias larguras ---------- */
for (const w of [320, 390, 768, 1440]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(300);
  const over = await page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    // tentativa real de deslizar lateralmente
    window.scrollTo(400, window.scrollY);
    const scrolled = window.scrollX;
    window.scrollTo(0, window.scrollY);
    // blocos de conteúdo que devem caber na viewport
    const blocks = [
      "#hero .hero-grid",
      "#cardapio .menu-grid",
      "#destaques .feat-grid",
      "#ambiente .gal",
      "#visite .visit-grid",
      "footer .ftr-grid",
    ];
    const bad = [];
    for (const sel of blocks) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > docW + 1 || r.left < -1) {
        bad.push(`${sel} [${Math.round(r.left)}→${Math.round(r.right)}]`);
      }
    }
    return {
      scroll: document.documentElement.scrollWidth,
      client: docW,
      scrolled,
      bad,
    };
  });
  check(
    `Sem scroll horizontal a ${w}px`,
    over.scroll <= over.client + 1 && over.scrolled === 0 && over.bad.length === 0,
    over.bad.length ? over.bad.join(" ") : over.scrolled ? `scrollX=${over.scrolled}` : ""
  );
  if (w === 390) {
    check(
      "Hero no telemóvel sem cartão flutuante",
      (await page.locator(".hero-stamp").count()) === 0 &&
        JSON.stringify(await heroOverlays()) === JSON.stringify(["hero-chip"]),
      JSON.stringify(await heroOverlays())
    );
  }
}
await page.setViewportSize({ width: 1366, height: 900 });

/* ---------- 3. animação contínua presente ---------- */
const anim = await page.evaluate(() => {
  const running = document.getAnimations().filter((a) => a.playState === "running");
  const infinite = running.filter((a) => {
    const t = a.effect && a.effect.getTiming ? a.effect.getTiming() : {};
    return t.iterations === Infinity;
  });
  return { running: running.length, infinite: infinite.length };
});
check(
  "Animação contínua ativa (revelado/menu em movimento)",
  anim.infinite > 0,
  `running=${anim.running} infinite=${anim.infinite}`
);

/* ---------- 4. fluxo de pedido ---------- */
await page.evaluate(() => {
  try {
    localStorage.removeItem("sc-cart");
  } catch (e) {}
});
await page.reload({ waitUntil: "load" });
await page.waitForTimeout(400);

const addButtons = page.locator("#cardapio .item [data-add]");
await addButtons.nth(0).click(); // primeiro item do menu
await page.waitForTimeout(150);
check(
  "Adicionar ao pedido mostra o botão flutuante",
  await page.locator("#fab.show").isVisible()
);
check("Contador do pedido = 1", (await page.locator("#fab-count").textContent()).trim() === "1");

// abre o carrinho
await page.locator("#fab").click();
await page.waitForTimeout(350);
check("Carrinho aberto", await page.locator("#drawer.open").isVisible());
check(
  "Linha do pedido criada",
  (await page.locator("#cart-lines .cart-line").count()) === 1
);

// quantidade +1
const firstPrice = parseFloat(await page.locator("#cardapio .item").first().getAttribute("data-price"));
await page.locator('#cart-lines .cart-line .qty button[aria-label="Aumentar quantidade"]').click();
await page.waitForTimeout(150);
check("Quantidade = 2", (await page.locator("#cart-lines .cart-line .qty span").textContent()).trim() === "2");
check(
  "Subtotal = 2 × preço",
  near(parseEuro(await page.locator("#t-sub").textContent()), firstPrice * 2),
  `${await page.locator("#t-sub").textContent()} vs ${(firstPrice * 2).toFixed(2)}`
);
check(
  "Total = subtotal (sem taxas inventadas)",
  near(parseEuro(await page.locator("#t-total").textContent()), parseEuro(await page.locator("#t-sub").textContent()))
);

// observação por linha
await page.locator("#cart-lines .cart-line .cart-notes").fill("sem orégãos");
await page.waitForTimeout(200);
check(
  "Observação entra no resumo do pedido",
  (await page.locator("#f-preview").inputValue()).includes("sem orégãos")
);

// segundo produto
await page.locator("#drawer-close").click();
await page.waitForTimeout(250);
await page.locator("#destaques .feat [data-add]").first().click();
await page.waitForTimeout(150);
await page.locator("#fab").click();
await page.waitForTimeout(300);
check("Dois produtos no pedido", (await page.locator("#cart-lines .cart-line").count()) === 2);
const sub2 = parseEuro(await page.locator("#t-sub").textContent());
const featPrice = parseFloat(
  await page.locator("#destaques .feat [data-add]").first().getAttribute("data-price")
);
check("Subtotal soma os dois produtos", near(sub2, firstPrice * 2 + featPrice), `${sub2} vs ${firstPrice * 2 + featPrice}`);

// remover um
await page.locator("#cart-lines .cart-line .rm").first().click();
await page.waitForTimeout(200);
check("Remover linha restaura a quantidade", (await page.locator("#cart-lines .cart-line").count()) === 1);
check(
  "Subtotal recalculado após remoção",
  near(parseEuro(await page.locator("#t-sub").textContent()), featPrice),
  await page.locator("#t-sub").textContent()
);

/* ---------- 5. modos ---------- */
await page.locator('input[name="modo"][value="entrega"]').check();
await page.waitForTimeout(200);
check(
  "Entrega revela o campo de morada",
  await page.locator("#addr-fields").isVisible()
);
await page.locator('input[name="modo"][value="retirada"]').check();
await page.waitForTimeout(200);
check(
  "Retirada esconde o campo de morada",
  !(await page.locator("#addr-fields").isVisible())
);

/* ---------- 6. validação e consentimento ---------- */
const waBtn = page.locator("#drawer-actions button", { hasText: "WhatsApp" });
check("Botão de WhatsApp presente (número oficial)", (await waBtn.count()) === 1);
await waBtn.click();
await page.waitForTimeout(250);
check(
  "Enviar sem dados mostra erro de consentimento",
  await page.locator("#e-consent.show").isVisible()
);
check(
  "Enviar sem dados mostra erro de nome",
  await page.locator("#e-nome.show").isVisible()
);

await page.locator("#f-nome").fill("Ana Silva");
await page.locator("#f-tel").fill("912 345 678");
await page.locator("#f-consent").check();
await page.waitForTimeout(200);

// captura o URL do WhatsApp sem depender de rede externa:
// intercepta window.open antes do clique
await page.evaluate(() => {
  window.__waUrl = "";
  const orig = window.open;
  window.open = function (url) {
    window.__waUrl = String(url || "");
    return null;
  };
  window.__origOpen = orig;
});
await waBtn.click();
await page.waitForTimeout(300);
const waUrl = await page.evaluate(() => window.__waUrl);
await page.evaluate(() => {
  if (window.__origOpen) window.open = window.__origOpen;
});
check(
  "WhatsApp aponta para o número oficial 351211522801",
  waUrl.includes("wa.me/351211522801"),
  waUrl.slice(0, 70) || "(sem URL)"
);
check(
  "Mensagem do WhatsApp inclui os produtos",
  /Margherita|Diavola|Posillipo|Crudo|Fritz/i.test(decodeURIComponent(waUrl))
);
check(
  "Mensagem do WhatsApp inclui o total e a modalidade",
  /Total:|Modalidade:/.test(decodeURIComponent(waUrl))
);

/* ---------- 7. cópia do resumo ---------- */
const ctx2 = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const page2 = await ctx2.newPage();
await page2.goto(base, { waitUntil: "load" });
await page2.waitForTimeout(300);
await page2.locator("#destaques .feat [data-add]").first().click();
await page2.waitForTimeout(150);
await page2.locator("#fab").click();
await page2.waitForTimeout(300);
await page2.locator("#drawer-actions button", { hasText: "Copiar" }).click();
await page2.waitForTimeout(400);
const clip = await page2.evaluate(() => navigator.clipboard.readText().catch(() => ""));
check(
  "Copiar pedido coloca o resumo na área de transferência",
  clip.includes("PEDIDO") && clip.includes("Pizzeria Santa Chiara".toUpperCase()),
  clip.split("\n")[0]
);
await ctx2.close();

/* ---------- 8. persistência ---------- */
const stored = await page.evaluate(() => localStorage.getItem("sc-cart"));
check("Carrinho persistido em localStorage", !!stored && stored.includes("qty"));
await page.reload({ waitUntil: "load" });
await page.waitForTimeout(500);
check(
  "Carrinho sobrevive à recarga",
  (await page.locator("#fab-count").textContent()).trim() !== "0"
);

/* ---------- 9. navegação ---------- */
await page.locator('.nav a[href="#cardapio"]').first().click();
await page.waitForTimeout(900);
check(
  "Âncora interna leva ao cardápio",
  await page.evaluate(() => window.location.hash === "#cardapio")
);
check(
  "Cabeçalho fica fixo com fundo ao descer",
  await page.evaluate(() => {
    const h = document.getElementById("hdr");
    return h && getComputedStyle(h).position === "fixed";
  })
);
check(
  "Skip link existe para teclado",
  (await page.locator("a.skip").count()) === 1 &&
    (await page.locator("a.skip").getAttribute("href")) === "#cardapio"
);

/* ---------- 10. reduced motion ---------- */
const ctx3 = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  reducedMotion: "reduce",
});
const page3 = await ctx3.newPage();
await page3.goto(base, { waitUntil: "load" });
await page3.waitForTimeout(800);
const rm = await page3.evaluate(() => {
  const running = document.getAnimations().filter((a) => a.playState === "running");
  const infinite = running.filter((a) => {
    const t = a.effect && a.effect.getTiming ? a.effect.getTiming() : {};
    return t.iterations === Infinity;
  });
  return { running: running.length, infinite: infinite.length };
});
check(
  "prefers-reduced-motion desliga animações contínuas",
  rm.infinite === 0,
  `running=${rm.running} infinite=${rm.infinite}`
);
check(
  "Conteúdo visível mesmo com reduced motion",
  await page3.locator("#cardapio .item").first().isVisible()
);
await ctx3.close();

/* ---------- 11. erros de consola/recursos ---------- */
const realErrors = consoleErrors.filter(
  (e) => !/favicon|net::ERR_|Failed to load resource/i.test(e)
);
check("Sem erros de JavaScript na consola", realErrors.length === 0, realErrors.slice(0, 2).join(" | "));
const realBad = badResponses.filter((u) => !/favicon/i.test(u));
check("Sem recursos 404/500", realBad.length === 0, realBad.slice(0, 3).join(" | "));

await browser.close();
server.close();

console.log("\n─────────────────────────────");
const passed = results.length - failures;
console.log(`${passed}/${results.length} verificações passaram em navegador real`);
console.log(`RESULTADO: ${failures === 0 ? "PASS" : "FAIL"}`);
process.exit(failures === 0 ? 0 : 1);
