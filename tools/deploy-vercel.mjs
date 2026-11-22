#!/usr/bin/env node
/**
 * Publicação da Pizzeria Santa Chiara na Vercel, com espera consciente da
 * quota gratuita.
 *
 *   node tools/deploy-vercel.mjs [--wait-minutes N] [--dry-run] [--verify-only]
 *
 * Comportamento:
 *  - Sem `VERCEL_TOKEN` → sai com 0 e avisa que a publicação foi adiada
 *    (o token é um segredo do repositório; não deve ser escrito no código).
 *  - Se a Vercel responder 402 `api-deployments-free-per-day` (limite de 100
 *    implantações por 24 h, partilhado por toda a equipa), o script NÃO
 *    desiste: espera e volta a tentar dentro da orçamento de espera, com
 *    intervalos crescentes e sem nunca lançar pedidos em paralelo.
 *  - Se o orçamento de espera terminar, sai com o código 75 (EX_TEMPFAIL),
 *    que o workflow interpreta como "adiar para a próxima execução agendada".
 *  - Antes de criar uma implantação procura uma já existente para o mesmo
 *    commit, para não gastar quota com duplicados.
 *  - Depois de READY verifica HTTP 200, título e marcadores de conteúdo na
 *    URL pública e grava um relatório em `qa/publicacao.json`.
 *
 * Códigos de saída:
 *   0  sucesso, ou publicação adiada por falta de token
 *   75 quota esgotada — tentar de novo mais tarde
 *   1  falha real (configuração, API, verificação)
 */

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const DEFAULTS = {
  projectId: "prj_5EUI8RpUmLb5PW3OT9TnWVFzZBLy",
  projectName: "pizzeria-santa-chiara-site",
  teamId: "team_z6tahC0dowvMZFiASHvvIgBP",
  repoId: "1440125649",
  // URL pública real do site. O alias automático do projeto
  // (`pizzeria-santa-chiara-site-whsszxx-9424.vercel.app`) está protegido por
  // SSO da Vercel; os domínios ligados ao projeto respondem sem
  // autenticação e são os endereços públicos do site.
  siteUrl: "https://pizzeria-santachiara.vercel.app",
  fallbackUrls: ["https://pizzeria-santa-chiara-v2.vercel.app"],
  titleMarker: "Pizzeria Santa Chiara",
  contentMarkers: ["Santa Chiara", "Avenida 5 de Outubro", "351211522801"],
};

/* ------------------------------------------------------------------ */
/* Funções puras (testáveis sem rede)                                 */
/* ------------------------------------------------------------------ */

/** Deteta o erro de quota gratuita da Vercel (HTTP 402). */
export function isQuotaError(status, body) {
  if (status !== 402) return false;
  const text = JSON.stringify(body ?? "").toLowerCase();
  return (
    text.includes("api-deployments-free-per-day") ||
    text.includes("deployments free per day") ||
    (text.includes("100") && text.includes("deployment"))
  );
}

/** Deteta qualquer erro da API Vercel (mensagem legível). */
export function isApiError(status, body) {
  return status >= 400;
}

/** Extrai a mensagem de erro legível de uma resposta da Vercel. */
export function errorMessage(body) {
  if (!body) return "resposta vazia";
  if (typeof body === "string") return body.slice(0, 300);
  const err = body.error ?? body;
  if (typeof err === "string") return err;
  return err.message ?? err.code ?? JSON.stringify(body).slice(0, 300);
}

/**
 * Intervalo até à próxima tentativa, em segundos.
 * Cresce até `maxSeconds` e adiciona um jitter determinístico simples
 * (baseado na tentativa) para não alinhar pedidos concorrentes.
 */
export function backoffSeconds(attempt, { base = 120, max = 900 } = {}) {
  const exp = Math.min(max, base * 2 ** Math.max(0, attempt - 1));
  const jitter = (attempt * 37) % 61; // 0–60 s determinístico
  return exp + jitter;
}

/** Converte minutos em milissegundos, com teto razoável. */
export function waitBudgetMs(minutes, maxMinutes = 360) {
  const m = Math.max(0, Math.min(minutes, maxMinutes));
  return m * 60 * 1000;
}

