#!/usr/bin/env node
/**
 * Testes unitários da lógica de quota e de publicação (sem rede).
 *
 *   node tools/deploy-vercel.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  isQuotaError,
  errorMessage,
  backoffSeconds,
  waitBudgetMs,
  quotaRetryAt,
  verifyPublicSite,
  run,
  DEFAULTS,
} from "./deploy-vercel.mjs";

/* ------------------------------------------------------------------ */
test("deteta o erro de quota gratuita da Vercel (HTTP 402)", () => {
  const body = {
    error: {
      code: "api-deployments-free-per-day",
      message: "More than 100 deployments have been made in the last 24 hours. Try again in 24 hours.",
    },
  };
  assert.equal(isQuotaError(402, body), true);
  assert.equal(isQuotaError(429, body), false);
  assert.equal(isQuotaError(402, { error: { code: "forbidden" } }), false);
  assert.equal(isQuotaError(402, { error: { message: "100 deployments per day" } }), true);
});

test("não confunde outros erros 402 com a quota", () => {
  assert.equal(isQuotaError(402, { error: { code: "invalid_token" } }), false);
  assert.equal(isQuotaError(403, { error: { code: "forbidden" } }), false);
  assert.equal(isQuotaError(500, null), false);
});

test("extrai uma mensagem de erro legível", () => {
  assert.equal(
    errorMessage({ error: { code: "api-deployments-free-per-day", message: "Too many" } }),
    "Too many"
  );
  assert.equal(errorMessage({ error: { code: "x" } }), "x");
  assert.equal(errorMessage("texto"), "texto");
  assert.equal(errorMessage(null), "resposta vazia");
});

test("o backoff cresce e fica limitado", () => {
  const s1 = backoffSeconds(1);
  const s2 = backoffSeconds(2);
  const s10 = backoffSeconds(10);
  assert.ok(s2 > s1, "a segunda tentativa espera mais");
  assert.ok(s10 <= 900 + 60, "o backoff tem tecto");
});

test("o orçamento de espera é limitado e não-negativo", () => {
  assert.equal(waitBudgetMs(0), 0);
  assert.equal(waitBudgetMs(30), 30 * 60 * 1000);
  assert.equal(waitBudgetMs(-5), 0);
  assert.equal(waitBudgetMs(9999), 360 * 60 * 1000);
});

test("calcula a data de reagendamento a partir da mensagem da Vercel", () => {
  const now = new Date("2026-11-19T00:03:00Z");
  const at = quotaRetryAt(now, { error: { message: "Try again in 24 hours." } });
  assert.equal(at, "2026-11-20T00:03:00.000Z");
  const at2 = quotaRetryAt(now, { error: { message: "Try again in 2 hours." } });
  assert.equal(at2, "2026-11-19T02:03:00.000Z");
});

/* ------------------------------------------------------------------ */
test("a verificação pública lê estado, título e tamanho", async () => {
  const fake = async () => ({
    status: 200,
    async text() {
      return "<html><head><title>Pizzeria Santa Chiara — Lisboa</title></head><body>Santa Chiara</body></html>";
    },
  });
  const r = await verifyPublicSite("https://exemplo.vercel.app", { fetchImpl: fake });
  assert.equal(r.ok, true);
  assert.equal(r.status, 200);
  assert.ok(r.title.includes("Pizzeria Santa Chiara"));
  assert.ok(r.bytes > 0);
});

test("sem token a publicação é adiada sem falhar", async () => {
  const logs = [];
  const r = await run({ token: "", log: (m) => logs.push(m) });
  assert.equal(r.status, "skipped");
  assert.ok(logs.join("\n").includes("VERCEL_TOKEN"));
});

test("a URL pública é o domínio do projeto (o alias automático exige SSO)", () => {
  assert.equal(DEFAULTS.siteUrl, "https://pizzeria-santachiara.vercel.app");
  assert.ok(
    !DEFAULTS.siteUrl.includes("-whsszxx-9424."),
    "o alias automático da equipa está protegido por SSO da Vercel"
  );
  assert.ok(
    DEFAULTS.fallbackUrls.includes("https://pizzeria-santa-chiara-v2.vercel.app"),
    "tem de haver um URL alternativo para a verificação"
  );
});

test("o modo --dry-run não envia pedidos", async () => {
  const r = await run({ token: "fake-token", dryRun: true, log: () => {} });
  assert.equal(r.status, "dry-run");
});

