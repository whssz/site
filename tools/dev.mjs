import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const index = new URL('../public/index.html', import.meta.url);
const port = Number(process.env.PORT ?? 4173);
createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (!['/', '/index.html'].includes(pathname)) {
    response.writeHead(404).end('Não encontrado.');
    return;
  }
  try {
    const html = await readFile(index);
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': html.byteLength,
      'Cache-Control': 'no-store'
    });
    response.end(request.method === 'HEAD' ? undefined : html);
  } catch {
    response.writeHead(503).end('Execute npm run build para gerar o site.');
  }
}).listen(port, '0.0.0.0', () => console.log(`Dai Friarielli Malagueta · porta ${port}`));
