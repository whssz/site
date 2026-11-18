import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const index = new URL('../public/index.html', import.meta.url);
const port = Number(process.env.PORT || 4173);
createServer(async (req, res) => {
  const pathname = req.url?.split('?')[0];
  if (pathname !== '/' && pathname !== '/index.html') {
    res.writeHead(pathname === '/favicon.ico' ? 204 : 404).end();
    return;
  }
  try {
    const html = await readFile(index);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': html.length, 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : html);
  } catch {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Gere o site com npm run build.');
  }
}).listen(port, '0.0.0.0', () => console.log(`Sorvete Supremo: http://0.0.0.0:${port}`));
