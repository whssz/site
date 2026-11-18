import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const raw = process.argv[2];
if (!raw) throw Error('Uso: node tools/verify-deploy.mjs https://<projeto>.vercel.app/');
const url = new URL(raw);
if (url.protocol !== 'https:' || url.username || url.password) throw Error('Indique o endereço HTTPS público, sem credenciais.');
const expected = await readFile(new URL('../public/index.html', import.meta.url));
const wait = Number(process.argv[3] || 0);
if (!Number.isFinite(wait) || wait < 0 || wait > 300) throw Error('O tempo de espera opcional é de 0 a 300 segundos.');
const end = Date.now() + wait * 1000;
async function verify() {
  const response = await fetch(url, { headers: { accept: 'text/html', 'accept-encoding': 'identity' }, redirect: 'manual', signal: AbortSignal.timeout(20_000) });
  assert.equal(response.status, 200, `Resposta pública: HTTP ${response.status}`);
  assert.match(response.headers.get('content-type') || '', /^text\/html\b/i);
  const disposition = response.headers.get('content-disposition');
  assert(disposition === null || /^inline(?:;|$)/i.test(disposition), `Content-Disposition inesperado: ${disposition}`);
  const served = Buffer.from(await response.arrayBuffer());
  const title = buffer => buffer.toString('utf8').match(/<title>([^<]+)<\/title>/i)?.[1];
  assert(title(expected), 'Falta o título no build.');
  assert.equal(title(served), title(expected));
  assert.equal(served.byteLength, expected.byteLength);
  const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256(served), sha256(expected));
  console.log(`${response.url} · HTTP 200 · ${title(served)} · ${served.byteLength} bytes · ${disposition || 'sem Content-Disposition (inline)'} · SHA-256 ${sha256(served)}`);
}
while (true) {
  try { await verify(); break; }
  catch (error) {
    if (Date.now() >= end) throw error;
    await delay(5000);
  }
}