/** Calcula a data de reagendamento da quota a partir da mensagem da Vercel. */
export function quotaRetryAt(now, body) {
  const text = JSON.stringify(body ?? "").toLowerCase();
  const hours = text.match(/(\d+)\s*hours?/);
  const days = text.match(/(\d+)\s*days?/);
  let ms = 24 * 60 * 60 * 1000;
  if (hours) ms = Number(hours[1]) * 60 * 60 * 1000;
  else if (days) ms = Number(days[1]) * 24 * 60 * 60 * 1000;
  else {
    const minutes = text.match(/(\d+)\s*minutes?/);
    if (minutes) ms = Number(minutes[1]) * 60 * 1000;
  }
  return new Date(now.getTime() + ms).toISOString();
}

/* ------------------------------------------------------------------ */
/* Cliente da API Vercel                                               */
/* ------------------------------------------------------------------ */

function makeClient({ token, teamId, fetchImpl = fetch, base = "https://api.vercel.com" }) {
  async function call(method, endpoint, body) {
    const url = `${base}${endpoint}${endpoint.includes("?") ? "&" : "?"}teamId=${teamId}`;
    const res = await fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    return { status: res.status, body: parsed };
  }
  return {
    call,
    getDeployment: (id) => call("GET", `/v13/deployments/${id}`),
    createDeployment: (payload) => call("POST", "/v13/deployments?skipAutoDetectionConfirmation=1", payload),
    updateProject: (id, payload) => call("PATCH", `/v9/projects/${id}`, payload),
  };
}

/* ------------------------------------------------------------------ */
/* Verificação pública                                                 */
/* ------------------------------------------------------------------ */

