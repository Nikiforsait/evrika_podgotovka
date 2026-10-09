// Profile defaults, XP and streak bookkeeping.
import { toLocalDate } from '@/lib/dates.ts';
import { registerActivity } from '@/lib/gamification.ts';
import { weekKey } from './classmates.ts';
import { db, type Profile } from './db.ts';

export const DEFAULT_PROFILE: Profile = {
  id: 'me',
  name: 'Ученик',
  xp: 0,
  streak: 0,
  best: 0,
  freezes: 0,
  lastActive: null,
  activeDays: [],
  challengeStart: null,
  diagnostic: null,
  quickDiagnostic: null,
  diagnosticHistory: [],
  weekly: { week: '', xp: 0 },
  settings: { sounds: true, notifications: false, reducedMotion: false },
  updatedAt: 0,
};

export async function getProfile(): Promise<Profile> {
  const p = await db.profile.get('me');
  if (p) return p;
  await db.profile.put(DEFAULT_PROFILE);
  return DEFAULT_PROFILE;
}

export async function updateProfile(patch: Partial<Omit<Profile, 'id'>>): Promise<void> {
  const p = await getProfile();
  await db.profile.put({ ...p, ...patch, updatedAt: Date.now() });
}

/** Add XP and count today as an active day (streak, 100-day challenge). */
export async function addXpAndActivity(xp: number, today = toLocalDate()): Promise<void> {
  const p = await getProfile();
  const s = registerActivity(p, today);
  const activeDays = p.activeDays.includes(today) ? p.activeDays : [...p.activeDays, today];
  const week = weekKey();
  const weekly = { week, xp: (p.weekly?.week === week ? p.weekly.xp : 0) + xp };
  await db.profile.put({
    ...p,
    xp: p.xp + xp,
    streak: s.streak,
    best: s.best,
    freezes: s.freezes,
    lastActive: s.lastActive,
    activeDays,
    weekly,
    challengeStart: p.challengeStart ?? today,
    updatedAt: Date.now(),
  });
}
