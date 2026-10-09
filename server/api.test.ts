import { describe, expect, it } from 'vitest';
import { handleApi, type UserDb } from './api.ts';

const BASE = 'http://localhost/api';
const post = (path: string, body: unknown, token?: string) =>
  new Request(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

function makeDb(): UserDb & { saves: number } {
  const db = { users: [], saves: 0, persist: async () => void (db.saves += 1) } as UserDb & { saves: number };
  return db;
}

describe('account API over a JSON user list', () => {
  it('registers, logs in and syncs progress for one user', async () => {
    const db = makeDb();
    const reg = await handleApi(post('register', { email: 'Kid@Example.com', name: 'Маша', password: 'abc12345' }), db);
    expect(reg.status).toBe(201);
    const { token } = (await reg.json()) as { token: string };
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(db.users).toHaveLength(1);
    expect(db.users[0]).toMatchObject({ email: 'kid@example.com', name: 'Маша' });
    expect(db.users[0]!.hash).not.toContain('abc12345');
    expect(db.saves).toBe(1);

    const dup = await handleApi(post('register', { email: 'kid@example.com', name: 'Другая', password: 'abc12345' }), db);
    expect(dup.status).toBe(409);

    const bad = await handleApi(post('login', { email: 'kid@example.com', password: 'wrong1234' }), db);
    expect(bad.status).toBe(401);
    const good = await handleApi(post('login', { email: 'KID@example.com', password: 'abc12345' }), db);
    expect(good.status).toBe(200);
    const { token: token2 } = (await good.json()) as { token: string };

    const push = await handleApi(post('sync', { since: 0, topics: [{ topicId: 't6', mastery: 0.5, updatedAt: 5 }] }, token2), db);
    expect(push.status).toBe(200);
    expect(db.users[0]!.progress).toContain('"t6"');

    const pull = await handleApi(post('sync', { since: 0 }, token), db);
    const body = (await pull.json()) as { changes: { topics: { topicId: string }[] } };
    expect(body.changes.topics.map((t) => t.topicId)).toEqual(['t6']);
  });

  it('rejects sync without a valid token and unknown routes', async () => {
    const db = makeDb();
    expect((await handleApi(post('sync', { since: 0 }, 'f'.repeat(64)), db)).status).toBe(401);
    expect((await handleApi(post('sync', { since: 0 }), db)).status).toBe(401);
    expect((await handleApi(post('nope', {}), db)).status).toBe(404);
    expect((await handleApi(new Request(`${BASE}/login`), db)).status).toBe(405);
  });

  it('validates registration input', async () => {
    const db = makeDb();
    const res = await handleApi(post('register', { email: 'bad', name: 'A', password: '1' }), db);
    expect(res.status).toBe(400);
    expect(db.users).toHaveLength(0);
  });
});
