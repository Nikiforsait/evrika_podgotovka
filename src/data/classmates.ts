// Practice opponents used until a class is connected through sync.
// Their answers are deterministic (seeded) so a duel never changes on reload.
import { createRng, randInt } from '@/lib/rng.ts';

export interface Classmate {
  id: string;
  name: string;
  rating: number;
  hue: number; // avatar color
}

export const CLASSMATES: Classmate[] = [
  { id: 'masha', name: 'Маша', rating: 1080, hue: 320 },
  { id: 'dima', name: 'Дима', rating: 1010, hue: 200 },
  { id: 'liza', name: 'Лиза', rating: 960, hue: 140 },
  { id: 'timur', name: 'Тимур', rating: 1120, hue: 30 },
  { id: 'sonya', name: 'Соня', rating: 930, hue: 270 },
  { id: 'gleb', name: 'Глеб', rating: 990, hue: 170 },
];

export const classmateById = (id: string) => CLASSMATES.find((c) => c.id === id);

/** ISO-like week key, e.g. "2026-W41", for weekly leagues. */
export function weekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Weekly XP for a practice opponent, growing over the week. */
export function classmateWeeklyXp(mate: Classmate, now = new Date()): number {
  const rng = createRng(`${weekKey(now)}:${mate.id}`);
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
  const perDay = randInt(rng, 20, 60) + Math.round((mate.rating - 900) / 8);
  return Math.max(0, perDay * (dayOfWeek + 1));
}
