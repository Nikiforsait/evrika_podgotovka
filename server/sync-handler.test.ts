import { describe, expect, it } from 'vitest';
import { handleSync, MAX_ROWS_PER_REQUEST, type Store } from './sync-handler.ts';

const memory = (): Store & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, get: async (k) => data.get(k) ?? null, put: async (k, v) => void data.set(k, v) };
};
const post = (body: unknown, learner = 'learner-123456') =>
  new Request('http://x/sync', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Learner-Id': learner }, body: typeof body === 'string' ? body : JSON.stringify(body) });

describe('sync handler hardening', () => {
  it('rejects missing, malformed or oversized input', async () => {
    expect((await handleSync(post({ since: 0 }, ''), memory())).status).toBe(401);
    expect((await handleSync(post({ since: 0 }, 'a/b'), memory())).status).toBe(401);
    expect((await handleSync(post('{not json'), memory())).status).toBe(400);
    expect((await handleSync(post({ since: -1 }), memory())).status).toBe(400);
    expect((await handleSync(post({ since: 0, attempts: 'nope' }), memory())).status).toBe(400);
    const many = Array.from({ length: MAX_ROWS_PER_REQUEST + 1 }, (_, i) => ({ id: `a${i}`, ts: i }));
    expect((await handleSync(post({ since: 0, attempts: many }), memory())).status).toBe(413);
  });

  it('ignores prototype-polluting and empty keys, keeps valid rows', async () => {
    const store = memory();
    const res = await handleSync(post({ since: 0, topics: [{ id: '__proto__', updatedAt: 1, polluted: true }, { topicId: 't1', updatedAt: 5 }, { updatedAt: 3 }] }), store);
    expect(res.status).toBe(200);
    const snap = JSON.parse(store.data.get('learner:learner-123456')!);
    expect(Object.keys(snap.tables.topics)).toEqual(['t1']);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('returns rows changed since the cursor and merges newer rows', async () => {
    const store = memory();
    const first = await handleSync(post({ since: 0, topics: [{ topicId: 't1', updatedAt: 5, mastery: 0.2 }] }), store);
    const { now } = (await first.json()) as { now: number };
    await new Promise((r) => setTimeout(r, 2));
    const second = await handleSync(post({ since: now, topics: [{ topicId: 't1', updatedAt: 4, mastery: 0.9 }] }), store);
    const body = (await second.json()) as { changes: { topics: { mastery: number }[] } };
    expect(body.changes.topics).toEqual([]); // nothing newer than the cursor on the server
    const snap = JSON.parse(store.data.get('learner:learner-123456')!);
    expect(snap.tables.topics.t1.mastery).toBe(0.2); // older update (4 < 5) did not win
  });
});
