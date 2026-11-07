import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };

// A bounded verification command owns and closes this preview. No daemon is started.
export async function startPreview() {
  const root = resolve('dist');
  const prefix = '/preview/proposals/flop/';
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (!url.pathname.startsWith(prefix)) { res.writeHead(404).end(); return; }
      const path = resolve(root, decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html');
      if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      const data = await readFile(path);
      res.writeHead(200, { 'content-type': mime[extname(path)] ?? 'application/octet-stream' }).end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return { url: `http://127.0.0.1:${address.port}${prefix}`, close: () => new Promise((resolve) => server.close(resolve)) };
}

export async function playwright() {
  if (process.env.IMD_PLAYWRIGHT) return import(process.env.IMD_PLAYWRIGHT);
  try { return await import('playwright'); }
  catch { return import('/opt/imd-tools/playwright-mcp/node_modules/playwright/index.mjs'); }
}
