import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const local = new URL('../public/index.html', import.meta.url);
const digest = body => createHash('sha256').update(body).digest('hex');

try {
  const target = new URL(process.argv[2] ?? 'https://sorvete-supremo.vercel.app/');
  const expected = await readFile(local);
  const response = await fetch(target, { signal: AbortSignal.timeout(20000) });
  if (response.status !== 200) throw new Error(`HTTP ${response.status}: ${response.url}`);
  if (!response.headers.get('content-type')?.includes('text/html')) throw new Error('O endereço não está servindo HTML.');
  const body = Buffer.from(await response.arrayBuffer());
  const title = body.toString('utf8').match(/<title>([^<]+)<\/title>/i)?.[1];
  if (digest(body) !== digest(expected)) {
    throw new Error(`O conteúdo servido não é o build testado (título: ${title || 'ausente'}, tamanho: ${body.length} B, esperado: ${expected.length} B).`);
  }
  console.log(`HTTP 200 · ${response.url}\n${title} · ${body.length} B · SHA-256 confere com o build local.`);
} catch (error) {
  console.error(`Publicação não verificada: ${error.message}`);
  process.exitCode = 1;
}
