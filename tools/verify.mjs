import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const destination = process.argv[2];
if (!destination) throw new Error('Uso: node tools/verify.mjs <URL pública>');
const local = readFileSync(new URL('../public/index.html', import.meta.url));
const title = 'Dai Friarielli Malagueta · Pizzaria italiana na Parede';
const response = await fetch(destination, { redirect: 'follow', signal: AbortSignal.timeout(15_000), cache: 'no-store' });
assert.equal(response.status, 200, `HTTP ${response.status} em ${response.url}`);
assert.match(response.headers.get('content-type') ?? '', /^text\/html\b/i);
assert.doesNotMatch(response.headers.get('content-disposition') ?? '', /attachment/i);
const received = Buffer.from(await response.arrayBuffer());
assert(received.toString('utf8').includes(`<title>${title}</title>`), 'O título servido não corresponde ao projeto.');
const sha = data => createHash('sha256').update(data).digest('hex');
assert.equal(sha(received), sha(local), `Os ${received.byteLength} bytes servidos não correspondem ao HTML local.`);
console.log(`HTTP ${response.status} · ${response.url}\n${title}\n${received.byteLength} bytes · SHA-256 ${sha(received)}`);
