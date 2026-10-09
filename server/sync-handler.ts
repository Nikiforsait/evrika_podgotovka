// Minimal serverless sync endpoint (Fetch API: Cloudflare Workers, Deno, Vercel Edge…).
// Stores each learner's records and returns everything changed since the
// client's last sync. Plug in any key-value store through `Store`.
//
// SECURITY: this handler trusts the `X-Learner-Id` header. Deploy it ONLY behind
// your provider's authentication (or a signed token) that sets/verifies that
// header; otherwise anyone can read or overwrite any learner's data by guessing
// an id. Everything below assumes the id is already authenticated and only
// defends against malformed or oversized input.

export interface Store {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface Row {
  id?: string;
  topicId?: string;
  updatedAt?: number;
  ts?: number;
  createdAt?: number;
}

type StoredRow = Row & { _serverTs: number };

interface Snapshot {
  profile?: Row & { updatedAt: number };
  tables: Record<string, Record<string, StoredRow>>;
}

const TABLES = ['topics', 'cards', 'duels', 'attempts', 'notes'] as const;
const LEARNER_ID = /^[A-Za-z0-9_-]{8,64}$/;
const KEY = /^[A-Za-z0-9_.:-]{1,64}$/;
const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
export const MAX_BODY_BYTES = 2 * 1024 * 1024;
export const MAX_ROWS_PER_TABLE = 20_000;
export const MAX_ROWS_PER_REQUEST = 5_000;

const keyOf = (row: Row) => (typeof row.id === 'string' ? row.id : typeof row.topicId === 'string' ? row.topicId : '');
const changedAt = (row: Row) => Number(row.updatedAt ?? row.ts ?? row.createdAt ?? 0) || 0;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const bad = (msg: string, status = 400) => new Response(msg, { status });

/** Plain-object map without a prototype, so keys like "__proto__" can't pollute anything. */
const bare = <T>(init?: Record<string, T>): Record<string, T> => Object.assign(Object.create(null) as Record<string, T>, init);

export async function handleSync(req: Request, store: Store): Promise<Response> {
  if (req.method !== 'POST') return bad('Method not allowed', 405);
  const learner = req.headers.get('X-Learner-Id') ?? '';
  if (!LEARNER_ID.test(learner)) return bad('Missing or malformed learner id', 401);
  const length = Number(req.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) return bad('Payload too large', 413);

  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return bad('Payload too large', 413);
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed)) return bad('Body must be an object');
    body = parsed;
  } catch {
    return bad('Invalid JSON');
  }
  const since = Number(body.since);
  if (!Number.isFinite(since) || since < 0) return bad('`since` must be a non-negative number');

  const raw = await store.get(`learner:${learner}`);
  const snap: Snapshot = raw ? (JSON.parse(raw) as Snapshot) : { tables: {} };
  for (const table of TABLES) snap.tables[table] = bare(snap.tables[table]);
  const now = Date.now();

  // Pull first (rows the client hasn't seen), then merge the pushed rows.
  const changes: Record<string, unknown> = { since };
  for (const table of TABLES) {
    const rows = Object.values(snap.tables[table]!);
    changes[table] = rows.filter((r) => r._serverTs > since).map(({ _serverTs: _ignored, ...r }) => r);
  }
  changes.profile = snap.profile && snap.profile.updatedAt > since ? snap.profile : undefined;

  let accepted = 0;
  for (const table of TABLES) {
    const incoming = body[table];
    if (incoming === undefined) continue;
    if (!Array.isArray(incoming)) return bad(`\`${table}\` must be an array`);
    const target = snap.tables[table]!;
    for (const row of incoming) {
      if (!isRecord(row)) continue;
      const key = keyOf(row as Row);
      if (!KEY.test(key) || RESERVED_KEYS.has(key)) continue; // drops empty, odd and prototype-related keys
      if (++accepted > MAX_ROWS_PER_REQUEST) return bad('Too many rows in one request', 413);
      const existing = target[key];
      if (!existing || changedAt(row as Row) >= changedAt(existing)) target[key] = { ...(row as Row), _serverTs: now };
    }
    trim(target, MAX_ROWS_PER_TABLE);
  }
  if (isRecord(body.profile) && typeof body.profile.updatedAt === 'number') {
    const profile = body.profile as Snapshot['profile'] & object;
    if (!snap.profile || profile.updatedAt >= snap.profile.updatedAt) snap.profile = profile;
  }

  await store.put(`learner:${learner}`, JSON.stringify(snap));
  return Response.json({ now, changes });
}

/** Keep the newest `max` rows (by server time) so a single learner can't grow without bound. */
function trim(table: Record<string, StoredRow>, max: number): void {
  const keys = Object.keys(table);
  if (keys.length <= max) return;
  keys
    .sort((a, b) => table[a]!._serverTs - table[b]!._serverTs)
    .slice(0, keys.length - max)
    .forEach((k) => delete table[k]);
}
