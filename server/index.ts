// Node server: the account/progress API over a JSON file plus static hosting of
// the built site (dist/). Run: node server/index.ts   (PORT and DATA_FILE optional)
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { rename, writeFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { handleApi, type UserDb, type UserRecord } from './api.ts';
import { MAX_BODY_BYTES } from './sync-handler.ts';

const PORT = Number(process.env.PORT ?? 8787);
const DATA_FILE = resolve(process.env.DATA_FILE ?? 'server/data/users.json');
const DIST = resolve('dist');
/** Set when the site is hosted on another origin (e.g. GitHub Pages) and talks to this API across domains. */
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? '';

// ---------- JSON list of users on disk ----------
function load(): UserRecord[] {
  if (!existsSync(DATA_FILE)) return [];
  const parsed: unknown = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  return Array.isArray(parsed) ? (parsed as UserRecord[]) : [];
}

let writing: Promise<void> = Promise.resolve();
const db: UserDb = {
  users: load(),
  persist() {
    // Serialize writes and replace the file atomically so a crash never leaves it half-written.
    writing = writing.catch(() => undefined).then(async () => {
      mkdirSync(resolve(DATA_FILE, '..'), { recursive: true });
      const tmp = `${DATA_FILE}.tmp`;
      const json = JSON.stringify(db.users, null, 2);
      await writeFile(tmp, json);
      try {
        await rename(tmp, DATA_FILE);
      } catch {
        // Windows (and synced folders such as OneDrive) can hold the file open for a moment:
        // fall back to writing in place rather than failing the request.
        await writeFile(DATA_FILE, json);
      }
    });
    return writing;
  },
};

// ---------- helpers ----------
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.gz': 'application/gzip',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

function readBody(req: IncomingMessage): Promise<string | null> {
  return new Promise((done) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        req.destroy();
        done(null);
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => done(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => done(null));
  });
}

function securityHeaders(res: ServerResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

async function serveApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (body === null) {
    res.writeHead(413).end('Payload too large');
    return;
  }
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  const request = new Request(`http://localhost${req.url ?? '/'}`, { method: req.method, headers, body: req.method === 'POST' ? body : undefined });
  const response = await handleApi(request, db, req.socket.remoteAddress ?? 'anon');
  res.writeHead(response.status, { 'content-type': response.headers.get('content-type') ?? 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
  res.end(await response.text());
}

function serveStatic(req: IncomingMessage, res: ServerResponse): void {
  if (!existsSync(DIST)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Сайт ещё не собран: выполните npm run build.');
    return;
  }
  const url = new URL(req.url ?? '/', 'http://localhost');
  const safe = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, safe);
  if (!file.startsWith(DIST)) file = join(DIST, 'index.html');
  if (!existsSync(file) || extname(file) === '') file = join(DIST, 'index.html'); // SPA fallback
  const ext = extname(file);
  const immutable = /\/assets\//.test(file.replace(/\\/g, '/'));
  res.writeHead(200, {
    'content-type': MIME[ext] ?? 'application/octet-stream',
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  res.end(readFileSync(file));
}

createServer((req, res) => {
  securityHeaders(res);
  if (CORS_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
  }
  const path = (req.url ?? '/').split('?')[0] ?? '/';
  if (path.startsWith('/api/')) {
    void serveApi(req, res).catch((err: unknown) => {
      console.error('API error:', err);
      if (!res.headersSent) res.writeHead(500);
      res.end('Server error');
    });
  } else if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res);
  } else {
    res.writeHead(405).end();
  }
})
  .on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Эврика: порт ${PORT} уже занят — сервер аккаунтов, похоже, уже запущен.`);
      process.exit(0);
    }
    throw err;
  })
  .listen(PORT, () => {
    console.log(`Эврика: API и сайт на http://localhost:${PORT} (пользователи: ${DATA_FILE})`);
  });
