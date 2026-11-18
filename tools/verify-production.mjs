// Public post-deployment acceptance: read-only, no credentials and no customer data.
// Only the restaurant's verified production domain is eligible for this check.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const published=JSON.parse(readFileSync(new URL('../qa/publicacao.json',import.meta.url),'utf8'));
assert.equal(published.url,'https://la-pizzaria-napolitana.vercel.app/');
const response=await fetch(published.url,{redirect:'error',signal:AbortSignal.timeout(25000),headers:{Accept:'text/html','Accept-Encoding':'identity'}});
assert.equal(response.status,200);assert.match(response.headers.get('content-type')||'',/^text\/html\b/i);assert(!/attachment/i.test(response.headers.get('content-disposition')||''));
const body=Buffer.from(await response.arrayBuffer());const title=body.toString('utf8').match(/<title>([^<]+)<\/title>/i)?.[1];
const sha256=createHash('sha256').update(body).digest('hex');
assert.equal(title,published.title);assert.equal(body.length,published.bytes);assert.equal(sha256,published.sha256);
console.log(`PASS · HTTP ${response.status} · ${body.length} bytes · HTML público, sem login ou anexo\nTítulo: ${title}\nSHA-256: ${sha256}`);