export async function verifyPublicSite(url, { fetchImpl = fetch, timeoutMs = 45000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "pizzeria-santa-chiara-verify/1.0" },
    });
    const body = await res.text();
    const title = (body.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ""])[1].trim();
    return {
      status: res.status,
      ok: res.status === 200,
      title,
      bytes: Buffer.byteLength(body, "utf8"),
      body,
    };
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Fluxo principal                                                     */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const args = { waitMinutes: 45, dryRun: false, verifyOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--wait-minutes") args.waitMinutes = Number(argv[++i]);
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--verify-only") args.verifyOnly = true;
  }
  return args;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function run(options = {}) {
  // A configuração vem do ambiente (workflow) com os valores do repositório
  // como omissão, para que o mesmo script sirva localmente e em CI.
  const opts = {
    ...DEFAULTS,
    projectId: process.env.VERCEL_PROJECT || DEFAULTS.projectId,
    projectName: process.env.VERCEL_PROJECT_NAME || DEFAULTS.projectName,
    teamId: process.env.VERCEL_TEAM || DEFAULTS.teamId,
    repoId: process.env.REPO_ID || DEFAULTS.repoId,
    siteUrl: process.env.SITE_URL || DEFAULTS.siteUrl,
    ...options,
  };
  const token = options.token ?? process.env.VERCEL_TOKEN ?? "";
  const waitMinutes = options.waitMinutes ?? 45;
  const log = options.log ?? console.log;

  if (!token) {
    log("::notice::VERCEL_TOKEN não configurado — publicação adiada (o segredo tem de ser adicionado no repositório).");
    return { status: "skipped", reason: "no-token" };
  }
  if (opts.dryRun) {
    log("· modo --dry-run: nenhum pedido é enviado.");
    return { status: "dry-run" };
  }

  const client = makeClient({ token, teamId: opts.teamId });
  const ref = options.ref ?? process.env.GITHUB_REF_NAME ?? "main";
  const sha = options.sha ?? process.env.GITHUB_SHA ?? "";
  const sleepImpl = options.sleepImpl ?? sleep;

  /* --- 0. configuração do projeto --- *
   * Quatro ajustes são obrigatórios para que o site fique público:
   *  - `rootDirectory: "dist"` — a raiz do projeto é a pasta `dist`, que é
   *    auto-contida (tem o próprio `build.sh` e o próprio `vercel.json`).
   *    A string "null" faz a Vercel procurar um diretório chamado "null" e
   *    o build termina com NOW_SANDBOX_WORKER_ROOTDIR_NOT_EXIST;
   *  - `ssoProtection: null` — sem isso a Vercel exige login da conta
   *    Vercel para ver a página nos aliases automáticos do projeto;
   *  - `buildCommand`/`installCommand`/`outputDirectory` — build estático
   *    em `dist`;
   *  - `git.deploymentEnabled` — só `main` cria implantações. As branches
   *    de trabalho geram previews que são contados na quota de 100
   *    implantações por dia, partilhada por toda a equipa.
   *
   * A API pode rejeitar campos que não reconhece, por isso a configuração
   * é tentada por ordem: primeiro o conjunto completo, depois um conjunto
   * mínimo com o essencial e, por fim, só o que torna a página pública.
   */
  if (!options.skipProjectConfig) {
    const full = {
      name: opts.projectName,
      buildCommand: "bash build.sh",
      installCommand: "echo skip-install",
      outputDirectory: "dist",
      rootDirectory: "dist",
      framework: null,
      ssoProtection: null,
      gitProviderOptions: {
        createDeployments: "enabled",
        disableRepositoryDispatchEvents: false,
      },
      git: {
        deploymentEnabled: {
          main: true,
          "arena/**": false,
        },
      },
    };
    const attempts = [
      full,
      {
        buildCommand: full.buildCommand,
        installCommand: full.installCommand,
        outputDirectory: full.outputDirectory,
        rootDirectory: "dist",
        ssoProtection: null,
      },
      { rootDirectory: "dist", ssoProtection: null },
    ];

    let configured = false;
    for (const settings of attempts) {
      const cfg = await client.updateProject(opts.projectId, settings);
      if (cfg.status >= 200 && cfg.status < 300) {
        configured = true;
        log("· projeto configurado: build `bash build.sh` → `dist`, sem SSO, deploys do GitHub ligados.");
        if (cfg.body?.ssoProtection !== null && cfg.body?.ssoProtection !== undefined) {
          log(`::warning::ssoProtection continua ativo (${JSON.stringify(cfg.body.ssoProtection)}).`);
        }
        break;
      }
      log(`::warning::Configuração do projeto recusada (HTTP ${cfg.status}): ${errorMessage(cfg.body)}`);
    }
    if (!configured) {
      log("::warning::Não foi possível reconfigurar o projeto — a publicação pode falhar.");
    }
  }

  /* --- 1. já existe implantação para este commit? --- */
  if (sha) {
    const list = await client.call(
      "GET",
      `/v13/deployments?limit=20&projectId=${encodeURIComponent(opts.projectId)}`
    );
    if (list.status === 200 && Array.isArray(list.body?.deployments)) {
      const existing = list.body.deployments.find(
        (d) => d.gitSource?.sha === sha && d.target === "production"
      );
      if (existing) {
        log(`· Já existe uma implantação de produção para ${sha.slice(0, 7)} (${existing.uid}). Reutilizando.`);
        opts.existing = existing;
      }
    }
  }

  /* --- 2. criar a implantação (com espera de quota) --- */
  let deployment = opts.existing ?? null;
  let quotaWaits = 0;

  if (!deployment) {
    const deadline = Date.now() + waitBudgetMs(waitMinutes);
    let attempt = 0;
    for (;;) {
      attempt += 1;
      const payload = {
        name: opts.projectName,
        project: opts.projectId,
        target: "production",
        gitSource: { type: "github", ref, sha, repoId: opts.repoId },
      };
      const res = await client.createDeployment(payload);
      log(`· tentativa ${attempt}: POST /v13/deployments → HTTP ${res.status}`);

      if (res.status >= 200 && res.status < 300) {
        deployment = res.body;
        break;
      }
      if (isQuotaError(res.status, res.body)) {
        const retryAt = quotaRetryAt(new Date(), res.body);
        log(
          `::notice::Quota gratuita da Vercel esgotada (HTTP 402 api-deployments-free-per-day). ` +
            `Nova tentativa a partir de ${retryAt}. A quota é partilhada por toda a equipa.`
        );
        if (Date.now() >= deadline) {
          log("::warning::Orçamento de espera esgotado — a publicação fica adiada para a próxima execução.");
          await writeReport({ status: "quota-deferred", retryAt, attempt, quotaWaits });
          return { status: "quota-deferred", retryAt, attempt, quotaWaits };
        }
        const delay = Math.min(backoffSeconds(attempt), Math.max(30_000, deadline - Date.now()));
        quotaWaits += 1;
        await sleepImpl(delay);
        continue;
      }
      log(`::error::Falha da API Vercel: ${errorMessage(res.body)}`);
      await writeReport({ status: "failed", detail: errorMessage(res.body), attempt });
      return { status: "failed", detail: errorMessage(res.body) };
    }
  }

  const id = deployment.id || deployment.uid;
  log(`· implantação ${id} — estado inicial ${deployment.readyState ?? deployment.state ?? "?"}`);
  if (deployment.error) log(`::error::${errorMessage(deployment.error)}`);

  /* --- 3. aguardar o build --- */
  let readyState = deployment.readyState ?? deployment.state ?? "BUILDING";
  let last = null;
  for (let i = 1; i <= 90 && readyState !== "READY"; i++) {
    if (readyState === "ERROR" || readyState === "CANCELED") break;
    await sleepImpl(10_000);
    const poll = await client.getDeployment(id);
    if (poll.status >= 400) {
      log(`::error::Falha ao consultar a implantação: ${errorMessage(poll.body)}`);
      break;
    }
    last = poll.body;
    readyState = poll.body?.readyState ?? "UNKNOWN";
    log(`[${i}/90] readyState=${readyState}`);
    if (readyState === "READY") break;
    if (readyState === "ERROR" || readyState === "CANCELED") {
      log(`::error::A implantação terminou em ${readyState}.`);
      await writeReport({ status: "failed", detail: errorMessage(poll.body?.error), deploymentId: id });
      return { status: "failed", detail: errorMessage(poll.body?.error) };
    }
  }

  if (readyState !== "READY") {
    await writeReport({ status: "failed", detail: `readyState=${readyState}`, deploymentId: id });
    return { status: "failed", detail: `readyState=${readyState}` };
  }

  /* O alias automático do projeto pode estar protegido por SSO da Vercel.
   * Os domínios ligados ao projeto respondem sem autenticação e são os
   * endereços públicos do site: verifica-se o principal e, se falhar,
   * tenta-se o alternativo antes de dar a publicação por perdida. */
  const alias = last?.alias?.find((a) => !a.includes("-git-")) || last?.url || opts.siteUrl;
  const candidates = [
    opts.siteUrl,
    ...(opts.fallbackUrls ?? []),
    alias.startsWith("http") ? alias : `https://${alias}`,
  ].filter(Boolean);

  /* --- 4. verificação pública --- */
  let site = null;
  let publicUrl = candidates[0];
  for (const url of candidates) {
    const attempt = await verifyPublicSite(url);
    const good =
      attempt.ok &&
      attempt.title.includes(opts.titleMarker) &&
      opts.contentMarkers.every((m) => attempt.body.includes(m));
    log(
      `· verificação pública em ${url}: HTTP ${attempt.status}, ${attempt.bytes} bytes, título "${attempt.title}"` +
        (good ? " ✓" : "")
    );
    if (good) {
      site = attempt;
      publicUrl = url;
      break;
    }
    if (!site) site = attempt;
  }

  const markersOk = opts.contentMarkers.every((m) => site.body.includes(m));
  const titleOk = site.title.includes(opts.titleMarker);
  const ok = site.ok && markersOk && titleOk;

  await writeReport({
    status: ok ? "published" : "failed",
    url: publicUrl,
    deploymentId: id,
    httpStatus: site.status,
    bytes: site.bytes,
    title: site.title,
    markersOk,
    titleOk,
    quotaWaits,
    attempt: undefined,
  });

  if (!ok) {
    log("::error::A página pública não passou a verificação.");
    return { status: "failed", detail: "verificação pública" };
  }

  log(`✓ Publicado em ${publicUrl}`);
  return { status: "published", url: publicUrl, deploymentId: id };
}

async function writeReport(data) {
  try {
    const dir = path.join(ROOT, "qa");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "publicacao.json"),
      JSON.stringify({ geradoEm: new Date().toISOString(), ...data }, null, 2) + "\n",
      "utf8"
    );
  } catch {
    /* o relatório é informativo */
  }
}

/* ------------------------------------------------------------------ */
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const args = parseArgs(process.argv.slice(2));
  const result = await run({
    waitMinutes: args.waitMinutes,
    dryRun: args.dryRun,
    verifyOnly: args.verifyOnly,
  });
  if (result.status === "quota-deferred") process.exit(75);
  if (result.status === "failed") process.exit(1);
  process.exit(0);
}
