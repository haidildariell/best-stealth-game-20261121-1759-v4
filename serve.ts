// Tiny static server for local playtesting and screenshot capture.
// Serves this repository on http://localhost:8077 — the game itself needs no
// server and no network; this only stands in for one during development.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.ts': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css' };

createServer((req, res) => {
  let path = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (path === '/') path = '/game/index.html';
  const file = join(root, path);
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(8077, () => console.log('serving on http://localhost:8077'));
