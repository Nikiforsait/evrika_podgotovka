// Accounts live on the server (server/api.ts, a JSON list of users) when one is
// reachable. The device also keeps the password hash so a known user can sign in
// offline. Without a server at all (static hosting such as GitHub Pages, or a build
// with VITE_API_URL=none) accounts are created and kept on the device only.
import { hashPassword, makeSalt, normalizeEmail, verifyPassword, type RegistrationInput } from '@/lib/auth.ts';
import { trialSubscription } from '@/lib/subscription.ts';
import { db, type Account } from './db.ts';
import { DEFAULT_PROFILE, getProfile, updateProfile } from './profile.ts';
import { sync } from './sync.ts';

const SESSION_KEY = 'session';
export const TOKEN_KEY = 'token';
/** 'server' once the API has answered, 'local' once we learnt there is no API behind this site. */
export const API_MODE_KEY = 'apiMode';
export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').replace(/\/$/, '');
/** Build-time switch for static hosting: no account server, nothing is sent anywhere. */
export const LOCAL_ONLY = API_URL === 'none';
const NO_CONNECTION = 'Сервер аккаунтов недоступен. Проверьте интернет или запуск сервера и попробуйте снова.';

interface ApiResult {
  ok: boolean;
  status: number;
  data: { token?: string; user?: { email: string; name: string }; error?: string };
  /** True when there is no API behind this site at all (static hosting). */
  absent?: boolean;
}

async function call(path: string, body: unknown, token?: string): Promise<ApiResult> {
  if (LOCAL_ONLY) return { ok: false, status: 0, data: {}, absent: true };
  const res = await fetch(`${API_URL}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const isJson = (res.headers.get('content-type') ?? '').includes('json');
  // A static host answers /api/... with its 404 page (HTML): there is no server here.
  if (!isJson && (res.status === 404 || res.status === 405 || res.status === 200)) return { ok: false, status: res.status, data: {}, absent: true };
  const data = (await res.json().catch(() => ({}))) as ApiResult['data'];
  // 502/504 from a proxy or 500 without a JSON body mean the API itself is down.
  if (res.status >= 500 && !data.error) throw new Error(NO_CONNECTION);
  return { ok: res.ok, status: res.status, data };
}

export async function getAccount(): Promise<Account | null> {
  return (await db.profile.get('me'))?.account ?? null;
}

export async function getToken(): Promise<string | null> {
  const row = await db.meta.get(TOKEN_KEY);
  return row ? String(row.value) : null;
}

/** Wipe local progress when a different person signs in on this device. */
async function clearLocalData(): Promise<void> {
  await db.transaction('rw', [db.profile, db.topics, db.attempts, db.cards, db.notes, db.duels, db.meta], async () => {
    await Promise.all([db.profile.clear(), db.topics.clear(), db.attempts.clear(), db.cards.clear(), db.notes.clear(), db.duels.clear(), db.meta.clear()]);
    await db.profile.put(DEFAULT_PROFILE);
  });
}

async function openSession(email: string, name: string | undefined, password: string, token: string | null, fresh = false): Promise<void> {
  const existing = await getAccount();
  if (existing && existing.email !== email) await clearLocalData();
  const salt = makeSalt();
  const account: Account = { email, salt, hash: await hashPassword(password, salt), createdAt: existing?.email === email ? existing.createdAt : Date.now() };
  await getProfile();
  // A new account gets the first month on the max plan as a gift (shown once on /gift).
  await updateProfile({ ...(name === undefined ? {} : { name }), account, ...(fresh ? { subscription: trialSubscription(account.createdAt) } : {}) });
  await db.meta.put({ key: API_MODE_KEY, value: token ? 'server' : 'local' });
  if (token) {
    await db.meta.put({ key: TOKEN_KEY, value: token });
    await db.meta.put({ key: 'lastSync', value: 0 });
  }
  await db.meta.put({ key: SESSION_KEY, value: 1 });
  if (token) void sync();
}

export async function register(input: RegistrationInput): Promise<void> {
  const email = normalizeEmail(input.email);
  let res: ApiResult;
  try {
    res = await call('register', { email, name: input.name.trim(), password: input.password });
  } catch {
    throw new Error(NO_CONNECTION);
  }
  if (res.absent) {
    // No account server behind this site: the account lives on this device only.
    const existing = await getAccount();
    if (existing && existing.email !== email) throw new Error('На этом устройстве уже есть аккаунт. Войдите в него.');
    await openSession(email, input.name.trim(), input.password, null, true);
    return;
  }
  if (!res.ok || !res.data.token) throw new Error(res.data.error ?? 'Не удалось создать аккаунт.');
  await openSession(email, input.name.trim(), input.password, res.data.token, true);
}

const FAIL_DELAY_MS = 800;
let failures = 0;

/** Sign in against the account kept on this device (offline, or no server at all). */
async function loginLocally(email: string, password: string, errorText: string): Promise<void> {
  const local = await getAccount();
  const ok = !!local && local.email === email && (await verifyPassword(password, local.salt, local.hash));
  if (!ok) {
    failures += 1;
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS * Math.min(failures, 5)));
    throw new Error(errorText);
  }
  failures = 0;
  await db.meta.put({ key: SESSION_KEY, value: 1 });
}

export async function login(emailRaw: string, password: string): Promise<void> {
  const email = normalizeEmail(emailRaw);
  let res: ApiResult | null = null;
  try {
    res = await call('login', { email, password });
  } catch {
    res = null; // configured server is down: fall back to the account known on this device
  }
  if (res === null) return loginLocally(email, password, NO_CONNECTION);
  if (res.absent) {
    await db.meta.put({ key: API_MODE_KEY, value: 'local' });
    return loginLocally(email, password, 'Неверная почта или пароль.');
  }
  if (!res.ok || !res.data.token) {
    // Growing delay after each failed attempt makes guessing on a shared device impractical.
    failures += 1;
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS * Math.min(failures, 5)));
    throw new Error(res.data.error ?? 'Неверная почта или пароль.');
  }
  failures = 0;
  await openSession(email, res.data.user?.name, password, res.data.token);
}

export async function logout(): Promise<void> {
  const token = await getToken();
  if (token) {
    await sync().catch(() => undefined);
    call('logout', {}, token).catch(() => undefined);
  }
  await db.meta.delete(TOKEN_KEY);
  await db.meta.put({ key: SESSION_KEY, value: 0 });
}

export async function isSignedIn(): Promise<boolean> {
  return (await db.meta.get(SESSION_KEY))?.value === 1;
}
