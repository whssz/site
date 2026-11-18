import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = fileURLToPath(new URL('../public/index.html', import.meta.url));
const port = Number(process.env.PORT ?? 3000);
createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://local');
  if (url.pathname !== '/' && url.pathname !== '/index.html') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found');
  }
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': statSync(html).size,
    'Cache-Control': 'no-store',
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(html).pipe(res);
}).listen(port, '0.0.0.0', () => console.log(`Avó Maria Pizza pronta na porta ${port}`));
