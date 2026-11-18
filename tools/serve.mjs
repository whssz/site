import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const port = process.env.PORT || 4173;
const index = new URL('../public/index.html', import.meta.url);
createServer(async (req, res) => {
  const path = req.url.split('?')[0];
  if (path !== '/' && path !== '/index.html') {
    res.writeHead(404).end('Página não encontrada');
    return;
  }
  try {
    const html = await readFile(index);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': html.byteLength, 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : html);
  } catch {
    res.writeHead(500).end('Execute npm run build para gerar o site.');
  }
}).listen(port, '0.0.0.0', () => console.log(`Brutta disponível na porta ${port}`));
