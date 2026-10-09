// Aggregates for the profile: per-topic gains, daily activity, achievements.
import { lastNDays, toLocalDate } from '@/lib/dates.ts';
import { CHALLENGE_DAYS } from '@/lib/gamification.ts';
import { db, type Attempt, type Profile } from './db.ts';

export type Period = 'week' | 'month' | 'all';
export const PERIOD_DAYS: Record<Period, number | null> = { week: 7, month: 30, all: null };

const periodStart = (p: Period) => {
  const days = PERIOD_DAYS[p];
  return days === null ? 0 : Date.now() - days * 86_400_000;
};

/** Mastery gained per topic during the period (end mastery − mastery at the start). */
export async function topicGains(period: Period): Promise<Record<string, number>> {
  const start = periodStart(period);
  const all = await db.attempts.orderBy('ts').toArray();
  const before: Record<string, number> = {};
  const after: Record<string, number> = {};
  for (const a of all) {
    if (a.mode === 'diagnostic') continue;
    if (a.ts < start) before[a.topicId] = a.masteryAfter;
    else after[a.topicId] = a.masteryAfter;
  }
  const states = await db.topics.toArray();
  // For "all time", the baseline is the diagnostic starting point if there was one.
  const gains: Record<string, number> = {};
  for (const s of states) {
    const end = after[s.topicId];
    if (end === undefined) continue;
    const base = before[s.topicId] ?? (period === 'all' ? 0 : firstBaseline(all, s.topicId, start));
    gains[s.topicId] = end - base;
  }
  return gains;
}

function firstBaseline(all: Attempt[], topicId: string, start: number): number {
  const first = all.find((a) => a.topicId === topicId && a.ts >= start && a.mode !== 'diagnostic');
  // Approximate the pre-period value by undoing one learning step of the first attempt.
  return first ? Math.max(0, (first.masteryAfter - 0.1 * first.result) / 0.9) : 0;
}

export interface DayActivity {
  date: string;
  tasks: number;
  correct: number;
}

export async function dailyActivity(period: Period): Promise<DayActivity[]> {
  const days = PERIOD_DAYS[period] ?? 60;
  const dates = lastNDays(days);
  const rows = await db.attempts.where('date').aboveOrEqual(dates[0] ?? toLocalDate()).toArray();
  return dates.map((date) => {
    const day = rows.filter((r) => r.date === date);
    return { date, tasks: day.length, correct: day.filter((r) => r.result > 0).length };
  });
}

export interface Achievement {
  id: string;
  title: string;
  hint: string;
  color: string;
  icon: 'flame' | 'star' | 'zap' | 'heart' | 'trophy' | 'target';
  earned: boolean;
}

export async function achievements(p: Profile): Promise<Achievement[]> {
  const tasks = await db.attempts.count();
  const cards = await db.cards.filter((c) => c.reps > 0).count();
  const wins = await db.duels.where('status').equals('won').count();
  return [
    { id: 'start', title: 'Старт', hint: 'Пройди диагностику', color: '#A3E635', icon: 'target', earned: !!p.diagnostic },
    { id: 'streak7', title: 'Неделя огня', hint: 'Стрик 7 дней', color: '#FB923C', icon: 'flame', earned: p.best >= 7 },
    { id: 'xp500', title: '500 XP', hint: 'Набери 500 XP', color: '#A855F7', icon: 'star', earned: p.xp >= 500 },
    { id: 'tasks50', title: 'Разгон', hint: 'Реши 50 заданий', color: '#22D3EE', icon: 'zap', earned: tasks >= 50 },
    { id: 'cards10', title: 'Формулист', hint: 'Выучи 10 формул', color: '#EC4899', icon: 'heart', earned: cards >= 10 },
    { id: 'duel', title: 'Дуэлянт', hint: 'Выиграй дуэль', color: '#FACC15', icon: 'trophy', earned: wins >= 1 },
  ];
}

/** Progress in the 100-day challenge: active days since it started. */
export function challengeProgress(p: Profile): { done: number; total: number } {
  if (!p.challengeStart) return { done: 0, total: CHALLENGE_DAYS };
  const done = p.activeDays.filter((d) => d >= (p.challengeStart ?? '')).length;
  return { done: Math.min(done, CHALLENGE_DAYS), total: CHALLENGE_DAYS };
}
