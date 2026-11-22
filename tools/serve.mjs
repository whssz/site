import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Servidor estático mínimo para pré-visualizar public/ (o mesmo que a Vercel publica).
const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
const port = Number(process.env.PORT || 4173);

createServer(async (req, res) => {
  let pathname = decodeURIComponent((req.url || '/').split('?')[0]);
  if (pathname === '/') pathname = '/index.html';
  const file = path.normalize(path.join(PUBLIC, pathname));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(pathname === '/favicon.ico' ? 204 : 404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(pathname === '/favicon.ico' ? undefined : 'No encontrado. Genera el sitio con: npm run build');
  }
}).listen(port, '0.0.0.0', () => console.log(`Nello's · vista previa en http://0.0.0.0:${port}`));
