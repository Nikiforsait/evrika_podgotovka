// XP, levels, tiers and streaks with freeze tokens.
import { daysBetween } from './dates.ts';

export const XP_FOR_LEVEL = { 0: 6, 1: 10, 2: 15, 3: 20 } as const;
export const MAX_FREEZES = 2;
export const CHALLENGE_DAYS = 100;

export function xpForAnswer(level: 0 | 1 | 2 | 3, result: number): number {
  if (result >= 1) return XP_FOR_LEVEL[level];
  if (result > 0) return Math.round(XP_FOR_LEVEL[level] / 2);
  return 2;
}

/** Level n needs 50·n·(n−1) XP in total: 0, 100, 300, 600, … */
export function levelFromXp(xp: number): { level: number; current: number; next: number } {
  let level = 1;
  while (50 * (level + 1) * level <= xp) level++;
  const floor = 50 * level * (level - 1);
  return { level, current: xp - floor, next: 100 * level };
}

export type Tier = 'novice' | 'confident' | 'expert';
export const TIER_LABELS: Record<Tier, string> = {
  novice: 'Новичок',
  confident: 'Уверенный',
  expert: 'Эксперт',
};

export function tierFromXp(xp: number): Tier {
  if (xp >= 3000) return 'expert';
  if (xp >= 600) return 'confident';
  return 'novice';
}

export interface StreakState {
  streak: number;
  best: number;
  freezes: number;
  lastActive: string | null; // local date
}

/**
 * Register activity on `today`. Missed days are covered by freeze tokens when
 * possible; otherwise the streak restarts. A token is earned every 7 days.
 */
export function registerActivity(s: StreakState, today: string): StreakState & { usedFreezes: number } {
  if (s.lastActive === today) return { ...s, usedFreezes: 0 };
  const missed = s.lastActive ? daysBetween(s.lastActive, today) - 1 : 0;
  let streak: number;
  let freezes = s.freezes;
  let usedFreezes = 0;
  if (!s.lastActive || missed < 0) streak = 1;
  else if (missed === 0) streak = s.streak + 1;
  else if (missed <= freezes) {
    usedFreezes = missed;
    freezes -= missed;
    streak = s.streak + 1;
  } else streak = 1;

  if (streak > 0 && streak % 7 === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);
  return { streak, best: Math.max(s.best, streak), freezes, lastActive: today, usedFreezes };
}

/** Streak as seen today: drops to 0 if a gap can't be covered by freezes. */
export function currentStreak(s: StreakState, today: string): number {
  if (!s.lastActive) return 0;
  const missed = daysBetween(s.lastActive, today) - 1;
  return missed <= s.freezes ? s.streak : 0;
}