test("a verificação pública cai no URL alternativo se o principal falhar", async () => {
  const asked = [];
  globalThis.fetch = async (url, opts) => {
    const u = String(url);
    asked.push(u);
    if (opts?.method === "PATCH") {
      return { status: 200, async text() { return JSON.stringify({ ssoProtection: null }); } };
    }
    if (opts?.method === "GET") {
      return { status: 200, async text() { return JSON.stringify({ deployments: [] }); } };
    }
    if (opts?.method === "POST") {
      return {
        status: 200,
        async text() {
          return JSON.stringify({ id: "dpl_teste", readyState: "READY", alias: ["x.vercel.app"] });
        },
      };
    }
    // O URL principal responde 404; o alternativo devolve o site.
    if (u.startsWith("https://pizzeria-santachiara.vercel.app")) {
      return { status: 404, async text() { return "not found"; } };
    }
    return {
      status: 200,
      async text() {
        return "<html><head><title>Pizzeria Santa Chiara — Lisboa</title></head><body>Santa Chiara Avenida 5 de Outubro 351211522801</body></html>";
      },
    };
  };
  const r = await run({
    token: "fake",
    waitMinutes: 0,
    log: () => {},
    sleepImpl: async () => {},
  });
  assert.equal(r.status, "published");
  assert.equal(r.url, "https://pizzeria-santa-chiara-v2.vercel.app");
  assert.ok(asked.some((u) => u.startsWith("https://pizzeria-santachiara.vercel.app")));
  delete globalThis.fetch;
});

/* ------------------------------------------------------------------ */
test("a quota esgotada adia a publicação em vez de a perder", async () => {
  const logs = [];
  let calls = 0;
  const fakeFetch = async () => {
    calls += 1;
    return {
      status: 402,
      async text() {
        return JSON.stringify({
          error: {
            code: "api-deployments-free-per-day",
            message: "More than 100 deployments have been made in the last 24 hours. Try again in 24 hours.",
          },
        });
      },
    };
  };
  // simula a listagem (200 vazio) e depois a criação (402)
  globalThis.fetch = async (url, opts) => {
    if (opts?.method === "GET") {
      return { status: 200, async text() { return JSON.stringify({ deployments: [] }); } };
    }
    return fakeFetch();
  };
  const r = await run({
    token: "fake",
    waitMinutes: 0,
    log: (m) => logs.push(m),
    sleepImpl: async () => {},
  });
  assert.equal(r.status, "quota-deferred");
  assert.equal(calls >= 1, true);
  assert.ok(
    /quota gratuita da vercel esgotada/i.test(logs.join("\n")),
    logs.join("\n")
  );
  delete globalThis.fetch;
});

test("o projeto é configurado para ficar público (sem SSO) antes de publicar", async () => {
  const seen = [];
  globalThis.fetch = async (url, opts) => {
    const u = String(url);
    seen.push({ method: opts?.method, url: u });
    if (opts?.method === "PATCH") {
      const body = JSON.parse(opts.body);
      assert.equal(body.ssoProtection, null, "tem de remover a proteção SSO");
      assert.equal(
        body.rootDirectory,
        "dist",
        "a raiz do projeto é a pasta dist (auto-contida); a string \"null\" quebra o build"
      );
      assert.equal(body.gitProviderOptions.createDeployments, "enabled");
      assert.equal(body.outputDirectory, "dist");
      assert.equal(body.buildCommand, "bash build.sh");
      assert.deepEqual(
        body.git.deploymentEnabled,
        { main: true, "arena/**": false },
        "as branches de trabalho não podem gastar a quota de deploy"
      );
      return { status: 200, async text() { return JSON.stringify({ ssoProtection: null }); } };
    }
    if (opts?.method === "GET") {
      return { status: 200, async text() { return JSON.stringify({ deployments: [] }); } };
    }
    return {
      status: 402,
      async text() {
        return JSON.stringify({
          error: { code: "api-deployments-free-per-day", message: "Try again in 24 hours." },
        });
      },
    };
  };
  const r = await run({
    token: "fake",
    waitMinutes: 0,
    log: () => {},
    sleepImpl: async () => {},
  });
  assert.equal(r.status, "quota-deferred");
  assert.ok(
    seen.some((c) => c.method === "PATCH" && c.url.includes("/v9/projects/")),
    "tem de reconfigurar o projeto"
  );
  delete globalThis.fetch;
});

test("a configuração do projeto cai para o essencial quando a API recusa campos", async () => {
  const patches = [];
  globalThis.fetch = async (url, opts) => {
    if (opts?.method === "PATCH") {
      const body = JSON.parse(opts.body);
      patches.push(body);
      // A primeira tentativa traz campos que a API pode não reconhecer.
      if (body.gitProviderOptions) {
        return {
          status: 400,
          async text() {
            return JSON.stringify({ error: { message: "unrecognized field" } });
          },
        };
      }
      return { status: 200, async text() { return JSON.stringify({ ssoProtection: null }); } };
    }
    if (opts?.method === "GET") {
      return { status: 200, async text() { return JSON.stringify({ deployments: [] }); } };
    }
    return {
      status: 402,
      async text() {
        return JSON.stringify({
          error: { code: "api-deployments-free-per-day", message: "Try again in 24 hours." },
        });
      },
    };
  };
  const logs = [];
  const r = await run({
    token: "fake",
    waitMinutes: 0,
    log: (m) => logs.push(String(m)),
    sleepImpl: async () => {},
  });
  assert.equal(r.status, "quota-deferred");
  assert.equal(patches.length, 2, "tem de tentar o essencial depois da recusa");
  assert.equal(patches[1].ssoProtection, null);
  assert.equal(patches[1].rootDirectory, "dist");
  assert.ok(
    logs.some((l) => /recusada/i.test(l)),
    "tem de registar a recusa da configuração"
  );
  delete globalThis.fetch;
});
