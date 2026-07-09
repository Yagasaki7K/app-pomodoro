import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import './generate-projects-manifest.mjs';

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || process.env.PORT || 5173);
const types = new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.json','application/json; charset=utf-8'],['.msi','application/octet-stream'],['.deb','application/vnd.debian.binary-package'],['.dmg','application/octet-stream']]);

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host}`);
    let filePath = path.join(root, decodeURIComponent(url.pathname));
    if (!filePath.startsWith(root)) throw new Error('Invalid path');
    let fileStat = await stat(filePath).catch(() => null);
    if (!fileStat || fileStat.isDirectory()) filePath = path.join(root, 'index.html');
    const body = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': types.get(path.extname(filePath)) || 'application/octet-stream' });
    response.end(body);
  } catch (error) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, '0.0.0.0', () => console.log(`Pake Hub running at http://localhost:${port}`));
